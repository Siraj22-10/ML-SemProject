"""
app.py — FastAPI Backend Application for FeedForYou Recommendation Engine.

Exposes REST API endpoints:
- GET /api/feed?topic=...&model=...
- GET /api/recommend/{video_id}?model=...&count=...
- GET /api/models/compare
- GET /api/youtube/live
"""
import os
import sys
import json
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

# Add ml_engine and backend to Python import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_engine")))
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from dataset_loader import load_dataset
from model_tfidf_knn import TFIDFKNNRecommender
from model_xgboost_ranker import XGBoostRankerRecommender
from model_lsa_hybrid import LSAHybridRecommender
from services.youtube_service import fetch_live_streams

app = FastAPI(
    title="FeedForYou ML Recommendation API",
    description="Multi-Model Classical ML Recommendation Backend with YouTube Data API v3 Live Integration",
    version="2.0.0"
)

# Enable CORS for frontend Vite server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
models = {}
df_dataset = None
benchmarks_cache = None

@app.on_event("startup")
def startup_event():
    global models, df_dataset, benchmarks_cache
    print("Initializing FeedForYou ML Recommendation Engine...")
    df_dataset = load_dataset(max_records=5000)

    print("Fitting Model 1: Sparse TF-IDF + Cosine KNN...")
    models["m1"] = TFIDFKNNRecommender().fit(df_dataset)

    print("Fitting Model 2: XGBoost Engagement Ranker...")
    models["m2"] = XGBoostRankerRecommender().fit(df_dataset)

    print("Fitting Model 3: Dense LSA Hybrid Re-ranker...")
    models["m3"] = LSAHybridRecommender().fit(df_dataset)

    # Load offline benchmarks
    benchmarks_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_engine", "benchmarks.json"))
    if os.path.exists(benchmarks_path):
        with open(benchmarks_path, "r", encoding="utf-8") as f:
            benchmarks_cache = json.load(f)
    print("FeedForYou Backend Ready!")

def format_video_item(idx, row):
    """Formats pandas row into frontend UI video object."""
    vid = row['video_id']
    topic = row['topic']
    channel = str(row.get('channelTitle', 'Unknown'))
    views = int(row.get('view_count', 0))

    formatted_views = f"{views/1e6:.1f}M views" if views >= 1e6 else (f"{views/1e3:.1f}K views" if views >= 1e3 else f"{views} views")

    return {
        "id": f"v{idx + 1}",
        "videoId": vid,
        "title": str(row['title']).strip(),
        "thumbnail": f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg",
        "thumbnailHQ": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
        "channelName": channel,
        "channelAvatar": channel[:2].upper(),
        "channelAvatarColor": "#8e44ad" if topic == "Entertainment" else "#27ae60",
        "views": formatted_views,
        "likes": int(row.get('likes', 0)),
        "uploadedAt": "Recent",
        "duration": "10:15",
        "topics": [topic],
        "xgb_score": round(float(row.get('xgb_score', 0)), 4) if 'xgb_score' in row else None,
        "hybrid_score": round(float(row.get('hybrid_score', 0)), 4) if 'hybrid_score' in row else None
    }

@app.get("/api/feed")
def get_feed(
    topic: str = Query("All", description="Topic filter"),
    model: str = Query("m3", description="Recommendation model (m1, m2, m3, live)"),
    count: int = Query(24, description="Number of items to return")
):
    """Returns main feed recommendations powered by selected ML model."""
    if model == "live":
        return fetch_live_streams(q=topic if topic != "All" else "live stream", max_results=count)

    active_model = models.get(model, models["m3"])
    raw_recs = active_model.get_feed(topic=topic, count=count)

    formatted = [format_video_item(i, item) for i, item in enumerate(raw_recs)]
    return formatted

@app.get("/api/recommend/{video_id}")
def get_recommendations(
    video_id: str,
    model: str = Query("m3", description="Recommendation model (m1, m2, m3)"),
    count: int = Query(8, description="Number of recommendations")
):
    """Returns video-to-video recommendations using selected ML model."""
    active_model = models.get(model, models["m3"])
    raw_recs, latency_ms = active_model.recommend(video_id=video_id, count=count)

    formatted = [format_video_item(i, item) for i, item in enumerate(raw_recs)]
    return {
        "model_used": model,
        "latency_ms": round(latency_ms, 2),
        "recommendations": formatted
    }

@app.get("/api/models/compare")
def get_model_benchmarks():
    """Returns comparative model benchmark metrics (Precision@10, Recall@10, NDCG@10, Latency)."""
    if benchmarks_cache:
        return benchmarks_cache
    return {"status": "error", "message": "Benchmarks not yet computed. Run evaluate.py."}

@app.get("/api/youtube/live")
def get_youtube_live_streams(q: str = "live stream", count: int = 12):
    """Fetches real-time YouTube live streams via YouTube Data API v3 with automatic fallback."""
    return fetch_live_streams(q=q, max_results=count)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "models_loaded": list(models.keys()),
        "dataset_records": len(df_dataset) if df_dataset is not None else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
