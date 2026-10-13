"""Inspect the Kaggle dataset schema and category mappings."""
import json, pandas as pd

# ── Category mappings ────────────────────────────────────────────────────
with open("E:/Ml-Project/IN_category_id.json", "r", encoding="utf-8") as f:
    cat_data = json.load(f)

print("=== Category ID Mappings ===")
for item in cat_data["items"]:
    print(f"  {item['id']:>3} -> {item['snippet']['title']}")

# ── CSV schema ───────────────────────────────────────────────────────────
print("\n=== CSV Columns ===")
df = pd.read_csv("E:/Ml-Project/IN_youtube_trending_data.csv", nrows=3)
print(df.columns.tolist())
print("\n=== Sample Rows ===")
print(df.to_string())
print(f"\n=== Total rows (counting) ===")
# Just count lines for size estimate
import csv
with open("E:/Ml-Project/IN_youtube_trending_data.csv", "r", encoding="utf-8") as f:
    row_count = sum(1 for _ in f) - 1
print(f"  {row_count:,} rows")
print(f"\n=== Unique video_ids (sampling first 50k) ===")
df_sample = pd.read_csv("E:/Ml-Project/IN_youtube_trending_data.csv", nrows=50000)
print(f"  {df_sample['video_id'].nunique():,} unique videos in first 50k rows")
print(f"\n=== Category distribution (first 50k) ===")
print(df_sample['categoryId'].value_counts().head(15).to_string())
