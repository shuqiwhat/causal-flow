# 数据处理与离散化
from typing import Dict, List, Any, Tuple
import pandas as pd
from io import StringIO

# 离散变量阈值：唯一值超过此数则视为连续变量
DISCRETE_THRESHOLD = 15


class DataProcessor:
    """CSV 数据处理器 - 负责验证和提取贝叶斯网络所需的元信息"""

    def __init__(self, csv_content: str):
        """
        初始化数据处理器
        
        Args:
            csv_content: CSV 文件的字符串内容
        """
        self.csv_content = csv_content
        self.df: pd.DataFrame = None
        self.meta_info: Dict[str, List[str]] = {}
        self.invalid_columns: List[str] = []

    def validate_and_process(self) -> Tuple[bool, str]:
        """
        验证并处理 CSV 数据
        
        Returns:
            (is_valid, error_message) - 验证结果和错误信息
        """
        # 1. 解析 CSV
        try:
            self.df = pd.read_csv(StringIO(self.csv_content))
        except Exception as e:
            return False, f"CSV 解析失败: {str(e)}"

        # 2. 检查是否为空
        if self.df.empty:
            return False, "CSV 文件为空"

        if len(self.df.columns) == 0:
            return False, "CSV 文件没有列"

        # 3. 检查每列的离散性
        self.invalid_columns = []
        for col in self.df.columns:
            unique_count = self.df[col].nunique()
            if unique_count > DISCRETE_THRESHOLD:
                self.invalid_columns.append(col)

        if self.invalid_columns:
            cols_str = ", ".join(self.invalid_columns)
            return False, f"以下列包含过多唯一值 (>{DISCRETE_THRESHOLD})，请预处理为离散数据: {cols_str}"

        # 4. 提取元信息
        self._extract_meta_info()

        return True, ""

    def _extract_meta_info(self) -> None:
        """提取每列的状态空间（唯一值列表）"""
        for col in self.df.columns:
            # 获取唯一值并转换为字符串列表
            unique_values = self.df[col].dropna().unique()
            self.meta_info[col] = [str(v) for v in sorted(unique_values)]

    def get_columns(self) -> List[str]:
        """获取所有列名"""
        return list(self.df.columns)

    def get_meta_info(self) -> Dict[str, List[str]]:
        """获取列元信息 (列名 -> 状态列表)"""
        return self.meta_info

    def get_preview(self, rows: int = 10) -> List[Dict[str, Any]]:
        """获取前 N 行预览数据"""
        preview_df = self.df.head(rows)
        return preview_df.to_dict(orient="records")

    def get_row_count(self) -> int:
        """获取总行数"""
        return len(self.df)

    def get_column_count(self) -> int:
        """获取总列数"""
        return len(self.df.columns)
