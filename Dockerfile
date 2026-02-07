# ========================================
# Hugging Face Spaces Dockerfile
# 在单个容器中运行 FastAPI 后端 + React 前端
# ========================================

# ============ Stage 1: 构建前端 ============
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./
RUN npm install

# 复制前端代码
COPY frontend/ ./

# 设置 API URL 为相对路径（nginx 会代理到后端）
ENV VITE_API_URL=/api

# 构建前端
RUN npm run build

# ============ Stage 2: 最终镜像 ============
FROM python:3.13-slim

# 创建非 root 用户（HF Spaces 要求）
RUN useradd -m -u 1000 user

# 安装 nginx 和 supervisor
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# 切换工作目录
WORKDIR /app

# 复制后端依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ ./

# 从前端构建阶段复制静态文件到 nginx 目录
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx-hf.conf /etc/nginx/nginx.conf

# 复制 supervisor 配置
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 创建 nginx 运行所需的目录并修改权限
RUN mkdir -p /var/run/nginx /var/log/nginx /var/lib/nginx/body /var/lib/nginx/fastcgi \
    /var/lib/nginx/proxy /var/lib/nginx/scgi /var/lib/nginx/uwsgi /var/log/supervisor \
    && chown -R user:user /app /usr/share/nginx/html /var/log/nginx /var/lib/nginx \
    /var/run/nginx /var/log/supervisor \
    && chmod -R 755 /var/lib/nginx /var/run/nginx

# 切换到非 root 用户
USER user

# 暴露端口（HF Spaces 必须是 7860）
EXPOSE 7860

# 启动 supervisor（管理 nginx 和 uvicorn）
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
