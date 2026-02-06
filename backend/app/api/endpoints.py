# API 路由定义
from typing import Dict
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.core.data_processor import DataProcessor
from app.core.bn_engine import global_engine
from app.core.structure_learner import learn_structure_hillclimb
from app.schemas.network import (
    CSVUploadResponse, ErrorResponse,
    ValidateStructureRequest, ValidateStructureResponse,
    LearnStructureRequest, LearnStructureResponse, Edge,
    LearnParametersRequest, LearnParametersResponse
)

router = APIRouter(prefix="/api", tags=["Data"])


@router.post(
    "/upload_csv",
    response_model=CSVUploadResponse,
    responses={400: {"model": ErrorResponse}},
    summary="上传 CSV 文件",
    description="上传 CSV 文件，验证离散性，返回列信息和元数据"
)
async def upload_csv(file: UploadFile = File(...)):
    """
    上传 CSV 文件并进行处理
    
    - 验证 CSV 格式是否正确
    - 检查所有列是否为离散变量 (unique values <= 15)
    - 返回列名、状态空间、预览数据
    """
    # 检查文件类型
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="只支持 CSV 文件格式"
        )

    # 读取文件内容
    try:
        content = await file.read()
        csv_content = content.decode('utf-8')
    except UnicodeDecodeError:
        # 尝试其他编码
        try:
            csv_content = content.decode('gbk')
        except:
            raise HTTPException(
                status_code=400,
                detail="无法解析文件编码，请使用 UTF-8 或 GBK 编码"
            )

    # 处理 CSV
    processor = DataProcessor(csv_content)
    is_valid, error_msg = processor.validate_and_process()

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=error_msg
        )

    # 将数据存入全局引擎
    global_engine.set_data(processor.df)

    # 返回结果
    return CSVUploadResponse(
        columns=processor.get_columns(),
        meta_info=processor.get_meta_info(),
        preview=processor.get_preview(),
        row_count=processor.get_row_count(),
        column_count=processor.get_column_count()
    )


# ========== Phase 2: Structure Learning ==========

@router.post(
    "/validate_structure",
    response_model=ValidateStructureResponse,
    summary="验证网络结构",
    description="检查边列表是否构成有效的 DAG (无环)"
)
async def validate_structure(request: ValidateStructureRequest):
    """验证边列表是否为有效 DAG"""
    edges = [(e.source, e.target) for e in request.edges]
    is_valid, message = global_engine.validate_dag(edges)
    
    return ValidateStructureResponse(
        is_valid=is_valid,
        message=message
    )


@router.post(
    "/learn_structure",
    response_model=LearnStructureResponse,
    summary="自动学习网络结构",
    description="使用 Hill Climbing 算法从数据中自动学习网络结构"
)
async def learn_structure(request: LearnStructureRequest = None):
    """使用结构学习算法自动发现网络结构"""
    if global_engine.data is None:
        raise HTTPException(
            status_code=400,
            detail="请先上传 CSV 数据"
        )
    
    scoring = request.scoring if request else "k2"
    
    try:
        learned_edges = learn_structure_hillclimb(global_engine.data, scoring=scoring)
        
        edges = [Edge(source=src, target=tgt) for src, tgt in learned_edges]
        
        return LearnStructureResponse(
            edges=edges,
            edge_count=len(edges)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"结构学习失败: {str(e)}"
        )


@router.post(
    "/learn_parameters",
    response_model=LearnParametersResponse,
    summary="学习模型参数",
    description="根据边列表拟合 CPT 参数"
)
async def learn_parameters(request: LearnParametersRequest):
    """根据给定的网络结构学习参数 (CPT)"""
    if global_engine.data is None:
        raise HTTPException(
            status_code=400,
            detail="请先上传 CSV 数据"
        )
    
    edges = [(e.source, e.target) for e in request.edges]
    
    # 验证 DAG
    is_valid, error_msg = global_engine.validate_dag(edges)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=error_msg
        )
    
    try:
        # 设置结构并拟合
        global_engine.set_structure(edges)
        result = global_engine.fit(estimator=request.estimator)
        
        return LearnParametersResponse(
            success=result["success"],
            nodes=result["nodes"],
            edges=result["edges"],
            estimator=result["estimator"],
            message="模型训练完成"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"参数学习失败: {str(e)}"
        )


# ========== Phase 2.5: Hybrid Modeling ==========

from app.schemas.network import (
    AddNodeRequest, AddNodeResponse,
    BuildFromPriorsRequest, BuildFromPriorsResponse,
    NodeDefinition,
)

# 存储手动添加的节点
manual_nodes: Dict[str, Dict] = {}


@router.post(
    "/add_node",
    response_model=AddNodeResponse,
    summary="手动添加节点",
    description="不依赖 CSV 数据，手动添加节点到网络"
)
async def add_node(request: AddNodeRequest):
    """手动添加一个节点到网络（不需要 CSV）"""
    global manual_nodes
    
    if request.name in manual_nodes:
        raise HTTPException(
            status_code=400,
            detail=f"节点 '{request.name}' 已存在"
        )
    
    if len(request.states) < 2:
        raise HTTPException(
            status_code=400,
            detail="节点必须至少有 2 个状态"
        )
    
    # 验证 prior 如果提供
    if request.prior:
        total = sum(request.prior.values())
        if abs(total - 1.0) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Prior 概率和必须为 1.0，当前为 {total}"
            )
    
    # 存储节点
    manual_nodes[request.name] = {
        "states": request.states,
        "prior": request.prior
    }
    
    return AddNodeResponse(
        success=True,
        name=request.name,
        states=request.states,
        message=f"节点 '{request.name}' 添加成功"
    )


@router.post(
    "/build_from_priors",
    response_model=BuildFromPriorsResponse,
    summary="从先验概率构建模型",
    description="不需要 CSV 数据，直接从用户定义的节点、边和先验概率构建贝叶斯网络"
)
async def build_from_priors(request: BuildFromPriorsRequest):
    """从先验概率构建贝叶斯网络并启用推理"""
    if len(request.nodes) < 1:
        raise HTTPException(
            status_code=400,
            detail="至少需要 1 个节点"
        )
    
    edges = [(e.source, e.target) for e in request.edges]
    
    # 验证 DAG
    if edges:
        is_valid, error_msg = global_engine.validate_dag(edges)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
    
    # 验证边中的节点都已定义
    node_names = {n.name for n in request.nodes}
    for parent, child in edges:
        if parent not in node_names or child not in node_names:
            raise HTTPException(
                status_code=400,
                detail=f"Edge ({parent} -> {child}) references undefined node"
            )
    
    try:
        nodes_def = [
            {"name": n.name, "states": n.states, "prior": n.prior}
            for n in request.nodes
        ]
        result = global_engine.build_from_priors(nodes_def, edges)
        
        return BuildFromPriorsResponse(
            success=result["success"],
            nodes=result["nodes"],
            edges=result["edges"],
            message="模型从先验概率构建完成，可以进行推理"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"构建失败: {str(e)}"
        )


@router.get(
    "/nodes",
    summary="获取所有手动节点",
    description="返回所有手动添加的节点列表"
)
async def get_nodes():
    """获取所有手动添加的节点"""
    return {
        "nodes": [
            {"name": name, **info}
            for name, info in manual_nodes.items()
        ]
    }


# ========== Phase 3: Inference ==========

from app.schemas.network import InferRequest, InferResponse


@router.post(
    "/infer",
    response_model=InferResponse,
    summary="执行推理",
    description="给定证据，计算所有节点的后验概率分布"
)
async def infer(request: InferRequest):
    """执行贝叶斯推理"""
    if not global_engine.is_fitted:
        raise HTTPException(
            status_code=400,
            detail="模型尚未训练。请先训练模型。"
        )
    
    try:
        # 获取所有节点
        all_nodes = list(global_engine.model.nodes())
        
        # 如果没有证据，返回先验分布
        if not request.evidence:
            distributions = {}
            for node in all_nodes:
                cpd = global_engine.model.get_cpds(node)
                if cpd and len(cpd.variables) == 1:
                    # 根节点：直接使用 CPD
                    states = cpd.state_names[node]
                    values = cpd.values.flatten()
                    # 确保 state 是字符串
                    distributions[node] = {
                        str(state): float(val) for state, val in zip(states, values)
                    }
                else:
                    # 有父节点：需要边际化
                    result = global_engine.inference_engine.query([node], evidence={})
                    states = result.state_names[node]
                    values = result.values
                    distributions[node] = {
                        str(state): float(prob) for state, prob in zip(states, values)
                    }
            
            return InferResponse(
                success=True,
                distributions=distributions,
                message="先验分布"
            )
        
        # 有证据：执行推理
        distributions = global_engine.query(request.evidence)
        
        # 确保证据节点也包含在内
        for node, state in request.evidence.items():
            if node in all_nodes:
                cpd = global_engine.model.get_cpds(node)
                if cpd:
                    states = cpd.state_names[node]
                    # 确保 state 和对比值都是字符串
                    distributions[node] = {str(s): 1.0 if str(s) == str(state) else 0.0 for s in states}
        
        return InferResponse(
            success=True,
            distributions=distributions,
            message=f"推理完成，使用 {len(request.evidence)} 条证据"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"推理失败: {str(e)}"
        )


@router.delete(
    "/clear_evidence",
    summary="清除证据",
    description="重置所有证据，恢复先验分布"
)
async def clear_evidence():
    """清除所有证据（实际上只需要前端调用 infer with empty evidence）"""
    return {"success": True, "message": "证据已清除"}
