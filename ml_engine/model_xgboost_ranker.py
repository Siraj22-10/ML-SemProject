"""
model_xgboost_ranker.py — Model 2: XGBoost Engagement Ranker (Module 5 Ensemble)

Trains an XGBoost Regressor (or Random Forest fallback) to predict composite engagement_index
based on TF-IDF text features + log views + like ratios + comment ratios.
Candidate Generation (TF-IDF KNN) + XGBoost Scoring & Re-ranking.
"""
import time
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

class XGBoostRankerRecommender:
    def __init__(self, max_features=2000):
        self.vectorizer = TfidfVectorizer(max_features=max_features, stop_words='english')
        self.ranker = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
        self.nn_candidate_gen = NearestNeighbors(metric='cosine', algorithm='brute')
        self.df = None
        self.tfidf_matrix = None
        self.video_id_to_idx = {}

    def fit(self, df):
        """Fit feature extractor and XGBoost engagement ranker."""
        self.df = df.reset_index(drop=True)
        self.video_id_to_idx = {row['video_id']: idx for idx, row in self.df.iterrows()}

        # 1. Text feature vectorization
        self.tfidf_matrix = self.vectorizer.fit_transform(self.df['text_corpus'])
        self.nn_candidate_gen.fit(self.tfidf_matrix)

        # 2. Combine text features with numerical signals (log_views, like_ratio, comment_ratio)
        num_features = self.df[['log_views', 'like_ratio', 'comment_ratio']].values
        X = np.hstack([self.tfidf_matrix.toarray(), num_features])
        y = self.df['engagement_index'].values

        # 3. Train XGBoost model
        self.ranker.fit(X, y)
        
        # Predict engagement score for all items in dataset
        self.df['xgb_score'] = self.ranker.predict(X)
        return self

    def recommend(self, video_id, count=8):
        """
        Two-stage Recommendation Architecture:
        Stage 1: Retrieve top-30 candidate items using TF-IDF KNN.
        Stage 2: Re-rank candidate items using trained XGBoost engagement model.
        Returns (recommendations_list, latency_ms).
        """
        start_t = time.perf_counter()
        if video_id not in self.video_id_to_idx:
            # Fallback to highest XGBoost predicted engagement
            sorted_df = self.df.sort_values("xgb_score", ascending=False)
            recs = sorted_df.head(count).to_dict(orient='records')
            latency_ms = (time.perf_counter() - start_t) * 1000.0
            return recs, latency_ms

        idx = self.video_id_to_idx[video_id]
        query_vec = self.tfidf_matrix[idx]

        # Stage 1: Candidate Retrieval (top 30)
        num_candidates = min(30, len(self.df))
        distances, indices = self.nn_candidate_gen.kneighbors(query_vec, n_neighbors=num_candidates)
        candidate_indices = [i for i in indices.flatten() if i != idx]

        candidates_df = self.df.iloc[candidate_indices].copy()

        # Stage 2: Supervised XGBoost Re-ranking (Sort candidates by predicted engagement score)
        ranked_candidates = candidates_df.sort_values("xgb_score", ascending=False)
        recs = ranked_candidates.head(count).to_dict(orient='records')

        latency_ms = (time.perf_counter() - start_t) * 1000.0
        return recs, latency_ms

    def get_feed(self, topic="All", count=20):
        """Returns feed sorted by XGBoost predicted engagement rank."""
        if topic == "All":
            sorted_df = self.df.sort_values("xgb_score", ascending=False)
            return sorted_df.head(count).to_dict(orient='records')
        filtered = self.df[self.df['topic'] == topic]
        if len(filtered) == 0:
            return self.df.head(count).to_dict(orient='records')
        sorted_df = filtered.sort_values("xgb_score", ascending=False)
        return sorted_df.head(count).to_dict(orient='records')

if __name__ == "__main__":
    from dataset_loader import load_dataset
    df = load_dataset(max_records=1000)
    model = XGBoostRankerRecommender().fit(df)
    recs, lat = model.recommend(df.iloc[0]['video_id'], count=5)
    print(f"Model 2 (XGBoost Ranker) latency: {lat:.2f}ms. Returned {len(recs)} videos.")
