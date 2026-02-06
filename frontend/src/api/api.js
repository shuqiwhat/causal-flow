// API 客户端 - 与后端通信
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * 上传 CSV 文件到后端
 * @param {File} file - CSV 文件
 * @returns {Promise<Object>} - 包含 columns, meta_info, preview 等信息
 */
export async function uploadCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload_csv`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '上传失败');
    }

    return response.json();
}

/**
 * 验证网络结构 (DAG)
 * @param {Array} edges - [{source, target}, ...]
 * @returns {Promise<{is_valid: boolean, message: string}>}
 */
export async function validateStructure(edges) {
    const response = await fetch(`${API_BASE_URL}/validate_structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edges }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '验证失败');
    }

    return response.json();
}

/**
 * 自动学习网络结构 (Hill Climbing)
 * @param {string} scoring - 评分函数 "k2" 或 "bdeu"
 * @returns {Promise<{edges: Array, edge_count: number}>}
 */
export async function learnStructure(scoring = 'k2') {
    const response = await fetch(`${API_BASE_URL}/learn_structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoring }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '结构学习失败');
    }

    return response.json();
}

/**
 * 学习模型参数 (CPT)
 * @param {Array} edges - 边列表
 * @param {string} estimator - "mle" 或 "bayes"
 * @returns {Promise<Object>}
 */
export async function learnParameters(edges, estimator = 'mle') {
    const response = await fetch(`${API_BASE_URL}/learn_parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edges, estimator }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '参数学习失败');
    }

    return response.json();
}

/**
 * 健康检查
 * @returns {Promise<Object>}
 */
export async function healthCheck() {
    const response = await fetch('http://localhost:8000/');
    return response.json();
}

/**
 * 手动添加节点
 * @param {string} name - 节点名称
 * @param {string[]} states - 状态列表
 * @param {Object} prior - 可选的先验概率
 * @returns {Promise<Object>}
 */
export async function addNode(name, states, prior = null) {
    const response = await fetch(`${API_BASE_URL}/add_node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, states, prior }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '添加节点失败');
    }

    return response.json();
}

/**
 * 执行推理
 * @param {Object} evidence - 证据 {nodeName: stateName}
 * @returns {Promise<{success: boolean, distributions: Object}>}
 */
export async function infer(evidence = {}) {
    const response = await fetch(`${API_BASE_URL}/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '推理失败');
    }

    return response.json();
}
