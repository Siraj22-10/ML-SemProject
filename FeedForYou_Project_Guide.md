# 🎬 FeedForYou — Full Project Guide
### Everything you need to walk into your presentation and absolutely nail it.

---

# CHAPTER 1 — What Is Our Project?

## The Problem

YouTube has over 800 million videos. Every time you open it, an algorithm decides what you see. That algorithm is a massive black-box neural network trained on your watch history, clicks, and personal data. You have zero visibility into *why* a video was recommended to you.

From an academic machine learning perspective, this is a problem: **you cannot study what you cannot see.**

## The Solution — FeedForYou

**FeedForYou** is a personalized, ad-free video recommendation web platform built entirely with **classical Machine Learning algorithms** from our course syllabus.

Instead of a black-box neural network, we use three transparent, mathematically explainable algorithms — all of which can be traced back to formulas in our textbooks. The user can **switch between models in real time** and compare their performance side-by-side on a live benchmark dashboard.

> **One-line pitch:** *"An open, explainable, ML-powered video recommendation engine built from scratch using classical Machine Learning."*

## What FeedForYou Actually Does

- Shows a **YouTube Dark Mode styled video feed** with real Indian trending videos from the Kaggle dataset.
- When you click any video, it opens inside a **Zen Browser-style vertical tab dock** — just like having multiple browser tabs, but for videos.
- A **Model Selector dropdown** in the top navbar lets you switch between Model 1, Model 2, Model 3, or YouTube Live API.
- A **"Compare Models" button** slides open a Benchmark Analytics Drawer showing real measured metrics (Precision, Recall, NDCG, Latency) for all 3 models.
- All video playback is real — actual YouTube iframes embedded with no ads.

## What Makes It Different From Just Using YouTube?

| Feature | YouTube | FeedForYou |
|---|---|---|
| Algorithm | Deep learning black box | Classical ML — explainable |
| Training data | Your entire Google profile | Public Kaggle dataset |
| Can you study it? | No | Yes — all code is open |
| GPU required? | Massive GPU clusters | Runs on your laptop CPU |
| Ads? | Yes | Zero ads |
| Model comparison? | No | Live side-by-side benchmark |

---

# CHAPTER 2 — What We Used (Dataset & ML Techniques)

## 2.1 The Dataset

### Source
**Kaggle — Indian YouTube Trending Dataset**
- File 1: `IN_youtube_trending_data.csv` — **421 MB**, 251,277 raw rows
- File 2: `IN_category_id.json` — Maps numeric category codes to human-readable names (e.g., `20 → "Gaming"`, `10 → "Music"`, `28 → "Science & Technology"`)

### What's Inside Each Row?
| Column | What It Is |
|---|---|
| `video_id` | 11-character YouTube video identifier |
| `title` | The full video title |
| `channelTitle` | Name of the YouTube channel |
| `categoryId` | Integer code (mapped to category name via JSON) |
| `tags` | Pipe-separated list of tags |
| `view_count` | Total views |
| `likes` | Total likes |
| `comment_count` | Total comments |
| `publishedAt` | Upload date |

### After Cleaning
| Stage | Count |
|---|---|
| Raw rows | 251,277 |
| After deduplication by `video_id` | 78,847 unique videos |
| After quality filters | ~50,000 valid records |
| **Used for ML training** | **5,000 records** |

> **Why only 5,000?** Training on 5,000 records means every model trains in < 10 seconds and runs inference in < 10ms on a standard laptop CPU without needing any GPU. This is a deliberate design decision for academic/demo purposes.

---

## 2.2 The ML Techniques We Used

We implemented **three progressively advanced models**, each from a different module of our syllabus:

| Model | Name | Syllabus Modules |
|---|---|---|
| **Model 1** | TF-IDF Vectorization + KNN (Baseline) | Module 3 — KNN |
| **Model 2** | XGBoost Engagement Ranker (Ensemble) | Module 5 — CART / Ensembles |
| **Model 3** | Dense LSA Hybrid Re-ranker (Best) | Module 3 + Module 4 — PCA / SVD + KNN |

### Other Concepts We Used
| Technique | Where | Module |
|---|---|---|
| Feature Engineering | `log_views`, `like_ratio`, `comment_ratio`, `engagement_index` | General ML |
| Cosine Similarity | Measuring text vector similarity | Module 3 |
| Dimensionality Reduction (TruncatedSVD) | Compressing 5,000 TF-IDF features → 64 dense dimensions | Module 4 |
| Offline Evaluation Metrics | Precision@10, Recall@10, NDCG@10, MRR, Latency | General ML Evaluation |

---

# CHAPTER 3 — How We Implemented the ML Models

## 3.0 Pre-processing Pipeline (`dataset_loader.py`)

Before any model can run, we need to clean and prepare the raw CSV data. This happens in the `dataset_loader.py` file.

### Step-by-Step

**Step 1 — Load the CSV**
```python
df = pd.read_csv("IN_youtube_trending_data.csv")
```

**Step 2 — Convert numeric columns safely**
```python
for col in ['view_count', 'likes', 'comment_count']:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
```

**Step 3 — Deduplicate** (keep the version of each video with the most views)
```python
df = df.sort_values('view_count', ascending=False)
df = df.drop_duplicates(subset=['video_id'])
```

**Step 4 — Quality filters**
```python
df = df[df['title'].notna()]                    # Remove empty titles
df = df[df['video_id'].str.len() == 11]         # Valid YouTube video IDs only
df = df[df['view_count'] >= 10000]              # At least 10K views
df = df[~df['title'].str.contains('#shorts', case=False)]  # Remove YouTube Shorts
```

**Step 5 — Map category IDs to names**
```python
with open("IN_category_id.json") as f:
    cat_map = json.load(f)
# e.g., "20" → "Gaming", "10" → "Music"
df['category'] = df['categoryId'].astype(str).map(cat_map).fillna("Entertainment")
```

**Step 6 — Build the text corpus** (what we feed into ML models)
```python
df['text_corpus'] = (df['title'] + ' ' + df['channelTitle'] + ' ' +
                     df['category'] + ' ' + df['tags'].fillna(''))
```

**Step 7 — Feature engineering**
```python
df['log_views']      = np.log1p(df['view_count'])
df['like_ratio']     = df['likes'] / (df['view_count'] + 1)
df['comment_ratio']  = df['comment_count'] / (df['view_count'] + 1)

# Normalize each feature to [0, 1] range
df['engagement_index'] = (
    0.6 * (df['log_views'] / df['log_views'].max()) +
    0.3 * (df['like_ratio'] / df['like_ratio'].max()) +
    0.1 * (df['comment_ratio'] / df['comment_ratio'].max())
)
```

> **Why `log1p` for views?** View counts are extremely skewed (some videos have 100M views, most have < 1M). Taking `log(1 + views)` compresses this range so a 10M-view video isn't 1000× more influential than a 10K-view video in the model.

---

## 3.1 Model 1 — TF-IDF + Cosine KNN (Baseline)

**File:** `ml_engine/model_tfidf_knn.py`
**Syllabus:** Module 3 — K-Nearest Neighbors

### What It Does
Converts every video's text (title + channel + category + tags) into a numerical vector using TF-IDF. Then finds the K most text-similar videos to a given query using KNN with cosine distance.

### How It Works — Step by Step

**Step 1 — TF-IDF Vectorization**
```python
from sklearn.feature_extraction.text import TfidfVectorizer
vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
tfidf_matrix = vectorizer.fit_transform(df['text_corpus'])
# Result: matrix of shape (5000 videos, 5000 terms)
```

**Step 2 — Fit KNN Index**
```python
from sklearn.neighbors import NearestNeighbors
knn = NearestNeighbors(metric='cosine', algorithm='brute')
knn.fit(tfidf_matrix)
```

**Step 3 — Recommend (at inference time)**
```python
def recommend(video_idx, K=10):
    query_vector = tfidf_matrix[video_idx]
    distances, indices = knn.kneighbors(query_vector, n_neighbors=K+1)
    # Skip index 0 (it's the video itself)
    return indices[0][1:]
```

### The Math

**TF-IDF Formula:**
$$\text{TF-IDF}(t, d) = \text{TF}(t, d) \times \log\left(\frac{N}{\text{DF}(t)}\right)$$

- **TF(t, d)** = How many times term *t* appears in video *d*
- **N** = Total number of videos (5,000)
- **DF(t)** = How many videos contain term *t*
- **Result**: Common words like "the" get low scores; rare, specific words like "Python tutorial" get high scores.

**Cosine Similarity Formula:**
$$\text{Cosine Similarity}(u, v) = \frac{u \cdot v}{\|u\|_2 \times \|v\|_2}$$

- Measures the **angle** between two vectors, not their length.
- 1.0 = identical direction (very similar), 0.0 = no similarity.

### Why Cosine Over Euclidean Distance?
A short video title like *"IPL Highlights"* and a long description video about cricket will produce TF-IDF vectors of very different magnitudes. Euclidean distance would call them "far apart" just because of length. Cosine similarity normalizes for vector length and measures *proportion of shared terms* — which is what actually matters for content similarity.

---

## 3.2 Model 2 — XGBoost Engagement Ranker (Ensemble)

**File:** `ml_engine/model_xgboost_ranker.py`
**Syllabus:** Module 5 — CART / Decision Trees / Ensemble Methods

### What It Does
A two-stage pipeline: first retrieves candidate videos by content similarity (same as Model 1), then re-ranks them by a trained XGBoost model that predicts which videos a user is most likely to engage with (based on historical views, likes, and comments).

### Two-Stage Architecture

```
User watches video X
        ↓
Stage 1: TF-IDF KNN → Pull top 30 similar videos
        ↓
Stage 2: XGBoost → Score each of the 30 by predicted engagement
        ↓
Sort by score descending → Return top 10
```

### How It Works — Step by Step

**Training Phase:**
```python
from xgboost import XGBRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
import scipy.sparse as sp

# Build feature matrix: TF-IDF text features + numerical engagement features
vectorizer = TfidfVectorizer(max_features=2000)
text_features = vectorizer.fit_transform(df['text_corpus'])

numeric_features = df[['log_views', 'like_ratio', 'comment_ratio']].values
# Combine sparse text + dense numeric into one matrix
X = sp.hstack([text_features, numeric_features])

# Target: the engagement index we computed during preprocessing
y = df['engagement_index'].values

model = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1)
model.fit(X, y)
```

**Inference Phase:**
```python
def recommend(video_idx, K=10):
    # Stage 1: Get 30 content-similar candidates via KNN
    candidates = knn.kneighbors(tfidf_matrix[video_idx], n_neighbors=30)
    candidate_indices = candidates[1][0]
    
    # Stage 2: Score candidates with XGBoost
    candidate_features = X[candidate_indices]
    scores = model.predict(candidate_features)
    
    # Sort by score descending, return top K
    ranked = sorted(zip(candidate_indices, scores), key=lambda x: -x[1])
    return [idx for idx, _ in ranked[:K]]
```

### The Math — How XGBoost Learns

XGBoost is an **ensemble of Decision Trees** trained sequentially. Each new tree learns to correct the errors of the previous trees:

$$F_m(x) = F_{m-1}(x) + \eta \cdot h_m(x)$$

Where:
- **F_{m-1}(x)** = Prediction of all previous trees combined
- **h_m(x)** = New tree trained on residuals (errors) of previous trees
- **η (learning rate)** = 0.1 — controls how aggressively each tree corrects errors

**Objective Function (what XGBoost minimizes):**
$$\mathcal{L} = \sum_i l(y_i, \hat{y}_i) + \sum_k \Omega(f_k)$$

- First term = **Prediction loss** (how wrong are our predictions?)
- Second term = **Regularization** (penalty for overly complex trees, prevents overfitting)

---

## 3.3 Model 3 — Dense LSA Hybrid Re-ranker (Best Model)

**File:** `ml_engine/model_lsa_hybrid.py`
**Syllabus:** Module 4 (PCA / TruncatedSVD / Dimensionality Reduction) + Module 3 (KNN)

### The Problem With Models 1 & 2
TF-IDF matches **exact words**. If a video is titled *"IPL 2024 Best Moments"* and another is titled *"Cricket Match Highlights India"*, TF-IDF won't know they're about the same topic because they share almost no words. This is called the **vocabulary mismatch problem**.

### The Solution — Latent Semantic Analysis
LSA discovers hidden (latent) *semantic concepts* behind the words. Instead of matching keywords, it matches *the underlying topics*. Both cricket videos would land near the same region of the 64-dimensional concept space — even with no shared words.

### How It Works — Step by Step

**Step 1 — TF-IDF (same as before)**
```python
vectorizer = TfidfVectorizer(max_features=5000)
tfidf_matrix = vectorizer.fit_transform(df['text_corpus'])
# Shape: (5000, 5000) — sparse, high-dimensional
```

**Step 2 — TruncatedSVD (Latent Semantic Analysis)**
```python
from sklearn.decomposition import TruncatedSVD
svd = TruncatedSVD(n_components=64)
dense_matrix = svd.fit_transform(tfidf_matrix)
# Shape: (5000, 64) — dense, latent concept space
```

Each video is now represented as a **64-dimensional vector** in "concept space" instead of a 5,000-dimensional keyword vector.

**Step 3 — KNN in latent concept space**
```python
from sklearn.neighbors import NearestNeighbors
knn = NearestNeighbors(metric='cosine', algorithm='brute')
knn.fit(dense_matrix)
```

**Step 4 — Hybrid Scoring at inference time**
```python
def recommend(video_idx, K=10):
    # Get top 40 semantically similar videos
    distances, indices = knn.kneighbors(dense_matrix[video_idx], n_neighbors=41)
    candidate_indices = indices[0][1:]
    semantic_scores = 1 - distances[0][1:]  # cosine similarity
    
    # Normalize engagement scores to [0, 1]
    eng_scores = df.iloc[candidate_indices]['engagement_index'].values
    eng_norm = (eng_scores - eng_scores.min()) / (eng_scores.max() - eng_scores.min() + 1e-9)
    
    # Hybrid scoring: semantic content + engagement quality
    hybrid_scores = 0.6 * semantic_scores + 0.4 * eng_norm
    
    # Sort by hybrid score, return top K
    ranked_idx = np.argsort(hybrid_scores)[::-1][:K]
    return [candidate_indices[i] for i in ranked_idx]
```

### The Math — Singular Value Decomposition

The core operation is **SVD decomposition** of the TF-IDF matrix:

$$A \approx U \Sigma V^T$$

| Variable | Shape | Meaning |
|---|---|---|
| **A** | 5000 × 5000 | Original TF-IDF matrix |
| **U** | 5000 × 64 | **Video concept vectors** (what we use for KNN) |
| **Σ** | 64 × 64 | Diagonal matrix — singular values ranked by importance |
| **V^T** | 64 × 5000 | Term concept vectors |

By keeping only the **top 64 singular values**, we retain the most important semantic dimensions and discard noise.

**Hybrid Score Formula:**
$$S_{\text{hybrid}} = 0.6 \times S_{\text{semantic}} + 0.4 \times S_{\text{engagement}}$$

> **Why 0.6 / 0.4?** Pure semantic similarity alone might recommend niche, low-quality videos that happen to share topic words. The 0.4 engagement weight ensures we also surface videos that real users actually watched and liked. This weight split was tuned empirically for the best NDCG@10.

### Why TruncatedSVD, not PCA?
**PCA** first centers (mean-subtracts) the data, then applies SVD. Centering a sparse TF-IDF matrix converts it to a **dense matrix** — which for 5,000 × 5,000 features would require ~200 MB of RAM just for one matrix. **TruncatedSVD** skips the centering step and works directly on the sparse matrix, making it memory-efficient and ~10× faster for text data.

---

# CHAPTER 4 — How to Show the Difference Between Models

## Live Demo Flow During Presentation

1. Open the browser at `http://localhost:5173`
2. Point to the **Model Selector dropdown** in the top navbar
3. Say: *"Right now we're on Model 3 — our best model. Let me switch to Model 1 and show you the feed changes."*
4. Switch the model → the video grid refreshes with new recommendations
5. Click **"Compare Models"** button → the **Benchmark Analytics Drawer** slides in from the right
6. Walk through the metrics table

## The Benchmark Numbers (Real, Measured on 5,000 Records)

These numbers come from running `evaluate.py` which tests all 3 models on the same dataset:

| Metric | Model 1: TF-IDF + KNN | Model 2: XGBoost | **Model 3: LSA Hybrid** |
|---|---|---|---|
| **Precision@10** | 0.8900 | 0.8840 | **0.9520 ✅** |
| **Recall@10** | 0.8900 | 0.8840 | **0.9520 ✅** |
| **NDCG@10** | 1.3708 | 1.3629 | **1.4705 ✅** |
| **MRR** | 0.9250 | 0.9267 | **0.9667 ✅** |
| **Avg Latency** | **4.56 ms** ✅ | 5.41 ms | 8.15 ms |
| **P95 Latency** | **6.11 ms** | 6.57 ms | 10.05 ms |

*All models run in real-time — even Model 3 at 8ms is imperceptibly fast to users.*

## What Each Metric Means (Simple Explanations)

### Precision@10
> "Of the 10 videos we recommended, what percentage are actually relevant (in the right category)?"

$$\text{Precision@K} = \frac{\text{Relevant items in top-K}}{K}$$

Model 3 scores **0.952** — meaning 9.52 out of every 10 recommendations are relevant. That's 6.2% better than Model 1.

### Recall@10
> "Of all the relevant videos in the dataset, what percentage did we catch in our top 10?"

$$\text{Recall@K} = \frac{\text{Relevant items in top-K}}{\text{Total relevant items}}$$

### NDCG@10 (Normalized Discounted Cumulative Gain)
> "Not just *did* we recommend relevant videos, but did we put them at the TOP of the list?"

$$\text{DCG@K} = \sum_{i=1}^{K} \frac{\text{relevance}_i}{\log_2(i+1)}$$

A relevant video at rank 1 contributes `1 / log2(2) = 1.0`. A relevant video at rank 10 contributes only `1 / log2(11) ≈ 0.29`. NDCG rewards putting the *best* videos first.

Model 3's NDCG of **1.4705 vs Model 1's 1.3708** = Model 3 not only finds relevant videos but puts the best ones first.

### MRR (Mean Reciprocal Rank)
> "How quickly does the user see the very first relevant result?"

$$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$$

Model 3 MRR = **0.9667** means the first relevant video appears at approximately rank 1 on average. Near-perfect.

## Why Model 3 Wins — The Key Argument

> *"Model 1 does keyword matching. If I watch a video titled 'Python Tutorial,' Model 1 recommends videos containing the word 'Python.' But Model 3 uses SVD to understand that 'Python Tutorial,' 'Coding for Beginners,' and 'Programming Crash Course' are all about the same underlying concept — even though they share no words. That's why it achieves 7% higher precision and 7.3% higher NDCG."*

## Why Model 2 Doesn't Beat Model 1

> *"XGBoost optimizes for engagement prediction — predicting view counts and like ratios. Our evaluation metric measures category relevance. These are two different objectives. Model 2 would win if we were measuring Click-Through Rate or Watch Time instead. This illustrates an important ML principle: your model must be optimized for the same objective you evaluate it on."*

---

# CHAPTER 5 — What We Used Other Than ML

## 5.1 Frontend (User Interface)

### React + Vite
**What it is:** React is a JavaScript library for building user interfaces. Vite is a next-generation build tool that makes React apps start and build near-instantly.

**Why we used it:** We needed a YouTube Dark Mode UI with a vertical **tab dock** (like having multiple browser tabs for videos). In React, we can mount video iframes once and just toggle their visibility — this preserves video playback state when you switch tabs. This would be messy to implement in plain HTML/JS.

### Tailwind CSS v3
**What it is:** A utility-first CSS framework — instead of writing custom CSS, you apply pre-built class names directly in HTML.

**Why we used it:** Lets us precisely match YouTube's dark mode color palette (`bg-[#0f0f0f]` for the background, `text-[#FF0000]` for red accents) without writing a single line of custom CSS. Responsive grid layouts (3-4 column video grid) take one class: `grid-cols-3 lg:grid-cols-4`.

### Lucide React (Icons)
**What it is:** A clean, lightweight icon library for React.

**Why we used it:** Used for sidebar chevrons, search icons, close buttons, and play icons throughout the UI.

### YouTube IFrame Player API
**What it is:** YouTube's official JavaScript embed API.

**Why we used it:** Allows real, playable YouTube videos to be embedded inside our web app in a 16:9 player container — no third-party video hosting needed.

## 5.2 Backend (API Server)

### FastAPI (Python)
**What it is:** A modern Python web framework for building REST APIs, built on Python's async capabilities.

**Why we used it:** FastAPI automatically generates API documentation at `/docs`, validates request/response types via Pydantic models, and handles all 3 ML models loaded in memory at startup. When the frontend needs recommendations, it sends a `GET /api/recommendations?model=m3&videoId=...` request — FastAPI routes it to the correct model and returns JSON.

### Uvicorn
**What it is:** An ASGI web server that runs FastAPI applications.

**Why we used it:** The command `uvicorn backend.app:app --host 127.0.0.1 --port 8000` starts the API server. FastAPI alone can't serve HTTP requests without a server like Uvicorn.

## 5.3 Data Processing

### Pandas
**What it is:** The standard Python library for tabular data manipulation.

**Why we used it:** We read the 421 MB CSV file with `pd.read_csv()`, deduplicate with `.drop_duplicates()`, filter rows, and compute feature engineering — all in a few lines of code.

### NumPy
**What it is:** Python's numerical computing library.

**Why we used it:** Used for `np.log1p()` (log transform for views), `np.argsort()` (sorting recommendation scores), and array operations throughout the ML pipeline.

### Scikit-learn
**What it is:** Python's primary classical Machine Learning library.

**Why we used it:** Provides `TfidfVectorizer`, `TruncatedSVD`, and `NearestNeighbors` — the building blocks for all 3 of our models.

### XGBoost
**What it is:** An optimized gradient boosting library.

**Why we used it:** Provides `XGBRegressor` for Model 2's engagement ranker. Trains in seconds on our feature matrix and runs inference in < 2ms per prediction.

## 5.4 External Services

### YouTube Data API v3
**What it is:** Google's official REST API for accessing YouTube data.

**Why we used it:** Powers the "YouTube Live" model — when selected, the frontend fetches currently active live streams from YouTube in real time.

**Important caveat:** The free quota is 10,000 units/day. If the API fails (quota exceeded / no WiFi), our backend automatically falls back to a pre-indexed local video list — the demo never crashes.

### Kaggle Dataset
**What it is:** A publicly available dataset of Indian YouTube trending videos, uploaded to kaggle.com.

**Why we used it:** Provides 78,847 real YouTube videos with all the metadata needed for ML training — no web scraping required, and it's academically citable.

## 5.5 Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                 BROWSER (Port 5173)                 │
│                                                     │
│  React + Vite + Tailwind CSS                        │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────┐   │
│  │ ZenSidebar   │  │  VideoGrid  │  │  Player  │   │
│  │ (Tab Dock)   │  │  (4 cols)   │  │ (iframe) │   │
│  └──────────────┘  └─────────────┘  └──────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Navbar: ModelSelector | BenchmarkDrawer     │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │ Axios HTTP
                   ▼
┌──────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)              │
│                                                      │
│  GET /api/health         → System status             │
│  GET /api/recommendations → Route to ML model        │
│  GET /api/feed           → Home feed videos          │
│  GET /api/live-streams   → YouTube API / fallback    │
│  GET /api/benchmarks     → Return benchmarks.json    │
│                                                      │
│  ┌─────────────┐ ┌────────────────┐ ┌─────────────┐ │
│  │  Model 1    │ │   Model 2      │ │  Model 3    │ │
│  │ TF-IDF+KNN  │ │ XGBoost Ranker │ │ LSA Hybrid  │ │
│  └─────────────┘ └────────────────┘ └─────────────┘ │
│               ↑ All loaded from:                     │
│     IN_youtube_trending_data.csv (5,000 records)     │
└──────────────────────────────────────────────────────┘
                   │ Google API
                   ▼
        YouTube Data API v3 (Live Streams)
```

---

# CHAPTER 6 — All Possible Professor Questions & Answers

---

## 🔷 Section A: Project Basics

**Q: What is your project about?**
> FeedForYou is a personalized video recommendation web platform that uses three classical Machine Learning algorithms to suggest relevant YouTube videos to users. The system is fully transparent — all models are academically explainable using our course syllabus material — and runs entirely on local hardware without any cloud ML services.

**Q: What problem does it solve?**
> YouTube's recommendation algorithm is a black-box neural network. Users have no insight into why videos are recommended, and researchers cannot study or audit the system. Our project solves this by building an equivalent recommendation system using classical ML — where every decision can be explained through a formula.

**Q: What is the difference between your project and just using YouTube?**
> YouTube uses a proprietary deep-learning model trained on billions of users and requires massive GPU infrastructure. Our system uses classical ML (TF-IDF, KNN, SVD, XGBoost) running on a laptop CPU in under 10ms per inference, and every algorithm can be mathematically derived from our textbook.

---

## 🔶 Section B: Dataset Questions

**Q: What dataset did you use and why?**
> Kaggle's Indian YouTube Trending Dataset — 421 MB CSV with 251,277 raw rows of real YouTube video metadata. We chose it because it contains all the signals needed for a content-based recommender (title, tags, category, views, likes, comments) and is academically citable, freely available, and representative of real-world data.

**Q: How many records did you use?**
> After cleaning and deduplication, we have 78,847 unique videos. For ML training and evaluation, we used 5,000 high-quality records filtered by at least 10,000 views, valid video IDs, and non-Shorts content.

**Q: Why only 5,000 when you have 78,000 records?**
> This was a deliberate engineering decision for the academic demo context. 5,000 records train all three models in under 10 seconds and run inference in under 10ms on a standard laptop CPU — making live demos reliable. Scaling to 78K records would require an Approximate Nearest Neighbor index like FAISS (a production-grade enhancement, not a syllabus requirement).

**Q: What preprocessing did you perform?**
> Six steps: (1) Convert numeric columns safely with error coercion. (2) Deduplicate by video_id, keeping highest-view version. (3) Filter: non-empty titles, valid 11-char video IDs, minimum 10K views, no #Shorts. (4) Map integer categoryId to human-readable name via the category JSON. (5) Build composite text corpus (title + channel + category + tags). (6) Engineer three engagement features: log-scaled views, like ratio, and comment ratio.

**Q: How did you handle missing values?**
> Numeric columns were coerced to numeric types with `pd.to_numeric(errors='coerce')`, and all resulting NaN values were filled with 0. Rows with null or empty titles were dropped entirely. Tags were filled with empty strings before text concatenation.

---

## 🟩 Section C: Model 1 — TF-IDF + KNN

**Q: What is TF-IDF?**
> TF-IDF stands for Term Frequency–Inverse Document Frequency. It converts text into numerical vectors where each dimension represents a word. A word gets a high TF-IDF score if it appears frequently in a specific video but rarely across all videos — making it a strong discriminator. Common words like "the" and "a" get near-zero scores because they appear everywhere.

**Q: Write the TF-IDF formula and explain it.**
$$\text{TF-IDF}(t, d) = \text{TF}(t, d) \times \log\left(\frac{N}{\text{DF}(t)}\right)$$
> TF(t,d) is how often term t appears in document d. N is the total number of documents. DF(t) is how many documents contain term t. The log term is high when t is rare across documents (making it a strong discriminator) and near zero when t is common everywhere.

**Q: What is K-Nearest Neighbors?**
> KNN is a non-parametric algorithm that finds the K closest points to a query point in a feature space. There is no explicit training — the algorithm simply stores all data points. At inference time, it computes the distance from the query to every stored point and returns the K smallest distances. We use this to find the K most text-similar videos.

**Q: Why did you use cosine similarity instead of Euclidean distance for KNN?**
> Euclidean distance measures the straight-line distance between two vectors. For text data, a short video title and a long blog-post-style description would produce vectors of very different magnitudes, making Euclidean distance unreliable. Cosine similarity measures the angle between vectors — it is length-normalized and focuses on the proportion of shared terms, which is what matters for text similarity.

**Q: What is the time complexity of brute-force KNN?**
> O(n × d) per query, where n = number of data points (5,000) and d = number of features (5,000). For our use case this is ~25M operations per query, which completes in ~4.5ms on a modern CPU. At production scale (millions of videos), this would need to be replaced with an Approximate Nearest Neighbor algorithm like FAISS.

---

## 🟧 Section D: Model 2 — XGBoost Ranker

**Q: What is gradient boosting?**
> Gradient boosting is an ensemble method that trains a sequence of Decision Trees, where each tree learns to correct the errors (residuals) of all previous trees combined. The final prediction is the weighted sum of predictions from all trees. The formula is F_m(x) = F_{m-1}(x) + η × h_m(x), where η is the learning rate and h_m is the new tree.

**Q: What is XGBoost specifically?**
> XGBoost (Extreme Gradient Boosting) is an optimized implementation of gradient boosting that adds second-order Taylor expansion of the loss function (using the Hessian, not just the gradient), built-in L1/L2 regularization to prevent overfitting, and column subsampling for each tree (similar to Random Forests). These additions make it both faster and more accurate than vanilla gradient boosting.

**Q: What features did you use to train XGBoost?**
> A combined feature matrix of 2,003 features: 2,000 TF-IDF text features (to capture content information) and 3 numerical engagement features (log-scaled view count, like-to-view ratio, comment-to-view ratio). The training target was the `engagement_index` — a weighted composite of these three engagement signals.

**Q: Why does Model 2 not outperform Model 1?**
> Our evaluation metric (Precision@10) measures category relevance. XGBoost was trained to predict engagement (views + likes). These are related but different objectives. A video can be highly relevant to a category but have low views (e.g., a niche tutorial) — XGBoost might rank it low while it deserves to be recommended. This illustrates the critical ML principle: a model is only as good as its alignment between training objective and evaluation metric.

---

## 🟪 Section E: Model 3 — Dense LSA Hybrid

**Q: What is Latent Semantic Analysis?**
> LSA discovers hidden semantic relationships between words and documents that literal keyword matching misses. It uses Singular Value Decomposition (SVD) to factorize the TF-IDF matrix into a low-rank approximation. The low-rank components represent latent "concept dimensions" — for example, videos about cricket, IPL, and batting average will cluster together in concept space even if they share no exact words.

**Q: Explain SVD mathematically.**
$$A \approx U \Sigma V^T$$
> A is our TF-IDF matrix (5000×5000). U (5000×64) contains the video concept vectors — one 64-dimensional vector per video. Σ (64×64) is a diagonal matrix of singular values ranked by their importance. V^T (64×5000) contains the term concept vectors. By keeping only the top 64 singular values, we capture the most important semantic structure and discard noise in the remaining 4,936 dimensions.

**Q: Why 64 components specifically?**
> 64 is the point of diminishing returns for our dataset size. At k=16, the model underfits — not enough concept dimensions to distinguish topic nuances. At k=256, the inference time increases significantly with no measurable accuracy gain. k=64 gives the best Precision@10 of 0.952 at only 8ms inference latency.

**Q: What is the difference between TruncatedSVD and PCA?**
> PCA first mean-centers the data matrix before applying SVD. For a sparse TF-IDF matrix (most values are zero), centering would destroy sparsity and require a dense matrix in memory — which at 5000×5000 float64 would require 200 MB just for the centered matrix. TruncatedSVD skips centering and applies SVD directly on the sparse matrix, making it ~10× more memory-efficient and faster for text data.

**Q: What is the hybrid scoring formula and why those weights?**
$$S_{\text{hybrid}} = 0.6 \times S_{\text{semantic}} + 0.4 \times S_{\text{engagement}}$$
> Pure semantic similarity (0.6 weight) ensures the recommended video is topically relevant to what the user is watching. The engagement weight (0.4) ensures we don't recommend low-quality or spam videos that happen to share topic words. The 60/40 split was tuned empirically by comparing NDCG@10 across splits (50/50, 60/40, 70/30, 80/20) — 60/40 gave the highest NDCG.

---

## 🔵 Section F: Evaluation Metrics

**Q: What is Precision@K and what does your score mean?**
$$\text{Precision@K} = \frac{\text{Number of relevant items in top-K}}{K}$$
> A Precision@10 of 0.952 means that in our top-10 recommendations, 9.52 out of 10 videos on average belong to the correct content category. This is a strong result — our best model is correct 95.2% of the time.

**Q: What is NDCG and why is it a better metric than Precision?**
> NDCG (Normalized Discounted Cumulative Gain) is position-sensitive. It penalizes relevant items appearing lower in the ranked list. A relevant video at rank 1 contributes `1/log2(2) = 1.0`. A relevant video at rank 10 contributes only `1/log2(11) ≈ 0.29`. Precision treats all positions equally — it doesn't care if the best video is ranked 1st or 10th. NDCG captures the real-world impact: users mostly click the first 2-3 results, so ranking quality matters enormously.

**Q: What is MRR?**
$$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank of first relevant item}}$$
> MRR measures how quickly a user finds the first relevant recommendation. An MRR of 0.9667 (Model 3) means the first relevant video appears at approximately rank 1 on average. If it appeared at rank 2, MRR would be ~0.5.

---

## 🔴 Section G: Architecture & Engineering

**Q: Why FastAPI instead of Flask?**
> FastAPI is asynchronous (ASGI), while Flask is synchronous (WSGI). FastAPI auto-generates OpenAPI documentation at `/docs`, uses Python type hints for automatic request validation, and is benchmarked at 2-3× higher throughput than Flask for ML serving workloads. It is the industry standard for modern Python API development.

**Q: How do you handle the YouTube API quota in a live demo?**
> The YouTube Data API v3 has a free quota of 10,000 units/day, and a single search call costs ~100 units. Our `youtube_service.py` wraps the API call in a try/except block. If the API key is missing, the quota is exceeded, or the network fails, it immediately returns a pre-indexed hardcoded list of 5 live stream videos from our dataset. The fallback is seamless — the frontend receives identical JSON and never knows the difference.

**Q: How does the tab dock preserve video playback when switching tabs?**
> Each video tab renders a YouTube iframe in the DOM. When you switch to a different tab, we set the current tab's container to `visibility: hidden` and `position: absolute` — keeping it in memory but invisible. When you switch back, we restore `visibility: visible`. This is the same technique professional browsers use for tab management. If we used `display: none` or unmounted the React component, the iframe would reload from scratch and lose the playback position.

---

## 🟤 Section H: Critical / Hard Questions

**Q: Why not use deep learning / transformer models for better accuracy?**
> Two reasons. First, our course syllabus explicitly covers classical ML (Modules 2-5: Decision Trees, KNN, SVM, PCA, Ensembles). Using a pre-trained BERT model would mean calling a Hugging Face library we didn't build or understand mathematically — evaluators can rightfully flag this as out-of-scope. Second, practical reasons: `sentence-transformers` + PyTorch adds 1.5 GB to requirements and requires GPU for reasonable inference speed. Our scikit-learn stack is under 100 MB, loads in 3 seconds, and runs at 8ms inference — which is actually production-competitive for content-based recommendation.

**Q: What is the cold-start problem and does your system have it?**
> The cold-start problem occurs when you have no data about a new user or a new video. Our content-based system has a cold-start advantage for new videos — as long as a video has a title, channel name, and category, we can immediately place it in the recommendation space without needing any interaction history. The user cold-start problem still exists (we don't have user history), so our feed defaults to category-based popularity ranking for new sessions.

**Q: Is this system scalable to YouTube's actual scale (800 million videos)?**
> Not in its current form. Brute-force cosine KNN over 800M videos would take minutes per query. The production solution is to replace `NearestNeighbors(algorithm='brute')` with an Approximate Nearest Neighbor index like FAISS (Facebook AI Similarity Search) or HNSW — which can search billions of vectors in under 100ms. The SVD latent vectors, TF-IDF vectorization, and hybrid scoring formulas would remain identical — only the retrieval index changes. This is a known production engineering enhancement, not an ML algorithm limitation.

**Q: What would you do differently if you had more time?**
> Three improvements: (1) Add collaborative filtering — use a user-video interaction matrix to capture "users who watched X also watched Y" patterns, complementing our content-based approach with behavioral patterns. (2) Implement A/B testing infrastructure — serve different models to different user sessions and track real click-through rates to measure real-world recommendation quality instead of offline category precision. (3) Add online learning — retrain the models nightly on the latest YouTube trending data via the API, keeping recommendations fresh.

---

## 📋 One-Page Cheat Sheet (Read This Right Before Walking In)

| Question | Answer to say |
|---|---|
| **What is the project?** | Classical ML video recommendation engine with YouTube-style dark UI |
| **Dataset?** | Kaggle Indian YouTube Trending CSV — 78K unique videos |
| **Model 1?** | Sparse TF-IDF + Cosine KNN — 4.56ms, Precision 0.89 |
| **Model 2?** | TF-IDF KNN candidates → XGBoost engagement re-rank — 5.41ms |
| **Model 3?** | TF-IDF → TruncatedSVD 64-dim → Cosine KNN → Hybrid score — 8.15ms, Precision **0.952** |
| **Best model?** | Model 3 — Precision 0.952, NDCG 1.4705, MRR 0.9667 |
| **Why not deep learning?** | Out of syllabus; classical ML is mathematically explainable, GPU-free |
| **Other tech?** | React, Vite, Tailwind CSS, FastAPI, Pandas, scikit-learn, YouTube IFrame API |
| **TF-IDF formula?** | TF(t,d) × log(N / DF(t)) |
| **SVD formula?** | A ≈ U Σ V^T |
| **Hybrid score formula?** | S = 0.6 × Semantic + 0.4 × Engagement |
| **Why Model 3 wins?** | SVD finds latent topic concepts — matches semantically similar videos even if they share no exact words |
| **Why Model 2 doesn't beat M1?** | XGBoost optimizes engagement; metric measures category relevance — misaligned objectives |
| **Cold start?** | Content-based handles new videos fine; user cold-start defaults to popularity |
| **Scalability?** | Replace brute-force KNN with FAISS/HNSW for billion-scale production use |
