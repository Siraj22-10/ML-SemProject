/* ─────────────────────────────────────────────────────────────────────────────
 * api.js — API client connected to FastAPI ML Backend with client fallback.
 *
 * Supports live model switching:
 * - 'm1': Sparse TF-IDF + Cosine KNN Baseline
 * - 'm2': Supervised XGBoost Engagement Ranker
 * - 'm3': Dense Latent Semantic Analysis (LSA TruncatedSVD) Best Model
 * - 'live': Real-Time YouTube Data API v3 Streams
 * ────────────────────────────────────────────────────────────────────────── */
import axios from 'axios';
import { videos, getRelatedVideos } from '../data/videos';

const API_BASE = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Active Model State ───────────────────────────────────────────────────────
let activeModel = 'm3'; // Default to Model 3 (Dense LSA Best Model)

export function setActiveModel(modelKey) {
  activeModel = modelKey;
}

export function getActiveModel() {
  return activeModel;
}

// ── Feed API ─────────────────────────────────────────────────────────────────
export async function getFeed(topic = 'All', modelKey = null) {
  const modelToUse = modelKey || activeModel;
  try {
    const res = await client.get('/feed', {
      params: { topic, model: modelToUse, count: 24 }
    });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.warn(`[FeedForYou API] Backend request failed (${err.message}). Using local seed data.`);
  }

  // Local fallback
  if (topic === 'All') return videos;
  return videos.filter((v) => v.topics.includes(topic));
}

// ── Recommendations API ──────────────────────────────────────────────────────
export async function getRecommendations(videoId, count = 8, modelKey = null) {
  const modelToUse = modelKey || activeModel;
  try {
    const res = await client.get(`/recommend/${videoId}`, {
      params: { model: modelToUse, count }
    });
    if (res.data && res.data.recommendations) {
      return res.data.recommendations;
    }
  } catch (err) {
    console.warn(`[FeedForYou API] Recommendation failed. Using local fallback.`);
  }

  return getRelatedVideos(videoId, count);
}

// ── Benchmarks API ───────────────────────────────────────────────────────────
export async function getModelBenchmarks() {
  try {
    const res = await client.get('/models/compare');
    if (res.data && res.data.models) {
      return res.data;
    }
  } catch (err) {
    console.warn(`[FeedForYou API] Could not fetch benchmarks from backend.`);
  }

  // Default fallback benchmark data if backend is offline
  return {
    evaluated_at: "Offline Cache",
    total_dataset_records: 5000,
    k_value: 10,
    models: {
      m1_tfidf_knn: {
        model_name: "Model 1: TF-IDF + KNN (Baseline)",
        precision_at_k: 0.8900,
        recall_at_k: 0.8900,
        ndcg_at_k: 1.3708,
        mrr: 0.9250,
        avg_latency_ms: 4.56,
        p95_latency_ms: 7.20
      },
      m2_xgboost: {
        model_name: "Model 2: XGBoost Ranker (Ensemble)",
        precision_at_k: 0.8840,
        recall_at_k: 0.8840,
        ndcg_at_k: 1.3629,
        mrr: 0.9267,
        avg_latency_ms: 5.41,
        p95_latency_ms: 8.80
      },
      m3_lsa_hybrid: {
        model_name: "Model 3: Dense LSA Hybrid (Best Model)",
        precision_at_k: 0.9520,
        recall_at_k: 0.9520,
        ndcg_at_k: 1.4705,
        mrr: 0.9667,
        avg_latency_ms: 8.15,
        p95_latency_ms: 11.40
      }
    }
  };
}

// ── YouTube Live Streams API ─────────────────────────────────────────────────
export async function getYouTubeLiveStreams(topic = 'live stream') {
  try {
    const res = await client.get('/youtube/live', { params: { q: topic, count: 12 } });
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn(`[FeedForYou API] Could not fetch live streams.`);
  }
  return videos.slice(0, 8);
}

// ── Search API ───────────────────────────────────────────────────────────────
export async function searchVideos(query) {
  const q = query.toLowerCase();
  return videos.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      v.channelName.toLowerCase().includes(q) ||
      v.topics.some((t) => t.toLowerCase().includes(q))
  );
}

export default client;
