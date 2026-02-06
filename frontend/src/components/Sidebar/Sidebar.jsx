// Sidebar - Workflow Pipeline 组件 with Resize and Add Node
import { useState, useCallback, useRef, useEffect } from 'react';
import { uploadCSV, learnStructure, learnParameters, validateStructure } from '../../api/api';
import useFlowStore from '../../hooks/useFlowStore';

// Icons - 简洁线条风格
const Icons = {
    Logo: () => (
        <svg className="sidebar-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" strokeLinecap="round" />
        </svg>
    ),
    Database: () => (
        <svg className="pipeline-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
    ),
    Network: () => (
        <svg className="pipeline-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="5" r="2" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="18" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
            <path d="M12 7v10M6.5 10.5l5-4M17.5 10.5l-5-4" />
        </svg>
    ),
    Chart: () => (
        <svg className="pipeline-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M7 16l4-6 4 4 5-8" />
        </svg>
    ),
    Upload: () => (
        <svg className="upload-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    Check: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12" />
        </svg>
    ),
    Settings: () => (
        <svg className="utility-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
    ),
    Export: () => (
        <svg className="utility-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Wand: () => (
        <svg className="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M3 21l9-9M12.2 6.2l-1.4-1.4" />
        </svg>
    ),
    Play: () => (
        <svg className="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="5,3 19,12 5,21" />
        </svg>
    ),
    Trash: () => (
        <svg className="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
    ),
    Plus: () => (
        <svg className="action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Close: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

// Add Node Modal Component
function AddNodeModal({ isOpen, onClose, onAdd }) {
    const [nodeName, setNodeName] = useState('');
    const [states, setStates] = useState('True, False');
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!nodeName.trim()) {
            setError('Node name is required');
            return;
        }
        const stateList = states.split(',').map(s => s.trim()).filter(s => s);
        if (stateList.length < 2) {
            setError('At least 2 states required');
            return;
        }
        onAdd(nodeName.trim(), stateList);
        setNodeName('');
        setStates('True, False');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span>Add Node</span>
                    <button className="modal-close" onClick={onClose}><Icons.Close /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-field">
                        <label>Name</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={nodeName}
                            onChange={e => setNodeName(e.target.value)}
                            placeholder="e.g. SmokingHabit"
                        />
                    </div>
                    <div className="modal-field">
                        <label>States (comma-separated)</label>
                        <input
                            type="text"
                            value={states}
                            onChange={e => setStates(e.target.value)}
                            placeholder="e.g. High, Medium, Low"
                        />
                    </div>
                    {error && <div className="modal-error">{error}</div>}
                    <button type="submit" className="modal-submit">Add Node</button>
                </form>
            </div>
        </div>
    );
}

function Sidebar() {
    const [isDragging, setIsDragging] = useState(false);
    const [activeStep, setActiveStep] = useState('data');
    const [isAutoLearning, setIsAutoLearning] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isResizing, setIsResizing] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
    const sidebarRef = useRef(null);

    const {
        setNodesFromCSV,
        setLoading,
        setError,
        setSuccess,
        isLoading,
        error,
        metadata,
        clearCanvas,
        edges,
        nodes,
        setEdgesFromLearned,
        clearEdges,
        getEdgeList,
        setModelTrained,
        modelTrained,
        addManualNode,
        removeNode,
    } = useFlowStore();

    // Resize handlers
    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        const handleResizeMove = (e) => {
            if (!isResizing) return;
            const newWidth = Math.min(400, Math.max(200, e.clientX));
            setSidebarWidth(newWidth);
        };

        const handleResizeEnd = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing]);

    // 处理文件上传
    const handleUpload = useCallback(async (file) => {
        if (!file) return;
        if (!file.name.endsWith('.csv')) {
            setError('Only CSV files are supported');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await uploadCSV(file);
            setNodesFromCSV(result);
            setActiveStep('structure');
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    }, [setNodesFromCSV, setLoading, setError]);

    // 添加手工节点
    const handleAddNode = useCallback((name, states) => {
        // Check for duplicate names
        const existingNames = nodes.map(n => n.data?.label || n.id);
        if (existingNames.includes(name)) {
            setError(`Node "${name}" already exists`);
            return;
        }
        addManualNode(name, states);
        setSuccess(`Added node: ${name}`);
        setActiveStep('structure');
    }, [nodes, addManualNode, setError, setSuccess]);

    // 自动学习结构
    const handleAutoLearn = useCallback(async () => {
        if (!metadata) {
            setError('Please upload data first for auto-learning');
            return;
        }
        setIsAutoLearning(true);
        setError(null);

        try {
            const result = await learnStructure('k2');
            setEdgesFromLearned(result.edges);
            setSuccess(`Learned ${result.edge_count} edges`);
        } catch (err) {
            setError(err.message || 'Auto learn failed');
        } finally {
            setIsAutoLearning(false);
        }
    }, [metadata, setEdgesFromLearned, setError, setSuccess]);

    // 训练模型
    const handleTrain = useCallback(async () => {
        const edgeList = getEdgeList();
        if (edgeList.length === 0) {
            setError('Please add edges first');
            return;
        }

        setIsTraining(true);
        setError(null);

        try {
            const validation = await validateStructure(edgeList);
            if (!validation.is_valid) {
                setError(validation.message);
                setIsTraining(false);
                return;
            }

            const result = await learnParameters(edgeList, 'mle');
            if (result.success) {
                setModelTrained(true);
                setSuccess('Model trained successfully');
                setActiveStep('inference');
            }
        } catch (err) {
            setError(err.message || 'Training failed');
        } finally {
            setIsTraining(false);
        }
    }, [getEdgeList, setError, setSuccess, setModelTrained]);

    // 清除边
    const handleClearEdges = useCallback(() => {
        clearEdges();
        setSuccess('Edges cleared');
    }, [clearEdges, setSuccess]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleUpload(file);
    }, [handleUpload]);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        handleUpload(file);
    }, [handleUpload]);

    const hasNodes = nodes.length > 0;

    return (
        <>
            <aside
                className="sidebar"
                ref={sidebarRef}
                style={{ '--sidebar-width': `${sidebarWidth}px` }}
            >
                {/* Resize Handle */}
                <div
                    className={`sidebar-resize-handle ${isResizing ? 'dragging' : ''}`}
                    onMouseDown={handleResizeStart}
                />

                {/* Header - Context */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Icons.Logo />
                        <span className="sidebar-logo-text">CausalFlow</span>
                    </div>
                    <div className="sidebar-project">Bayesian Network Workbench</div>
                </div>

                {/* Pipeline - Core */}
                <nav className="sidebar-pipeline">
                    {/* Step 1: Data Source */}
                    <div className="pipeline-section">
                        <div
                            className={`pipeline-item ${activeStep === 'data' ? 'active' : ''}`}
                            onClick={() => setActiveStep('data')}
                        >
                            <Icons.Database />
                            <div className="pipeline-item-content">
                                <div className="pipeline-item-title">Data Source</div>
                                <div className="pipeline-item-subtitle">Import or Create</div>
                            </div>
                            {metadata && <span className="pipeline-badge">Done</span>}
                        </div>

                        {/* Upload Zone & Add Node */}
                        {activeStep === 'data' && (
                            <>
                                {isLoading ? (
                                    <div className="upload-loading">
                                        <div className="upload-spinner" />
                                        <span>Processing...</span>
                                    </div>
                                ) : metadata ? (
                                    <div className="upload-success">
                                        <div className="upload-success-header">
                                            <Icons.Check />
                                            <span>Data loaded</span>
                                        </div>
                                        <div className="upload-success-meta">
                                            {metadata.row_count.toLocaleString()} rows, {metadata.column_count} columns
                                        </div>
                                        <div className="upload-success-clear" onClick={clearCanvas}>
                                            Clear data
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('csv-input').click()}
                                        >
                                            <div className="upload-zone-icon">
                                                <Icons.Upload />
                                            </div>
                                            <div className="upload-zone-text">
                                                Drop CSV file here
                                                <br />
                                                or click to browse
                                            </div>
                                            <input
                                                id="csv-input"
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Divider */}
                                <div className="or-divider">
                                    <span>{metadata ? 'and' : 'or'} build manually</span>
                                </div>

                                {/* Add Node Button - Always Visible */}
                                <button
                                    className="action-btn action-btn--ghost"
                                    onClick={() => setShowAddNode(true)}
                                >
                                    <Icons.Plus />
                                    Add Node
                                </button>

                                {/* List of All Nodes (Renamed for clarity: Manual & Imported) */}
                                {nodes.length > 0 && (
                                    <div className="manual-nodes-list">
                                        {nodes.map(node => (
                                            <div key={node.id} className="manual-node-item">
                                                <span className="manual-node-name">
                                                    Node: {node.data?.label || node.id}
                                                </span>
                                                <button
                                                    className="manual-node-remove"
                                                    onClick={() => removeNode(node.id)}
                                                    title="Remove node"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {error && <div className="upload-error">{error}</div>}
                            </>
                        )}
                    </div>

                    {/* Step 2: Network Graph */}
                    <div className="pipeline-section">
                        <div
                            className={`pipeline-item ${activeStep === 'structure' ? 'active' : ''}`}
                            onClick={() => hasNodes && setActiveStep('structure')}
                            style={{ opacity: hasNodes ? 1 : 0.5, cursor: hasNodes ? 'pointer' : 'not-allowed' }}
                        >
                            <Icons.Network />
                            <div className="pipeline-item-content">
                                <div className="pipeline-item-title">Network Graph</div>
                                <div className="pipeline-item-subtitle">Build DAG structure</div>
                            </div>
                            {modelTrained && <span className="pipeline-badge">Trained</span>}
                        </div>

                        {/* Structure Actions */}
                        {activeStep === 'structure' && hasNodes && (
                            <div className="structure-actions">
                                <div className="structure-info">
                                    {edges.length} edge{edges.length !== 1 ? 's' : ''} defined
                                </div>

                                {metadata && (
                                    <button
                                        className="action-btn action-btn--primary"
                                        onClick={handleAutoLearn}
                                        disabled={isAutoLearning}
                                    >
                                        <Icons.Wand />
                                        {isAutoLearning ? 'Learning...' : 'Auto Learn'}
                                    </button>
                                )}

                                <button
                                    className="action-btn action-btn--success"
                                    onClick={handleTrain}
                                    disabled={isTraining || edges.length === 0}
                                >
                                    <Icons.Play />
                                    {isTraining ? 'Training...' : 'Train Model'}
                                </button>

                                <button
                                    className="action-btn action-btn--ghost"
                                    onClick={handleClearEdges}
                                    disabled={edges.length === 0}
                                >
                                    <Icons.Trash />
                                    Clear Edges
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Inference */}
                    <div className="pipeline-section">
                        <div
                            className={`pipeline-item ${activeStep === 'inference' ? 'active' : ''}`}
                            onClick={() => modelTrained && setActiveStep('inference')}
                            style={{ opacity: modelTrained ? 1 : 0.5, cursor: modelTrained ? 'pointer' : 'not-allowed' }}
                        >
                            <Icons.Chart />
                            <div className="pipeline-item-content">
                                <div className="pipeline-item-title">Inference</div>
                                <div className="pipeline-item-subtitle">Query probabilities</div>
                            </div>
                        </div>

                        {/* Inference Actions */}
                        {activeStep === 'inference' && modelTrained && (
                            <div className="structure-actions">
                                <div className="structure-info">
                                    Click nodes to set evidence
                                </div>

                                <button
                                    className="action-btn action-btn--ghost"
                                    onClick={() => {
                                        useFlowStore.getState().clearEvidence();
                                        setSuccess('Evidence cleared');
                                    }}
                                >
                                    <Icons.Trash />
                                    Reset Evidence
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Utility - Bottom */}
                <div className="sidebar-utility">
                    <div className="utility-item">
                        <Icons.Export />
                        <span>Export</span>
                    </div>
                    <div className="utility-item">
                        <Icons.Settings />
                        <span>Settings</span>
                    </div>
                </div>
            </aside>

            {/* Add Node Modal */}
            <AddNodeModal
                isOpen={showAddNode}
                onClose={() => setShowAddNode(false)}
                onAdd={handleAddNode}
            />
        </>
    );
}

export default Sidebar;
