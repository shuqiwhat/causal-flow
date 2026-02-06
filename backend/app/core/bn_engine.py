# 贝叶斯网络核心引擎 - 全局模型管理
from typing import Dict, List, Tuple, Optional, Any
import numpy as np
import pandas as pd
from pgmpy.models import DiscreteBayesianNetwork
from pgmpy.estimators import BayesianEstimator, MaximumLikelihoodEstimator
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
import networkx as nx


class BNEngine:
    """贝叶斯网络引擎 - 管理模型生命周期"""
    
    def __init__(self):
        self.model: Optional[DiscreteBayesianNetwork] = None
        self.data: Optional[pd.DataFrame] = None
        self.is_fitted: bool = False
        self.inference_engine: Optional[VariableElimination] = None
        # 存储手动节点定义（用于 prior-only 模式）
        self.manual_nodes: Dict[str, Dict] = {}  # {name: {states: [...], prior: {...}}}
    
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

    def build_from_priors(
        self,
        nodes_def: List[Dict[str, Any]],
        edges: List[Tuple[str, str]]
    ) -> Dict[str, Any]:
        """
        从用户定义的先验概率构建贝叶斯网络（不需要数据）。
        
        对于根节点（无父节点）：使用用户提供的 prior，未提供则均匀分布。
        对于子节点（有父节点）：如果没有数据，构建均匀条件分布。
        
        Args:
            nodes_def: [{"name": "X", "states": ["A","B"], "prior": {"A": 0.6, "B": 0.4}}, ...]
            edges: [(parent, child), ...]
        
        Returns:
            训练结果信息
        """
        # 存储节点定义
        self.manual_nodes = {nd["name"]: nd for nd in nodes_def}
        
        # 构建网络结构
        self.model = DiscreteBayesianNetwork()
        
        # 添加所有节点
        node_states = {}  # name -> [state1, state2, ...]
        for nd in nodes_def:
            self.model.add_node(nd["name"])
            node_states[nd["name"]] = nd["states"]
        
        # 添加边
        for parent, child in edges:
            self.model.add_edge(parent, child)
        
        # 为每个节点构建 CPD
        for nd in nodes_def:
            node_name = nd["name"]
            states = nd["states"]
            prior = nd.get("prior")
            
            # 获取父节点
            parents = list(self.model.get_parents(node_name))
            
            if not parents:
                # 根节点：使用用户 prior 或均匀分布
                if prior and len(prior) == len(states):
                    values = [prior.get(s, 1.0 / len(states)) for s in states]
                    # 归一化
                    total = sum(values)
                    values = [v / total for v in values]
                else:
                    values = [1.0 / len(states)] * len(states)
                
                cpd = TabularCPD(
                    variable=node_name,
                    variable_card=len(states),
                    values=[[v] for v in values],
                    state_names={node_name: states}
                )
            else:
                # 子节点：构建条件概率表
                parent_cards = []
                parent_state_names = {}
                for p in parents:
                    p_states = node_states[p]
                    parent_cards.append(len(p_states))
                    parent_state_names[p] = p_states
                
                # 总的父节点组合数
                num_parent_combos = 1
                for c in parent_cards:
                    num_parent_combos *= c
                
                # 如果子节点有 prior，用 prior 作为每种父节点组合下的分布
                # 否则用均匀分布
                if prior and len(prior) == len(states):
                    base_values = [prior.get(s, 1.0 / len(states)) for s in states]
                    total = sum(base_values)
                    base_values = [v / total for v in base_values]
                else:
                    base_values = [1.0 / len(states)] * len(states)
                
                # 每一行是一个 state，每一列是一种父节点组合
                values = [
                    [base_values[i]] * num_parent_combos 
                    for i in range(len(states))
                ]
                
                state_names = {node_name: states, **parent_state_names}
                
                cpd = TabularCPD(
                    variable=node_name,
                    variable_card=len(states),
                    values=values,
                    evidence=parents,
                    evidence_card=parent_cards,
                    state_names=state_names
                )
            
            self.model.add_cpds(cpd)
        
        # 验证模型
        assert self.model.check_model(), "Model validation failed"
        
        self.is_fitted = True
        self.inference_engine = VariableElimination(self.model)
        
        return {
            "success": True,
            "nodes": len(self.model.nodes()),
            "edges": len(self.model.edges()),
        }


# 全局模型实例
global_engine = BNEngine()
