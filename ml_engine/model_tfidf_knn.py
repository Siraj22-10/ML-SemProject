"""
model_tfidf_knn.py — Model 1: Sparse TF-IDF + Cosine KNN (Module 3 Baseline)

Vectorizes video title, channel, topic, and tags using TfidfVectorizer.
Builds a NearestNeighbors index with Cosine distance metric for content similarity.
"""
import time
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

class TFIDFKNNRecommender:
    def __init__(self, max_features=5000):
        self.vectorizer = TfidfVectorizer(max_features=max_features, stop_words='english')
        self.nn_model = NearestNeighbors(metric='cosine', algorithm='brute')
        self.df = None
        self.tfidf_matrix = None
        self.video_id_to_idx = {}

    def fit(self, df):
        """Fit TF-IDF matrix and KNN index on dataset."""
        self.df = df.reset_index(drop=True)
        self.video_id_to_idx = {row['video_id']: idx for idx, row in self.df.iterrows()}

        # Vectorize text corpus
        self.tfidf_matrix = self.vectorizer.fit_transform(self.df['text_corpus'])

        # Fit KNN
        self.nn_model.fit(self.tfidf_matrix)
        return self

    def recommend(self, video_id, count=8):
        """
        Recommends top `count` similar videos for a given video_id using Cosine KNN.
        Returns (recommendations_list, latency_ms).
        """
        start_t = time.perf_counter()
        if video_id not in self.video_id_to_idx:
            # Fallback to top engagement if video_id not found
            recs = self.df.head(count).to_dict(orient='records')
            latency_ms = (time.perf_counter() - start_t) * 1000.0
            return recs, latency_ms

        idx = self.video_id_to_idx[video_id]
        query_vec = self.tfidf_matrix[idx]

        # Fetch extra neighbors to filter out query video itself
        distances, indices = self.nn_model.kneighbors(query_vec, n_neighbors=count + 1)
        
        neighbor_indices = indices.flatten()[1:count+1]
        recs = self.df.iloc[neighbor_indices].to_dict(orient='records')
        
        latency_ms = (time.perf_counter() - start_t) * 1000.0
        return recs, latency_ms

    def get_feed(self, topic="All", count=20):
        """Returns top videos by topic for home feed."""
        if topic == "All":
            return self.df.head(count).to_dict(orient='records')
        filtered = self.df[self.df['topic'] == topic]
        if len(filtered) == 0:
            return self.df.head(count).to_dict(orient='records')
        return filtered.head(count).to_dict(orient='records')

if __name__ == "__main__":
    from dataset_loader import load_dataset
    df = load_dataset(max_records=1000)
    model = TFIDFKNNRecommender().fit(df)
    recs, lat = model.recommend(df.iloc[0]['video_id'], count=5)
    print(f"Model 1 (TF-IDF + KNN) latency: {lat:.2f}ms. Recommender returned {len(recs)} videos.")
