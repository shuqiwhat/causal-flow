# 结构学习算法封装
from typing import List, Tuple
import pandas as pd
from pgmpy.estimators import HillClimbSearch, K2, BDeu


def learn_structure_hillclimb(data: pd.DataFrame, scoring: str = "k2") -> List[Tuple[str, str]]:
    """
    使用 Hill Climbing 算法自动学习网络结构
    
    Args:
        data: 数据集
        scoring: 评分函数 "k2" 或 "bdeu"
    
    Returns:
        学习到的边列表 [(parent, child), ...]
    """
    # 选择评分函数
    if scoring == "bdeu":
        scoring_method = BDeu(data)
    else:
        scoring_method = K2(data)
    
    # Hill Climbing 搜索
    hc = HillClimbSearch(data)
    
    # 学习最佳结构
    best_model = hc.estimate(scoring_method=scoring_method, max_iter=100)
    
    return list(best_model.edges())


def learn_structure_pc(data: pd.DataFrame) -> List[Tuple[str, str]]:
    """
    使用 PC 算法学习网络结构 (基于条件独立性测试)
    
    Args:
        data: 数据集
    
    Returns:
        学习到的边列表
    """
    from pgmpy.estimators import PC
    
    pc = PC(data)
    model = pc.estimate()
    
    return list(model.edges())
