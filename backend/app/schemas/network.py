# Pydantic 数据模型
from typing import Dict, List, Any, Optional
from pydantic import BaseModel


class ColumnMeta(BaseModel):
    """列元信息"""
    name: str
    states: List[str]
    unique_count: int
    is_discrete: bool


class CSVUploadResponse(BaseModel):
    """CSV 上传响应"""
    columns: List[str]
    meta_info: Dict[str, List[str]]  # 列名 -> 状态列表
    preview: List[Dict[str, Any]]  # 前 10 行预览
    row_count: int
    column_count: int


class ErrorResponse(BaseModel):
    """错误响应"""
    detail: str
    invalid_columns: List[str] = []


# ========== Phase 2: Structure Learning ==========

class Edge(BaseModel):
    """边定义"""
    source: str  # parent node
    target: str  # child node


class ValidateStructureRequest(BaseModel):
    """验证结构请求"""
    edges: List[Edge]


class ValidateStructureResponse(BaseModel):
    """验证结构响应"""
    is_valid: bool
    message: str = ""


class LearnStructureRequest(BaseModel):
    """结构学习请求"""
    scoring: str = "k2"  # "k2" or "bdeu"


class LearnStructureResponse(BaseModel):
    """结构学习响应"""
    edges: List[Edge]
    edge_count: int


class LearnParametersRequest(BaseModel):
    """参数学习请求"""
    edges: List[Edge]
    estimator: str = "mle"  # "mle" or "bayes"


class LearnParametersResponse(BaseModel):
    """参数学习响应"""
    success: bool
    nodes: int
    edges: int
    estimator: str
    message: str = ""


# ========== Phase 2.5: Hybrid Modeling ==========

class AddNodeRequest(BaseModel):
    """手动添加节点请求"""
    name: str
    states: List[str]
    prior: Optional[Dict[str, float]] = None  # e.g. {"High": 0.3, "Low": 0.7}


class AddNodeResponse(BaseModel):
    """添加节点响应"""
    success: bool
    name: str
    states: List[str]
    message: str = ""


# ========== Phase 3: Inference ==========

class InferRequest(BaseModel):
    """推理请求"""
    evidence: Dict[str, str]  # e.g. {"Rain": "True", "Sprinkler": "On"}


class InferResponse(BaseModel):
    """推理响应"""
    success: bool
    distributions: Dict[str, Dict[str, float]]  # node -> {state: probability}
    message: str = ""
