// 自定义节点组件 - Phase 3 升级版：内嵌柱状图 + 点击设置证据
import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import useFlowStore from '../../hooks/useFlowStore';

function CustomNode({ data, selected, id }) {
    const { label, states, distribution } = data;
    const { modelTrained, evidence, setEvidence } = useFlowStore();

    // 当前节点是否为证据节点
    const isEvidence = evidence[id] !== undefined;
    const evidenceState = evidence[id];

    // 是否存在任何证据（用于判断是否为后验分布）
    const hasAnyEvidence = Object.keys(evidence).length > 0;
    // 如果有证据且当前节点不是证据节点，则是后验分布
    const isPosterior = hasAnyEvidence && !isEvidence;

    // 点击状态行设置证据
    const handleStateClick = useCallback((state) => {
        if (modelTrained) {
            setEvidence(id, state);
        }
    }, [id, modelTrained, setEvidence]);

    // 计算概率条宽度
    const getBarWidth = (state) => {
        if (distribution && distribution[state] !== undefined) {
            return `${Math.max(5, distribution[state] * 100)}%`;
        }
        // 默认均匀分布
        if (states && states.length > 0) {
            return `${100 / states.length}%`;
        }
        return '50%';
    };

    // 获取概率值
    const getProb = (state) => {
        if (distribution && distribution[state] !== undefined) {
            return (distribution[state] * 100).toFixed(1);
        }
        return null;
    };

    return (
        <div className={`cf-node ${selected ? 'selected' : ''} ${isEvidence ? 'evidence' : ''} ${isPosterior ? 'posterior' : ''} ${modelTrained ? 'run-mode' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                className="react-flow__handle"
            />

            <div className="cf-node-header">
                <div className="cf-node-title">{label}</div>
                {isEvidence && <span className="cf-node-evidence-badge">E</span>}
            </div>

            {/* 推理模式：显示状态列表和概率条 */}
            {modelTrained && states && states.length > 0 && (
                <div className="cf-node-states">
                    {states.map((state) => {
                        const isActive = evidenceState === state;
                        const prob = getProb(state);

                        return (
                            <div
                                key={state}
                                className={`cf-state-row ${isActive ? 'active' : ''}`}
                                onClick={() => handleStateClick(state)}
                            >
                                <span className="cf-state-label">{state}</span>
                                <div className="cf-state-bar-container">
                                    <div
                                        className="cf-state-bar"
                                        style={{ width: getBarWidth(state) }}
                                    />
                                </div>
                                {prob && <span className="cf-state-prob">{prob}%</span>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 编辑模式：只显示状态数量 */}
            {!modelTrained && states && states.length > 0 && (
                <div className="cf-node-meta">{states.length} states</div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="react-flow__handle"
            />
        </div>
    );
}

export default memo(CustomNode);
