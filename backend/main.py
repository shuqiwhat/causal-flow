# FastAPI 启动入口
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import router as api_router

app = FastAPI(
    title="CausalFlow API",
    description="贝叶斯网络推演平台后端 API",
    version="0.1.0"
)

# CORS 配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，方便部署调试。生产环境建议设置为具体的 Vercel 域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router)


@app.get("/", tags=["Health"])
async def root():
    """健康检查"""
    return {"status": "ok", "message": "CausalFlow API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
