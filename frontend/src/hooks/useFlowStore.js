// Zustand 状态管理 - 管理 React Flow 的节点和边
import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

// 自动布局：将节点排列成网格
const calculateNodePositions = (columns, startX = 50, startY = 50, gapX = 200, gapY = 120) => {
    const nodesPerRow = Math.ceil(Math.sqrt(columns.length));
    return columns.map((col, index) => ({
        id: col,
        type: 'customNode',
        position: {
            x: startX + (index % nodesPerRow) * gapX,
            y: startY + Math.floor(index / nodesPerRow) * gapY,
        },
        data: {
            label: col,
            states: [],
            distribution: null,
        },
    }));
};

const useFlowStore = create((set, get) => ({
    // 节点和边
    nodes: [],
    edges: [],

    // CSV 元信息
    metadata: null,

    // 模型状态
    modelTrained: false,

    // Phase 3: 推理状态
    evidence: {},        // 当前证据 {nodeName: stateName}
    distributions: {},   // 概率分布 {nodeName: {state: prob}}

    // UI 状态
    isLoading: false,
    error: null,
    successMessage: null,

    // 自动布局触发器 (counter, 每次递增触发 FlowEditor 内部的布局)
    autoLayoutTrigger: 0,

    // 设置节点
    setNodes: (nodes) => set({ nodes }),

    // 设置边
    setEdges: (edges) => set({ edges }),

    // 节点变化回调 (拖拽、选择等)
    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    // 边变化回调 (删除等)
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
            modelTrained: false, // 边变化后需要重新训练
        });
    },

    // 连接回调 - 添加新边
    onConnect: (connection) => {
        const newEdge = {
            ...connection,
            id: `${connection.source}-${connection.target}`,
            animated: false,
            style: { stroke: 'var(--color-border-strong)', strokeWidth: 1.5 },
            markerEnd: {
                type: 'arrowclosed',
                color: 'var(--color-border-strong)',
            },
        };
        set({
            edges: addEdge(newEdge, get().edges),
            modelTrained: false,
        });
    },

    // 从 CSV 响应生成节点
    setNodesFromCSV: (csvResponse) => {
        const { columns, meta_info } = csvResponse;
        const nodes = calculateNodePositions(columns);

        const nodesWithStates = nodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                states: meta_info[node.id] || [],
            },
        }));

        set({
            nodes: nodesWithStates,
            edges: [],
            metadata: csvResponse,
            error: null,
            modelTrained: false,
        });
    },

    // 设置自动学习的边 + 触发层级布局
    setEdgesFromLearned: (learnedEdges) => {
        const edges = learnedEdges.map((e) => ({
            id: `${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            animated: false,
            style: { stroke: 'var(--color-accent)', strokeWidth: 1.5 },
            markerEnd: {
                type: 'arrowclosed',
                color: 'var(--color-accent)',
            },
        }));
        set({
            edges,
            modelTrained: false,
            autoLayoutTrigger: get().autoLayoutTrigger + 1,
        });
    },

    // 清除所有边
    clearEdges: () => set({ edges: [], modelTrained: false }),

    // 获取边列表 (用于 API)
    getEdgeList: () => {
        return get().edges.map((e) => ({
            source: e.source,
            target: e.target,
        }));
    },

    // 设置模型已训练
    setModelTrained: (trained) => set({ modelTrained: trained }),

    // 设置加载状态
    setLoading: (isLoading) => set({ isLoading }),

    // 设置错误 (3秒后自动消失)
    setError: (error) => {
        set({ error, isLoading: false, successMessage: null });
        if (error) {
            setTimeout(() => {
                set({ error: null });
            }, 3000);
        }
    },

    // 设置成功消息 (3秒后自动消失)
    setSuccess: (message) => {
        set({ successMessage: message, error: null });
        if (message) {
            setTimeout(() => {
                set({ successMessage: null });
            }, 3000);
        }
    },

    // 添加手工节点 (不需要 CSV 数据)
    addManualNode: (name, states, prior = null) => {
        const existingNodes = get().nodes;
        const nodesPerRow = Math.max(2, Math.ceil(Math.sqrt(existingNodes.length + 1)));
        const index = existingNodes.length;

        const newNode = {
            id: name,
            type: 'customNode',
            position: {
                x: 50 + (index % nodesPerRow) * 200,
                y: 50 + Math.floor(index / nodesPerRow) * 120,
            },
            data: {
                label: name,
                states: states,
                isManual: true,
                prior: prior,       // 用户设置的先验概率
                distribution: null,
            },
        };

        set({
            nodes: [...existingNodes, newNode],
            modelTrained: false,
        });
    },

    // 更新节点的 prior
    updateNodePrior: (nodeId, prior) => {
        const nodes = get().nodes.map(n => {
            if (n.id === nodeId) {
                return { ...n, data: { ...n.data, prior } };
            }
            return n;
        });
        set({ nodes, modelTrained: false });
    },

    // 获取节点定义列表（用于 build_from_priors API）
    getNodeDefinitions: () => {
        return get().nodes.map(n => ({
            name: n.id,
            states: n.data?.states || [],
            prior: n.data?.prior || null,
        }));
    },

    // 判断是否有手动节点
    hasManualNodes: () => {
        return get().nodes.some(n => n.data?.isManual);
    },

    // 清空画布
    clearCanvas: () => set({
        nodes: [],
        edges: [],
        metadata: null,
        error: null,
        modelTrained: false,
        successMessage: null,
        evidence: {},
        distributions: {},
    }),

    // 删除单个节点
    removeNode: (nodeId) => {
        const { nodes, edges } = get();
        set({
            nodes: nodes.filter(n => n.id !== nodeId),
            edges: edges.filter(e => e.source !== nodeId && e.target !== nodeId),
            modelTrained: false,
        });
    },

    // 清除消息
    clearMessages: () => set({ error: null, successMessage: null }),

    // 触发自动布局 (FlowEditor 监听这个 counter 变化)
    triggerAutoLayout: () => set({ autoLayoutTrigger: get().autoLayoutTrigger + 1 }),

    // ========== Phase 3: Inference ==========

    // 设置证据 (点击节点的状态)
    setEvidence: (nodeName, stateName) => {
        const currentEvidence = get().evidence;
        const newEvidence = { ...currentEvidence };

        // 如果已经是该状态，则取消
        if (newEvidence[nodeName] === stateName) {
            delete newEvidence[nodeName];
        } else {
            newEvidence[nodeName] = stateName;
        }

        set({ evidence: newEvidence });
    },

    // 清除所有证据
    clearEvidence: () => set({ evidence: {}, distributions: {} }),

    // 更新概率分布 (来自后端推理)
    updateDistributions: (distributions) => {
        set({ distributions });

        // 同时更新节点的 data.distribution
        const nodes = get().nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                distribution: distributions[node.id] || null,
            },
        }));

        set({ nodes });
    },

    // 获取当前证据
    getEvidence: () => get().evidence,
}));

export default useFlowStore;
