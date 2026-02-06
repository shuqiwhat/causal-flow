// React Flow 编辑器组件 - Phase 3: Run Mode with Inference
import { useEffect, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ConnectionLineType,
} from '@xyflow/react';
import useFlowStore from '../../hooks/useFlowStore';
import CustomNode from './CustomNode';
import { infer } from '../../api/api';

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
            </ReactFlow>

            {/* Mode Badge */}
            {modelTrained && (
                <div className="status-badge status-badge--success">
                    Run Mode - Click nodes to set evidence
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="status-badge status-badge--error">
                    {error}
                </div>
            )}

            {/* Success Message */}
            {successMessage && !error && !modelTrained && (
                <div className="status-badge status-badge--success">
                    {successMessage}
                </div>
            )}

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

export default FlowEditor;
