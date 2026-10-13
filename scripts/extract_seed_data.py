"""
extract_seed_data.py — One-off script to extract ~50 diverse, high-quality
videos from the Kaggle IN_youtube_trending_data.csv and write them directly
to the FeedForYou frontend seed file: src/data/videos.js

Usage:
    python feedforyou/scripts/extract_seed_data.py
"""
import json
import math
import os
import random
from datetime import datetime, timezone

import pandas as pd

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT          = "E:/Ml-Project"
CSV_PATH      = os.path.join(ROOT, "IN_youtube_trending_data.csv")
CAT_JSON_PATH = os.path.join(ROOT, "IN_category_id.json")
OUTPUT_PATH   = os.path.join(ROOT, "feedforyou/frontend/src/data/videos.js")

# ── Config ───────────────────────────────────────────────────────────────────
VIDEOS_PER_CATEGORY = 5          # target per topic chip
SHORTS_COUNT        = 8          # short-form entries for the Shorts shelf
MIN_VIEWS           = 100_000    # quality floor
random.seed(42)

# ── Category ID → our topic chip labels ──────────────────────────────────────
# We map Kaggle category IDs to the TOPICS array used in TopicChips.jsx.
# Some Kaggle categories get merged; others are kept 1:1.
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

# Colors assigned per topic for channel avatars
TOPIC_COLORS = {
    "Music":              "#e74c3c",
    "Gaming":             "#27ae60",
    "Science & Tech":     "#2980b9",
    "Entertainment":      "#8e44ad",
    "Education":          "#f39c12",
    "Sports":             "#1abc9c",
    "News & Politics":    "#34495e",
    "People & Blogs":     "#d35400",
    "Howto & Style":      "#e91e63",
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def format_views(n):
    """Format a view count like YouTube: 1.2B, 45M, 320K, 8.5K."""
    try:
        n = int(n)
    except (ValueError, TypeError):
        return "0 views"
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.1f}B views"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M views"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K views"
    return f"{n} views"


def time_ago(published_str):
    """Convert ISO date string to a human 'X years/months ago' string."""
    try:
        pub = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        delta = now - pub
        days = delta.days
        if days >= 365:
            years = days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
        if days >= 30:
            months = days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        if days >= 7:
            weeks = days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        if days >= 1:
            return f"{days} day{'s' if days > 1 else ''} ago"
        return "Today"
    except Exception:
        return "1 year ago"


def make_initials(channel_name):
    """Generate 2-char initials from a channel name."""
    parts = channel_name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return channel_name[:2].upper()


def estimate_duration(view_count, category):
    """
    The CSV doesn't have duration, so we synthesize a plausible one
    based on category norms. This is purely cosmetic for the UI badge.
    """
    ranges = {
        "Music":           (180, 360),      # 3–6 min
        "Gaming":          (600, 3600),     # 10–60 min
        "Science & Tech":  (480, 1800),     # 8–30 min
        "Education":       (600, 5400),     # 10–90 min
        "Entertainment":   (300, 1200),     # 5–20 min
        "Sports":          (120, 600),      # 2–10 min
        "News & Politics": (180, 900),      # 3–15 min
        "People & Blogs":  (300, 1200),     # 5–20 min
        "Howto & Style":   (300, 900),      # 5–15 min
    }
    lo, hi = ranges.get(category, (300, 900))
    secs = random.randint(lo, hi)
    hours = secs // 3600
    mins = (secs % 3600) // 60
    s = secs % 60
    if hours > 0:
        return f"{hours}:{mins:02d}:{s:02d}"
    return f"{mins}:{s:02d}"


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    # 1. Load category mappings
    with open(CAT_JSON_PATH, "r", encoding="utf-8") as f:
        cat_json = json.load(f)
    kaggle_cat_map = {}
    for item in cat_json["items"]:
        kaggle_cat_map[int(item["id"])] = item["snippet"]["title"]

    print(f"Loaded {len(kaggle_cat_map)} Kaggle category mappings")

    # 2. Load CSV
    print(f"Reading CSV from {CSV_PATH} ...")
    df = pd.read_csv(CSV_PATH, encoding="utf-8")
    print(f"  Raw rows: {len(df):,}")

    # 3. Deduplicate by video_id (keep the row with highest view_count)
    df["view_count"] = pd.to_numeric(df["view_count"], errors="coerce").fillna(0).astype(int)
    df = df.sort_values("view_count", ascending=False).drop_duplicates(subset=["video_id"], keep="first")
    print(f"  After dedup: {len(df):,}")

    # 4. Filter out junk
    df = df[df["title"].notna() & (df["title"].str.strip() != "")]
    df = df[~df["title"].str.contains(r"#shorts|Deleted video", case=False, na=False)]
    df = df[df["video_id"].notna() & (df["video_id"].str.len() == 11)]
    df = df[df["view_count"] >= MIN_VIEWS]
    print(f"  After quality filter: {len(df):,}")

    # 5. Map categories to our topic chips
    df["topic"] = df["categoryId"].map(CATEGORY_TO_TOPIC)
    df = df[df["topic"].notna()]
    print(f"  After category mapping: {len(df):,}")

    # 6. Sample up to VIDEOS_PER_CATEGORY from each topic
    sampled_frames = []
    for topic in sorted(df["topic"].unique()):
        pool = df[df["topic"] == topic]
        n = min(len(pool), VIDEOS_PER_CATEGORY)
        # Prefer highest-viewed
        top_pool = pool.head(n * 3)  # top by views (already sorted)
        sampled = top_pool.sample(n=n, random_state=42)
        sampled_frames.append(sampled)
        print(f"    {topic}: sampled {n} from {len(pool)} available")

    result_df = pd.concat(sampled_frames).reset_index(drop=True)
    print(f"\n  Total sampled: {len(result_df)}")

    # 7. Build JS video objects
    videos = []
    for idx, row in result_df.iterrows():
        vid = row["video_id"]
        topic = row["topic"]
        channel = str(row.get("channelTitle", "Unknown"))

        videos.append({
            "id":                f"v{idx + 1}",
            "videoId":           vid,
            "title":             str(row["title"]).strip(),
            "thumbnail":         f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg",
            "thumbnailHQ":       f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
            "channelName":       channel,
            "channelAvatar":     make_initials(channel),
            "channelAvatarColor": TOPIC_COLORS.get(topic, "#606060"),
            "views":             format_views(row["view_count"]),
            "likes":             int(row.get("likes", 0)) if pd.notna(row.get("likes")) else 0,
            "uploadedAt":        time_ago(str(row.get("publishedAt", ""))),
            "duration":          estimate_duration(row["view_count"], topic),
            "topics":            [topic],
        })

    # 8. Pick shorts from high-view Entertainment/Music/Gaming
    shorts_pool = result_df[result_df["topic"].isin(["Music", "Gaming", "Entertainment"])]
    shorts_pool = shorts_pool.head(SHORTS_COUNT * 2).sample(n=min(SHORTS_COUNT, len(shorts_pool)), random_state=99)
    shorts = []
    for idx, row in shorts_pool.iterrows():
        vid = row["video_id"]
        shorts.append({
            "id":        f"s{len(shorts) + 1}",
            "videoId":   vid,
            "title":     str(row["title"]).strip()[:60],
            "thumbnail": f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg",
            "views":     format_views(row["view_count"]),
            "topics":    [row["topic"]],
        })

    # 9. Build the TOPICS array from actual sampled data
    all_topics = sorted(set(v["topics"][0] for v in videos))
    topics_list = ["All"] + all_topics

    # 10. Write JS module
    print(f"\nWriting {len(videos)} videos + {len(shorts)} shorts to:\n  {OUTPUT_PATH}")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("""/* ─────────────────────────────────────────────────────────────────────────────
 * videos.js — Auto-generated seed data from Kaggle IN_youtube_trending_data.csv
 *
 * Generated by: feedforyou/scripts/extract_seed_data.py
 * Source:       IN_youtube_trending_data.csv + IN_category_id.json
 *
 * All video IDs are REAL public YouTube videos with live thumbnails.
 * ────────────────────────────────────────────────────────────────────────── */

const thumb = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const thumbHQ = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

""")
        # Write TOPICS
        f.write(f"export const TOPICS = {json.dumps(topics_list, indent=2)};\n\n")

        # Write videos
        f.write("// ── Regular Videos ──────────────────────────────────────────────────────────\n\n")
        f.write(f"export const videos = {json.dumps(videos, indent=2, ensure_ascii=False)};\n\n")

        # Write shorts
        f.write("// ── Shorts ─────────────────────────────────────────────────────────────────\n\n")
        f.write(f"export const shorts = {json.dumps(shorts, indent=2, ensure_ascii=False)};\n\n")

        # Write utility functions
        f.write("""// ── Utilities ──────────────────────────────────────────────────────────────────

// Look up a regular video by id
export const getVideoById = (id) => videos.find((v) => v.id === id);

// Get related videos (same topics, excluding self)
export const getRelatedVideos = (videoId, count = 8) => {
  const current = videos.find((v) => v.videoId === videoId);
  if (!current) return videos.slice(0, count);
  const scored = videos
    .filter((v) => v.videoId !== videoId)
    .map((v) => ({
      ...v,
      score: v.topics.filter((t) => current.topics.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, count);
};
""")

    print("Done!")
    print(f"\nTopic chips: {topics_list}")
    print(f"Videos by topic:")
    for t in all_topics:
        count = sum(1 for v in videos if t in v["topics"])
        print(f"  {t}: {count}")


if __name__ == "__main__":
    main()
