#!/bin/bash

# ================================================
# Hugging Face Spaces 部署脚本
# ================================================

set -e  # 遇到错误立即退出

echo "🚀 开始部署到 Hugging Face Spaces..."

# 配置
HF_SPACE_URL="https://huggingface.co/spaces/shuqihere/bn-causal-flow"
TEMP_DIR="/tmp/bn-causal-flow-hf-deploy"
PROJECT_DIR="/Users/shuqi/Desktop/Projects/casualflow"

# 清理旧的临时目录
if [ -d "$TEMP_DIR" ]; then
    echo "🧹 清理旧的临时目录..."
    rm -rf "$TEMP_DIR"
fi

# Step 1: 克隆 HF Space 仓库
echo "📥 克隆 Hugging Face Space 仓库..."
git clone "$HF_SPACE_URL" "$TEMP_DIR"
cd "$TEMP_DIR"

# Step 2: 复制文件
echo "📦 复制项目文件..."

# 复制后端（排除 venv 和 __pycache__）
echo "  - 复制后端..."
rsync -av --exclude='venv' --exclude='__pycache__' "$PROJECT_DIR/backend/" "$TEMP_DIR/backend/"

# 复制前端（排除 node_modules 和 dist）
echo "  - 复制前端..."
rsync -av --exclude='node_modules' --exclude='dist' "$PROJECT_DIR/frontend/" "$TEMP_DIR/frontend/"

# 复制配置文件
echo "  - 复制配置文件..."
cp "$PROJECT_DIR/Dockerfile" "$TEMP_DIR/"
cp "$PROJECT_DIR/nginx-hf.conf" "$TEMP_DIR/"
cp "$PROJECT_DIR/supervisord.conf" "$TEMP_DIR/"
cp "$PROJECT_DIR/README-HF.md" "$TEMP_DIR/README.md"
cp "$PROJECT_DIR/.gitignore-hf" "$TEMP_DIR/.gitignore"

# Step 3: 提交
echo "📝 提交更改..."
git add .
git status

# 确认
echo ""
echo "====================================="
echo "准备推送以下文件到 HF Space:"
echo "====================================="
git diff --cached --stat
echo ""
read -p "确认推送? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Step 4: 推送
    echo "🚀 推送到 Hugging Face..."
    git commit -m "Initial deployment: Full-stack Bayesian Network workbench

- FastAPI backend with pgmpy for Bayesian Network inference
- React frontend with visual DAG editor
- Unified Docker container with nginx reverse proxy
- Features: CSV upload, structure learning, real-time inference"
    
    git push
    
    echo ""
    echo "✅ 部署成功!"
    echo ""
    echo "🌐 访问你的 Space: https://huggingface.co/spaces/shuqihere/bn-causal-flow"
    echo "⏳ 等待约 5-10 分钟让 HF 构建容器..."
    echo ""
else
    echo "❌ 取消部署"
    exit 1
fi

# 清理
echo "🧹 清理临时目录..."
cd ~
rm -rf "$TEMP_DIR"

echo "🎉 完成!"
