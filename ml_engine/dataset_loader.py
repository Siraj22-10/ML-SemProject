"""
dataset_loader.py — Kaggle Trending Dataset ingestion & feature engineering module.

Loads IN_youtube_trending_data.csv and IN_category_id.json, cleans video records,
constructs combined text features for TF-IDF / LSA, and computes log-scaled engagement
targets (views, likes, comments, recency) for Model 2 (XGBoost) and Model 3 (LSA Hybrid).
"""
import os
import json
import math
import pandas as pd
import numpy as np
from datetime import datetime, timezone

ROOT_DIR = "E:/Ml-Project"
CSV_PATH = os.path.join(ROOT_DIR, "IN_youtube_trending_data.csv")
CAT_JSON_PATH = os.path.join(ROOT_DIR, "IN_category_id.json")

CATEGORY_TO_TOPIC = {
    1:  "Entertainment",     # Film & Animation
    2:  "Entertainment",     # Autos & Vehicles
    10: "Music",
    15: "Entertainment",     # Pets & Animals
    17: "Sports",
    20: "Gaming",
    22: "People & Blogs",
    23: "Entertainment",     # Comedy
    24: "Entertainment",
    25: "News & Politics",
    26: "Howto & Style",
    27: "Education",
    28: "Science & Tech",
    29: "Nonprofits & Activism",
    30: "Entertainment",     # Movies
    44: "Entertainment",     # Trailers
}

def load_dataset(max_records=15000):
    """
    Loads, deduplicates, and engineers features for the Kaggle dataset.
    Returns a cleaned Pandas DataFrame with columns:
    ['video_id', 'title', 'channelTitle', 'categoryId', 'topic', 'view_count',
     'likes', 'comment_count', 'publishedAt', 'tags', 'text_corpus',
     'log_views', 'like_ratio', 'comment_ratio', 'engagement_index']
    """
    if not os.path.exists(CSV_PATH) or not os.path.exists(CAT_JSON_PATH):
        raise FileNotFoundError(f"Missing dataset files in {ROOT_DIR}")

    # Load category mappings
    with open(CAT_JSON_PATH, "r", encoding="utf-8") as f:
        cat_data = json.load(f)
    cat_map = {int(item["id"]): item["snippet"]["title"] for item in cat_data.get("items", [])}

    # Load CSV
    df = pd.read_csv(CSV_PATH, encoding="utf-8")

    # Clean numeric columns
    df["view_count"] = pd.to_numeric(df["view_count"], errors="coerce").fillna(0).astype(int)
    df["likes"] = pd.to_numeric(df["likes"], errors="coerce").fillna(0).astype(int)
    df["comment_count"] = pd.to_numeric(df["comment_count"], errors="coerce").fillna(0).astype(int)

    # Deduplicate keeping highest view count row for each video
    df = df.sort_values("view_count", ascending=False).drop_duplicates(subset=["video_id"], keep="first")

    # Filter invalid records
    df = df[df["title"].notna() & (df["title"].str.strip() != "")]
    df = df[~df["title"].str.contains(r"#shorts|Deleted video", case=False, na=False)]
    df = df[df["video_id"].notna() & (df["video_id"].str.len() == 11)]
    df = df[df["view_count"] >= 10000]

    # Map categories to topic labels
    df["topic"] = df["categoryId"].map(CATEGORY_TO_TOPIC).fillna("Entertainment")
    df["category_name"] = df["categoryId"].map(cat_map).fillna("General")

    # Limit to max_records for fast training/inference
    if len(df) > max_records:
        df = df.head(max_records).copy()

    # Build rich text corpus for text representations
    df["tags"] = df["tags"].fillna("").astype(str).str.replace("|", " ", regex=False)
    df["text_corpus"] = (
        df["title"].astype(str) + " " +
        df["channelTitle"].astype(str) + " " +
        df["topic"].astype(str) + " " +
        df["category_name"].astype(str) + " " +
        df["tags"].astype(str)
    )

    # Feature Engineering (Numerical signals for XGBoost & Re-ranking)
    df["log_views"] = np.log1p(df["view_count"])
    df["like_ratio"] = df["likes"] / (df["view_count"] + 1.0)
    df["comment_ratio"] = df["comment_count"] / (df["view_count"] + 1.0)

    # Target engagement index (Composite score for supervised ranker)
    max_log_views = df["log_views"].max() if df["log_views"].max() > 0 else 1.0
    max_like_ratio = df["like_ratio"].max() if df["like_ratio"].max() > 0 else 1.0
    max_comment_ratio = df["comment_ratio"].max() if df["comment_ratio"].max() > 0 else 1.0

    df["engagement_index"] = (
        0.6 * (df["log_views"] / max_log_views) +
        0.3 * (df["like_ratio"] / max_like_ratio) +
        0.1 * (df["comment_ratio"] / max_comment_ratio)
    )

    return df.reset_index(drop=True)

if __name__ == "__main__":
    df = load_dataset(max_records=1000)
    print(f"Loaded dataset: {len(df)} rows. Columns: {list(df.columns)}")
