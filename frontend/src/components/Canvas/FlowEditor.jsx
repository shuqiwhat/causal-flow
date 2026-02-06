// React Flow 编辑器组件 - Phase 3: Run Mode with Inference
import { useEffect, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    Panel,
    ConnectionLineType,
    useReactFlow,
} from '@xyflow/react';
import useFlowStore from '../../hooks/useFlowStore';
import CustomNode from './CustomNode';
import { infer } from '../../api/api';
import { getLayoutedElements } from '../../utils/layout';

const nodeTypes = {
    customNode: CustomNode,
};

// Empty State Icon
const EmptyIcon = () => (
    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="12" cy="5" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
        <path d="M12 7v10M6.5 10.5l5-4M17.5 10.5l-5-4" strokeDasharray="2 2" />
    </svg>
);

function FlowEditor() {
    const {
        nodes,
        edges,
        setNodes,
        setEdges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        error,
        successMessage,
        modelTrained,
        evidence,
        updateDistributions,
        setError,
    } = useFlowStore();

    const { fitView } = useReactFlow();

    const onLayout = useCallback(
        (direction) => {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                nodes,
                edges,
                direction
            );

            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);

            window.requestAnimationFrame(() => {
                fitView();
            });
        },
        [nodes, edges, setNodes, setEdges, fitView]
    );

    // 当 evidence 变化时触发推理
    useEffect(() => {
        if (!modelTrained) return;

        const runInference = async () => {
            try {
                const result = await infer(evidence);
                if (result.success) {
                    updateDistributions(result.distributions);
                }
            } catch (err) {
                setError(err.message);
            }
        };

        runInference();
    }, [evidence, modelTrained, updateDistributions, setError]);

    // 模型训练完成后，立即获取先验分布
    useEffect(() => {
        if (!modelTrained) return;

        const getInitialDistributions = async () => {
            try {
                const result = await infer({});
                if (result.success) {
                    updateDistributions(result.distributions);
                }
            } catch (err) {
                // 静默失败
                console.warn('Failed to get initial distributions:', err);
            }
        };

        getInitialDistributions();
    }, [modelTrained, updateDistributions]);

    return (
        <div className="canvas-container">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={modelTrained ? undefined : onConnect}  // Run Mode 禁用连线
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                connectionLineType={ConnectionLineType.SmoothStep}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: 'var(--color-border-strong)', strokeWidth: 1.5 },
                    markerEnd: {
                        type: 'arrowclosed',
                        color: 'var(--color-border-strong)',
                    },
                }}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={true}  // 始终允许拖拽节点
                nodesConnectable={!modelTrained}  // Run Mode 禁用连接
            >
                <Background color="var(--color-border)" gap={24} size={1} />
                <Controls showInteractive={false} />
                <MiniMap
                    nodeColor="var(--color-text-muted)"
                    maskColor="rgba(250, 250, 250, 0.9)"
                    pannable
                    zoomable
                />

                <Panel position="top-right">
                    <button
                        className="layout-btn"
                        onClick={() => onLayout('TB')}
                        title="Auto Layout (Hierarchy)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                        Auto Layout
                    </button>
                </Panel>
                {/* Global Toasts */}
                <Panel position="top-center">
                    <div className="flex flex-col gap-2 items-center">
                        {/* Mode Badge */}
                        {modelTrained && !error && !successMessage && (
                            <div className="status-badge status-badge--success">
                                Run Mode - Click nodes to set evidence
                            </div>
                        )}

                        {/* Error Toast */}
                        {error && (
                            <div className="status-badge status-badge--error">
                                <span>{error}</span>
                                <div className="toast-close" onClick={() => setError(null)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Success Toast */}
                        {successMessage && !error && (
                            <div className="status-badge status-badge--success">
                                <span>{successMessage}</span>
                                <div className="toast-close" onClick={() => useFlowStore.getState().clearMessages()}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                </Panel>
            </ReactFlow>

            {/* Empty State */}
            {nodes.length === 0 && (
                <div className="empty-state">
                    <EmptyIcon />
                    <div className="empty-state-title">No data loaded</div>
                    <div className="empty-state-subtitle">Import a CSV file to begin</div>
                </div>
            )}
        </div>
    );
}

// 用 ReactFlowProvider 包裹，确保 useReactFlow hook 可用
function FlowEditorWrapper() {
    return (
        <ReactFlowProvider>
            <FlowEditor />
        </ReactFlowProvider>
    );
}

export default FlowEditorWrapper;
