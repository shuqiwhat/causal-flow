<p align="center">
  <a href="https://bn-causal-flow.vercel.app">
    <img src="docs/images/inference.png" width="800" alt="CausalFlow" />
  </a>
</p>

<h3 align="center">
  Visual Bayesian Network workbench.<br/>
  Build · Infer · Understand causality — in your browser.
</h3>

<p align="center">
  <a href="https://bn-causal-flow.vercel.app">Live Demo</a> ·
  <a href="https://www.shuqihere.top/archive/open-source/bn-causal-flow">Docs</a> ·
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <a href="https://github.com/shuqiwhat/causal-flow/stargazers"><img src="https://img.shields.io/github/stars/shuqiwhat/causal-flow?style=social" alt="Stars" /></a>
  <a href="https://github.com/shuqiwhat/causal-flow/blob/main/LICENSE"><img src="https://img.shields.io/github/license/shuqiwhat/causal-flow" alt="License" /></a>
  <a href="https://github.com/shuqiwhat/causal-flow/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
  <a href="https://bn-causal-flow.vercel.app"><img src="https://img.shields.io/badge/demo-live-blue" alt="Live Demo" /></a>
</p>

---

CausalFlow is an open-source visual workbench for Bayesian Networks. Drop a CSV or define nodes from scratch, draw causal relationships, and run exact inference — all through a drag-and-drop interface. No code, no installs, no MATLAB license.

<p align="center">
  <a href="https://bn-causal-flow.vercel.app"><strong>👉 Try the live demo</strong></a>
</p>

## Features

- 🖱️ **Visual DAG Editor** — Drag-and-drop nodes & edges on an infinite canvas (React Flow)
- 📊 **Three Workflows** — Data-driven (CSV → structure learning → MLE), expert knowledge (manual priors), or hybrid
- ⚡ **Real-Time Inference** — Click to set evidence, watch posteriors update instantly via Variable Elimination
- 🔀 **Auto Layout** — Dagre-powered hierarchical layout, one click to organize
- 🧠 **Smart Ingestion** — Drop a CSV, auto-detect discrete variables and state spaces
- 🎯 **Prior Probability Editor** — Define CPTs by hand when you have domain expertise but no data
- 🏗️ **Structure Learning** — Hill-Climbing algorithm discovers causal structure from data
- 🌐 **Zero Install** — Runs entirely in the browser + lightweight API backend

## Screenshots

<table>
  <tr>
    <td align="center"><img src="docs/images/initial.png" width="400" /><br/><sub>Canvas</sub></td>
    <td align="center"><img src="docs/images/construction.png" width="400" /><br/><sub>DAG Construction</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/images/inference.png" width="400" /><br/><sub>Inference</sub></td>
    <td align="center"><img src="docs/images/demo.webp" width="400" /><br/><sub>Evidence Propagation</sub></td>
  </tr>
</table>

## Architecture

```
Frontend                          Backend
React 19 · React Flow · Zustand   FastAPI · pgmpy · NetworkX
Tailwind CSS · Dagre · Recharts   Variable Elimination · Hill-Climbing
          ↕  REST API  ↕
```

## Quick Start

```bash
git clone https://github.com/shuqiwhat/causal-flow.git && cd causal-flow
```

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload        # → http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install && npm run dev        # → http://localhost:5173
```

That's it. Open `http://localhost:5173`.

## Deploy

**One-click Docker:**
```bash
docker compose up -d --build
```

**Vercel + Render (free tier):**

| Component | Platform | Root Dir | Config |
|-----------|----------|----------|--------|
| Frontend | [Vercel](https://vercel.com) | `frontend` | Set `VITE_API_URL` env var |
| Backend | [Render](https://render.com) | `backend` | Auto-detected as Python |

## Contributing

PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

1. Fork → Branch → Commit → PR

## Star History

<a href="https://star-history.com/#shuqiwhat/causal-flow&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=shuqiwhat/causal-flow&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=shuqiwhat/causal-flow&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=shuqiwhat/causal-flow&type=Date" />
 </picture>
</a>

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  Built by <a href="https://github.com/shuqiwhat">@shuqiwhat</a>
</p>
