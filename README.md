# 🎬 FeedForYou — ML-Powered Video Recommendation Engine

> An open, explainable, classical Machine Learning video recommendation platform built from scratch.

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E?logo=scikit-learn)](https://scikit-learn.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-3.4-FF6600)](https://xgboost.ai)

---

## 📌 What Is FeedForYou?

FeedForYou is a personalized, ad-free video recommendation web platform that uses **three classical Machine Learning algorithms** (from college syllabus Modules 3–5) to suggest relevant YouTube videos. Users can switch between models in real time and compare their performance side-by-side on a live benchmark analytics drawer.

**One-line pitch:** *"An open, explainable, ML-powered video recommendation engine built from scratch using classical Machine Learning — no black boxes, no GPUs required."*

---

## 🏗️ Project Structure

```
feedforyou/
├── frontend/                  # React + Vite + Tailwind CSS UI
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, VideoCard, VideoPlayer, etc.
│   │   ├── context/           # TabContext (useReducer tab state)
│   │   ├── data/              # videos.js — seed data from Kaggle dataset
│   │   └── services/          # api.js — Axios client for FastAPI backend
│   └── package.json
│
├── backend/                   # FastAPI REST API server
│   ├── app.py                 # Main FastAPI app — 5 endpoints
│   ├── services/
│   │   └── youtube_service.py # YouTube Data API v3 + fallback
│   └── requirements.txt
│
├── ml_engine/                 # All 3 ML models
│   ├── dataset_loader.py      # Kaggle CSV → cleaned DataFrame + features
│   ├── model_tfidf_knn.py     # Model 1: TF-IDF + KNN (Baseline)
│   ├── model_xgboost_ranker.py# Model 2: XGBoost Engagement Ranker
│   ├── model_lsa_hybrid.py    # Model 3: Dense LSA Hybrid (Best)
│   ├── evaluate.py            # Benchmark all 3 models → benchmarks.json
│   └── benchmarks.json        # Real measured metrics
│
├── scripts/
│   └── extract_seed_data.py   # CSV → frontend/src/data/videos.js
│
├── FeedForYou_Project_Guide.md  # 📖 Full project guide + Professor Q&A
├── .gitignore
└── README.md
```

---

## 🤖 The Three ML Models

| Model | Algorithm | Syllabus Module | Precision@10 | Latency |
|---|---|---|---|---|
| **Model 1** | TF-IDF Vectorization + KNN | Module 3 — KNN | 0.890 | 4.56 ms |
| **Model 2** | XGBoost Engagement Ranker | Module 5 — Ensembles | 0.884 | 5.41 ms |
| **Model 3** ⭐ | Dense LSA Hybrid (TruncatedSVD + KNN) | Module 3 + 4 | **0.952** | 8.15 ms |

### Model 3 Is the Best Because…
TruncatedSVD moves from a sparse keyword-matching space into a **64-dimensional dense semantic concept space**. Two videos about cricket — one titled "IPL Highlights 2024" and another "Best Batting Moments India" — will be recognized as similar **even though they share no exact words**, because they occupy the same region of latent concept space.

---

## 🗃️ Dataset

- **Source:** [Kaggle — Indian YouTube Trending Dataset](https://www.kaggle.com)
- **File:** `IN_youtube_trending_data.csv` (421 MB, 251,277 rows)
- **After cleaning:** 78,847 unique videos
- **Used for ML:** 5,000 high-quality records (≥10K views, valid ID, non-Shorts)

> ⚠️ The raw CSV is not included in this repo (too large for GitHub). Download it from Kaggle and place it at the project root before running `scripts/extract_seed_data.py`.

---

## 🚀 Quick Start

### 1. Install Backend Dependencies
```bash
pip install fastapi uvicorn scikit-learn xgboost pandas numpy requests python-dotenv google-api-python-client
```

### 2. Run the FastAPI Backend
```bash
# From the feedforyou/ directory
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

### 3. Install & Run the Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 4. (Optional) Re-generate Seed Data from Kaggle CSV
```bash
# Place IN_youtube_trending_data.csv and IN_category_id.json in project root
python scripts/extract_seed_data.py
```

### 5. (Optional) Re-run ML Benchmarks
```bash
python ml_engine/evaluate.py
```

---

## 📊 Benchmark Results

Evaluated on **5,000 records**, **K=10**:

| Metric | Model 1 | Model 2 | **Model 3** |
|---|---|---|---|
| Precision@10 | 0.8900 | 0.8840 | **0.9520** |
| Recall@10 | 0.8900 | 0.8840 | **0.9520** |
| NDCG@10 | 1.3708 | 1.3629 | **1.4705** |
| MRR | 0.9250 | 0.9267 | **0.9667** |
| Avg Latency | 4.56 ms | 5.41 ms | 8.15 ms |

---

## 🛠️ Tech Stack

### Frontend
- **React 18 + Vite** — Component-based SPA with vertical tab dock
- **Tailwind CSS v3** — YouTube Dark Mode palette (`#0f0f0f`, `#FF0000`)
- **Lucide React** — Icons
- **YouTube IFrame API** — Real embedded video playback

### Backend
- **FastAPI + Uvicorn** — Async REST API serving all 3 ML models
- **Pandas + NumPy** — Data loading and feature engineering
- **scikit-learn** — `TfidfVectorizer`, `TruncatedSVD`, `NearestNeighbors`
- **XGBoost** — Gradient boosted engagement ranker

### External
- **Kaggle Dataset** — 78K real YouTube trending videos
- **YouTube Data API v3** — Live stream integration with offline fallback

---

## 📖 Full Project Guide

Read **[FeedForYou_Project_Guide.md](./FeedForYou_Project_Guide.md)** for:
- Complete step-by-step model implementation with code + math formulas
- Model comparison explanation
- 36 professor Q&A pairs organized by topic
- One-page cheat sheet for presentations

---

## 👨‍💻 Author

**Siraj** — ML Semester Project, 2026  
Syllabus coverage: Modules 3 (KNN), 4 (PCA/SVD), 5 (Ensembles/XGBoost)
