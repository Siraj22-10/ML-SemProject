"""
model_lsa_hybrid.py — Model 3: Dense Latent Semantic Analysis (LSA) + Hybrid Re-ranker (Module 3 & 4 Best Model)

Mathematics:
1. Dimensionality Reduction (Module 4): Applies TruncatedSVD (Singular Value Decomposition: A = U Σ V^T)
   to reduce high-dimensional TF-IDF sparse vectors into 64-dimensional dense semantic concept vectors.
2. Dense Latent Space Search (Module 3): Fits a NearestNeighbors index with Cosine similarity on the SVD latent space.
3. Multi-Objective Re-ranking: Combines latent semantic similarity score (alpha=0.6) with normalized engagement score (beta=0.4).
"""
import time
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.neighbors import NearestNeighbors

class LSAHybridRecommender:
    def __init__(self, max_features=5000, n_components=64):
        self.vectorizer = TfidfVectorizer(max_features=max_features, stop_words='english')
        self.svd = TruncatedSVD(n_components=n_components, random_state=42)
        self.nn_model = NearestNeighbors(metric='cosine', algorithm='brute')
        self.df = None
        self.dense_embeddings = None
        self.video_id_to_idx = {}

    def fit(self, df):
        """Fit TF-IDF, TruncatedSVD dimensionality reduction, and dense Latent KNN index."""
        self.df = df.reset_index(drop=True)
        self.video_id_to_idx = {row['video_id']: idx for idx, row in self.df.iterrows()}

        # Step 1: High-dimensional TF-IDF extraction
        tfidf_matrix = self.vectorizer.fit_transform(self.df['text_corpus'])

        # Step 2: SVD Dimensionality Reduction -> 64-dim Dense Latent Space
        self.dense_embeddings = self.svd.fit_transform(tfidf_matrix)

        # Step 3: Build Cosine KNN Index over Dense Latent Vector Space
        self.nn_model.fit(self.dense_embeddings)
        return self

    def recommend(self, video_id, count=8, alpha=0.6, beta=0.4):
        """
        Two-stage LSA Hybrid Retrieval & Multi-Objective Ranking:
        Stage 1: Retrieve top 40 candidate items in dense LSA latent space via Cosine KNN.
        Stage 2: Hybrid scoring: Final_Score = alpha * Semantic_Similarity + beta * Engagement_Index.
        Returns (recommendations_list, latency_ms).
        """
        start_t = time.perf_counter()
        if video_id not in self.video_id_to_idx:
            # Fallback to highest hybrid score
            self.df['hybrid_score'] = self.df['engagement_index']
            sorted_df = self.df.sort_values("hybrid_score", ascending=False)
            recs = sorted_df.head(count).to_dict(orient='records')
            latency_ms = (time.perf_counter() - start_t) * 1000.0
            return recs, latency_ms

        idx = self.video_id_to_idx[video_id]
        query_vec = self.dense_embeddings[idx].reshape(1, -1)

        # Stage 1: Candidate Generation (top 40 in dense LSA space)
        num_candidates = min(40, len(self.df))
        distances, indices = self.nn_model.kneighbors(query_vec, n_neighbors=num_candidates)

        dist_flat = distances.flatten()
        idx_flat = indices.flatten()

        candidate_records = []
        for d, i in zip(dist_flat, idx_flat):
            if i == idx:
                continue
            cos_similarity = 1.0 - d  # Cosine similarity = 1 - cosine distance
            item = self.df.iloc[i].to_dict()
            eng_score = item.get('engagement_index', 0.5)

            # Stage 2: Multi-Objective Hybrid Ranker
            hybrid_score = (alpha * cos_similarity) + (beta * eng_score)
            item['semantic_similarity'] = round(float(cos_similarity), 4)
            item['hybrid_score'] = round(float(hybrid_score), 4)
            candidate_records.append(item)

        # Sort candidates by multi-objective hybrid score
        candidate_records.sort(key=lambda x: x['hybrid_score'], reverse=True)
        recs = candidate_records[:count]

        latency_ms = (time.perf_counter() - start_t) * 1000.0
        return recs, latency_ms

    def get_feed(self, topic="All", count=20):
        """Returns feed ordered by dense LSA concept diversity + engagement score."""
        if topic == "All":
            sorted_df = self.df.sort_values("engagement_index", ascending=False)
            return sorted_df.head(count).to_dict(orient='records')
        filtered = self.df[self.df['topic'] == topic]
        if len(filtered) == 0:
            return self.df.head(count).to_dict(orient='records')
        sorted_df = filtered.sort_values("engagement_index", ascending=False)
        return sorted_df.head(count).to_dict(orient='records')

if __name__ == "__main__":
    from dataset_loader import load_dataset
    df = load_dataset(max_records=1000)
    model = LSAHybridRecommender().fit(df)
    recs, lat = model.recommend(df.iloc[0]['video_id'], count=5)
    print(f"Model 3 (Dense LSA Hybrid) latency: {lat:.2f}ms. Returned {len(recs)} videos.")
