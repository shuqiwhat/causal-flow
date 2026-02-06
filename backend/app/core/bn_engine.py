# 贝叶斯网络核心引擎 - 全局模型管理
from typing import Dict, List, Tuple, Optional, Any
import pandas as pd
from pgmpy.models import DiscreteBayesianNetwork
from pgmpy.estimators import BayesianEstimator, MaximumLikelihoodEstimator
from pgmpy.inference import VariableElimination
import networkx as nx


class BNEngine:
    """贝叶斯网络引擎 - 管理模型生命周期"""
    
    def __init__(self):
        self.model: Optional[DiscreteBayesianNetwork] = None
        self.data: Optional[pd.DataFrame] = None
        self.is_fitted: bool = False
        self.inference_engine: Optional[VariableElimination] = None
    
    def set_data(self, df: pd.DataFrame) -> None:
        """设置数据集"""
        self.data = df
        self.model = None
        self.is_fitted = False
        self.inference_engine = None
    
    def set_structure(self, edges: List[Tuple[str, str]]) -> None:
        """
        设置网络结构
        
        Args:
            edges: 边列表 [(parent, child), ...]
        """
        self.model = DiscreteBayesianNetwork(edges)
        self.is_fitted = False
        self.inference_engine = None
    
    def validate_dag(self, edges: List[Tuple[str, str]]) -> Tuple[bool, str]:
        """
        验证边列表是否构成有效 DAG
        
        Returns:
            (is_valid, error_message)
        """
        if not edges:
            return True, ""
        
        # 创建有向图
        G = nx.DiGraph(edges)
        
        # 检查是否有环
        try:
            cycles = list(nx.simple_cycles(G))
            if cycles:
                cycle_str = " -> ".join(cycles[0] + [cycles[0][0]])
                return False, f"Cycle detected: {cycle_str}"
        except Exception as e:
            return False, f"Graph validation error: {str(e)}"
        
        return True, ""
    
    def fit(self, estimator: str = "mle") -> Dict[str, Any]:
        """
        拟合模型参数 (CPT)
        
        Args:
            estimator: "mle" (Maximum Likelihood) or "bayes" (Bayesian)
        
        Returns:
            训练结果信息
        """
        if self.model is None:
            raise ValueError("Model structure not set. Call set_structure first.")
        if self.data is None:
            raise ValueError("Data not set. Call set_data first.")
        
        # 确保所有节点都在数据中
        model_nodes = set(self.model.nodes())
        data_columns = set(self.data.columns)
        
        missing_nodes = model_nodes - data_columns
        if missing_nodes:
            raise ValueError(f"Nodes not found in data: {missing_nodes}")
        
        # 拟合模型
        if estimator == "bayes":
            self.model.fit(self.data, estimator=BayesianEstimator, prior_type="BDeu")
        else:
            self.model.fit(self.data, estimator=MaximumLikelihoodEstimator)
        
        self.is_fitted = True
        self.inference_engine = VariableElimination(self.model)
        
        return {
            "success": True,
            "nodes": len(self.model.nodes()),
            "edges": len(self.model.edges()),
            "estimator": estimator

        }
    
    def get_cpd(self, node: str) -> Optional[Dict[str, Any]]:
        """获取指定节点的 CPT"""
        if not self.is_fitted:
            return None
        
        cpd = self.model.get_cpds(node)
        if cpd is None:
            return None
        
        return {
            "variable": cpd.variable,
            "states": list(cpd.state_names[cpd.variable]),
            "values": cpd.values.tolist(),
            "parents": list(cpd.variables[1:]) if len(cpd.variables) > 1 else []
        }
    
    def _convert_evidence_types(self, evidence: Dict[str, str]) -> Dict[str, Any]:
        """
        将 evidence 的值转换为模型期望的类型
        前端传来的是字符串，但模型可能期望整数或其他类型
        """
        if not self.model:
            return evidence
        
        converted = {}
        for node, state_str in evidence.items():
            cpd = self.model.get_cpds(node)
            if cpd:
                # 尝试在 state_names 中匹配
                valid_states = cpd.state_names[node]
                matched = False
                for valid_state in valid_states:
                    # 尝试字符串匹配
                    if str(valid_state) == state_str:
                        converted[node] = valid_state  # 使用原始类型
                        matched = True
                        break
                if not matched:
                    # 如果字符串匹配失败，尝试数值匹配
                    try:
                        state_int = int(state_str)
                        if state_int in valid_states:
                            converted[node] = state_int
                            matched = True
                    except ValueError:
                        pass
                if not matched:
                    converted[node] = state_str  # 回退到原始字符串
            else:
                converted[node] = state_str
        return converted
    
    def query(self, evidence: Dict[str, str], targets: List[str] = None) -> Dict[str, Dict[str, float]]:
        """
        执行推断查询
        
        Args:
            evidence: 观测证据 {node: state}
            targets: 目标节点列表，空则查询所有节点
        
        Returns:
            后验概率分布 {node: {state: probability}}
        """
        if not self.is_fitted or self.inference_engine is None:
            raise ValueError("Model not fitted. Call fit first.")
        
        # 转换 evidence 类型以匹配模型期望
        converted_evidence = self._convert_evidence_types(evidence)
        
        if targets is None or len(targets) == 0:
            targets = [n for n in self.model.nodes() if n not in converted_evidence]
        
        results = {}
        
        for target in targets:
            if target in converted_evidence:
                # 证据节点，概率为 1
                results[target] = {str(evidence[target]): 1.0}
            else:
                try:
                    result = self.inference_engine.query([target], evidence=converted_evidence)
                    states = result.state_names[target]
                    values = result.values
                    # 确保 state 是字符串（可能是 numpy int64）
                    results[target] = {str(state): float(prob) for state, prob in zip(states, values)}
                except Exception as e:
                    # 查询失败，返回均匀分布
                    results[target] = {"error": str(e)}
        
        return results
    
    def get_edges(self) -> List[Tuple[str, str]]:
        """获取当前模型的边列表"""
        if self.model is None:
            return []
        return list(self.model.edges())
    
    def get_nodes(self) -> List[str]:
        """获取当前模型的节点列表"""
        if self.model is None:
            return []
        return list(self.model.nodes())


# 全局模型实例
global_engine = BNEngine()
