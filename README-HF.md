---
title: CausalFlow - Visual Bayesian Network Workbench
emoji: 🔮
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
---

# 🔮 CausalFlow

<div align="center">

**The open-source, visual-first Bayesian Network workbench.**

Build · Infer · Understand causality — in your browser.

[![GitHub](https://img.shields.io/badge/GitHub-shuqiwhat/causal--flow-blue?logo=github)](https://github.com/shuqiwhat/causal-flow)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/shuqiwhat/causal-flow/blob/main/LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-Vercel-black)](https://bn-causal-flow.vercel.app)

</div>

---

## 🚀 What is CausalFlow?

CausalFlow is an **interactive workbench** for building and analyzing Bayesian Networks. Drop a CSV or define nodes from scratch, draw causal relationships, and run exact inference — all through a **drag-and-drop interface**. No code, no installs, no MATLAB license.

Perfect for:
- 📚 **Students** learning probabilistic graphical models
- 🔬 **Researchers** prototyping causal models
- 📊 **Data Scientists** exploring Bayesian inference

---

## ✨ Key Features

- 🖱️ **Visual DAG Editor** — Drag-and-drop nodes & edges on an infinite canvas
- 📊 **Three Workflows** — Data-driven (CSV → structure learning), expert knowledge, or hybrid
- ⚡ **Real-Time Inference** — Set evidence, watch posteriors update via Variable Elimination
- 🔀 **Auto Layout** — Dagre-powered hierarchical layout
- 🧠 **Smart CSV Ingestion** — Auto-detect discrete variables and state spaces
- 🎯 **CPT Editor** — Define conditional probability tables by hand
- 🏗️ **Structure Learning** — Hill-Climbing algorithm discovers causal structure
- 🌐 **Zero Install** — Runs entirely in the browser

---

## 🎬 Quick Demo

1. **Upload a CSV** → Click "Upload CSV" in the sidebar
2. **Learn Structure** → Auto-discover causal relationships
3. **Set Evidence** → Click on a node, select a state
4. **Run Inference** → Watch probabilities propagate in real-time

---

## 🏗️ Tech Stack

**Frontend**: React 19 · React Flow · Zustand · Tailwind CSS · Recharts  
**Backend**: FastAPI · pgmpy · NetworkX · PyTorch (CPU)  
**Algorithms**: Variable Elimination · Hill-Climbing Structure Learning

---

## 📖 Usage Tips

### Example: Titanic Survival Analysis

1. Upload the Titanic dataset (built-in example)
2. The system auto-detects variables: `Survived`, `Pclass`, `Sex`, `Age`
3. Learn structure or manually draw edges
4. Set evidence: `Sex=female`, `Pclass=1st`
5. Query: `P(Survived=Yes | Sex=female, Pclass=1st)` ≈ 0.97

### Example: Medical Diagnosis

1. Create nodes: `Symptom`, `Disease`, `Test Result`
2. Define CPTs manually (if no data)
3. Set evidence: `Symptom=fever`, `Test=positive`
4. Infer: `P(Disease | evidence)`

---

## 🔗 Links

- **GitHub Repository**: [shuqiwhat/causal-flow](https://github.com/shuqiwhat/causal-flow)
- **Documentation**: [Project Blog](https://www.shuqihere.top/archive/open-source/bn-causal-flow)
- **Production Demo**: [Vercel Deployment](https://bn-causal-flow.vercel.app)

---

## 🤝 Contributing

PRs are welcome! See [CONTRIBUTING.md](https://github.com/shuqiwhat/causal-flow/blob/main/CONTRIBUTING.md).

---

## 📝 License

MIT © [shuqiwhat](https://github.com/shuqiwhat)

---

<div align="center">

**Built with ❤️ by [@shuqiwhat](https://github.com/shuqiwhat)**

If you find this helpful, give it a ⭐ on [GitHub](https://github.com/shuqiwhat/causal-flow)!

</div>
