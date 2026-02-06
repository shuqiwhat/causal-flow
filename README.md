# 🌊 CausalFlow

<div align="center">

**Data-Driven Interactive Bayesian Network Modeling Platform**

*让因果推理像搭积木一样简单*

</div>

## 📖 项目简介 (Introduction)

**CausalFlow** 是一个现代化的、基于 Web 的贝叶斯网络（Bayesian Network）推演工具。旨在填补 Python 开源社区中缺乏商业级 GUI 贝叶斯网络编辑器的空白。

![CausalFlow Demo](file:///Users/shuqi/.gemini/antigravity/brain/1532ae49-5251-4648-bb3f-5aa53d6c0d88/causalflow_hero_demo_1770409621886.webp)

本项目核心理念是 **"Data First"** ：用户无需手写代码定义网络，只需上传清洗好的 CSV 离散数据，系统即可自动识别变量空间、辅助构建 DAG（有向无环图）、学习参数（CPT），并提供实时的交互式因果推理。

## 📸 项目展示 (Screenshots)

|                                                         Initial State                                                          |                                                           Network Construction                                                            |                                                               Real-time Inference                                                               |
| :----------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------: |
| ![Clean UI](file:///Users/shuqi/.gemini/antigravity/brain/1532ae49-5251-4648-bb3f-5aa53d6c0d88/hero_initial_1770409632800.png) | ![Graph Building](file:///Users/shuqi/.gemini/antigravity/brain/1532ae49-5251-4648-bb3f-5aa53d6c0d88/hero_construction_1770409678545.png) | ![Probabilistic Inference](file:///Users/shuqi/.gemini/antigravity/brain/1532ae49-5251-4648-bb3f-5aa53d6c0d88/hero_inference_1770409742227.png) |

> 📚 详细开发过程请查看 [开发日志 (Development Log)](development_log.md)

---

## 🏗️ 系统架构 (Architecture)

本项目采用**前后端分离 (Monorepo)** 架构，确保计算密集型任务（贝叶斯推理）与交互密集型任务（可视化）的高效解耦。

### 核心数据流 (Data Flow)

1. **Ingestion** : 用户上传 CSV -> 后端** **`DataProcessor` 校验离散性 -> 生成** **`Metadata` (Nodes & States)。
2. **Construction** : 前端 React Flow 渲染节点 -> 用户拖拽连线 -> 后端校验 DAG 环路 (Cyclic Check)。
3. **Learning** : 前端触发** **`Train` -> 后端调用** **`pgmpy.BayesianEstimator` -> 生成条件概率表 (CPTs)。
4. **Inference** : 用户点击柱状图 (Evidence) -> 前端锁定状态 -> 后端运行** **`VariableElimination` -> 返回全网后验概率 -> 前端 Recharts 动画更新。

### 技术栈 (Tech Stack)

* **Backend (Computational Core)**
  * **Framework** : FastAPI (Python 3.9+)
  * **Algorithm** : **`pgmpy` (Bayesian Networks),** `pandas` (Data Manipulation)
  * **Validation** : Pydantic (Strict Schema Enforcement)
* **Frontend (Interactive UI)**
  * **Framework** : React 18 (Vite / Next.js)
  * **Canvas Engine** : React Flow (Node-based editor)
  * **Visualization** : Recharts (Embedded bar charts inside nodes)
  * **Styling** : TailwindCSS
  * **State Management** : Zustand (Global store for graph state)

---

## 🔌 API 接口规范 (API Contract)

*此部分作为 AI 辅助开发的基准参考。*

### 1. 数据接入

* **POST** `/api/upload_csv`

  * **Input** :`file: UploadFile` (CSV)
  * **Validation** : 拒绝连续变量（唯一值 > 15 的列）。
  * **Output** :
    **JSON**

  ```
  {
    "columns": ["Age", "Income", "Purchase"],
    "meta_info": {
      "Age": ["Young", "Middle", "Old"],
      "Income": ["Low", "High"]
    },
    "preview": [...]
  }
  ```

### 2. 网络结构

* **POST** `/api/validate_structure`
  * **Input** : **`edges: List[Tuple[str, str]]` (e.g.,** `[("Age", "Income")]`)
  * **Logic** : 检查是否有环 (Cycle Detection)。
  * **Output** :`{"is_valid": boolean, "error": string | null}`
* **POST** `/api/learn_structure` (Optional)
  * **Input** :** **`algorithm: "HillClimb" | "PC"`
  * **Output** :** **`edges: List[Tuple[str, str]]`

### 3. 参数与推理

* **POST** `/api/learn_parameters`

  * **Trigger** : 用户完成连线后。
  * **Input** :** **`edges` + (Session ID / Cached Data Reference)
  * **Output** :** **`success: boolean` (Backend creates internal** **`BayesianNetwork` object)
* **POST** `/api/inference`

  * **Input** :
    **JSON**

  ```
  {
    "evidence": {"Age": "Young", "Income": "High"},
    "targets": [] // Empty means all nodes
  }
  ```

  * **Output** :
    **JSON**

  ```
  {
    "results": {
      "Purchase": {"Yes": 0.75, "No": 0.25},
      "Age": {"Young": 1.0, "Middle": 0.0, "Old": 0.0}
    }
  }
  ```

---

## ✨ 核心特性 (Key Features)

### 1. 📊 严谨的数据准入 (Strict Validator)

系统不负责猜测用户的连续数据意图。

* **机制** : 上传时扫描每一列 `nunique()`。
* **规则** : 任何列若 `unique values > 15`，直接报错拒绝，强制用户在 Excel/Python 中预处理为离散数据。这保证了贝叶斯网络的可解释性。

### 2. 🎨 动态可视化节点 (Active Nodes)

节点不仅仅是静态文本，而是 **信息容器** 。

* **Custom Node** : 集成 `Recharts` 微型柱状图。
* **Visual Feedback** :
* **灰色** : 初始/无数据状态。
* **蓝色** : 边缘分布 (Marginal Probability)。
* **红色** : 观测证据 (Evidence)。
* **绿色** : 推理更新后的后验分布 (Posterior)。

### 3. ⚡ 毫秒级全网推断

* 基于 `Variable Elimination` 算法。
* 前端采用 Optimistic UI 更新策略或 Loading 骨架屏，确保大模型计算时的用户体验。

---

## 📅 开发计划 (Sprint Roadmap)

**总工期：20天 (MVP冲刺)**

### Phase 1: Foundation (Day 1-5)

* [ ] ****Backend** : FastAPI 搭建，实现** `DataProcessor`，完成 CSV 严格校验逻辑。
* [ ] **Frontend**: 初始化 React Flow 画布，实现 CSV 上传组件。
* [ ] **Integration** : 上传 CSV 后，画布上自动生成散落的自定义节点 (只显示 Title)。

### Phase 2: Construction (Day 6-10)

* [ ] **Frontend** : 启用 React Flow 连线功能 (`onConnect`)。
* [ ] **Backend** : 实现 DAG 环路检测算法。
* [ ] ****Backend** : 实现** `learn_parameters`，在内存中构建 Pgmpy 模型。
* [ ] **UI** : 增加“清除连线”、“自动布局”按钮。

### Phase 3: The Brain (Day 11-15)

* [ ] **Frontend** : 改造自定义节点，嵌入 Recharts 柱状图。
* [ ] ****Backend** : 实现** `inference` 接口。
* [ ] **Interaction** : 点击柱状图 -> 设置 Evidence -> 触发推理 -> 柱状图重新渲染。

### Phase 4: Polish & Ship (Day 16-20)

* [ ] **UI/UX** : Tailwind 美化，深色模式 (Dark Mode)。
* [ ] **DevOps** : Docker Compose 编写，确保一键部署。
* [ ] **Docs** : 完善使用文档与演示 GIF。

---

## 🚀 快速启动 (Quick Start)

### 环境要求

* Python 3.9+
* Node.js 16+

### 手动开发模式

**1. 后端**

**Bash**

```
cd backend
pip install -r requirements.txt
python main.py
# Swagger Docs available at http://localhost:8000/docs
```

**2. 前端**

**Bash**

```
cd frontend
npm install
npm run dev
# App running at http://localhost:3000
```

---

## 🤝 贡献指南 (Contributing)

* **Commit 规范** : 使用 **`feat:`,** **`fix:`,** **`docs:`,** `refactor:` 前缀。
* **代码风格** : Python 使用 PEP8 (Black), JS 使用 ESLint (Prettier).

---

## 📬 联系 (Contact)

* **Author** : Shuqi
* **Email** : shuqiwhatl@gmail.com
