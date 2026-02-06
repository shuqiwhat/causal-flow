# 🌊 CausalFlow

**The Modern Data-Driven Bayesian Network Workbench.**
Build, Visualize, and Reason with Causal Models directly in your browser.

## 🚀 Why CausalFlow?

* **Data First**: Upload your CSV, and let the engine discover the structure (DAG) for you.
* **Visual & Interactive**: No more static graphs. Drag nodes, click to set evidence, and watch probabilities update in real-time.
* **Privacy Focused**: All processing happens locally or in your private session.

## ✨ Key Features

* **Smart Ingestion**: Automatically validates and processes discrete data from CSVs.
* **Structure Learning**: Hill-Climbing algorithms to suggest causal links.
* **Real-time Inference**: Exact inference using Variable Elimination.
* **Hybrid Modeling**: Combine data-driven learning with manual expert knowledge.

## 📸 Snapshots

|                  Construction                  |                   Inference                   |
| :--------------------------------------------: | :--------------------------------------------: |
| ![1770410595902](image/README/1770410595902.png) | ![1770410568940](image/README/1770410568940.png) |

## 🛠️ Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to start modeling.

---

*Created by Shuqi*
