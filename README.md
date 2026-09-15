# Avalon Online

熟人局网页阿瓦隆：房间 ID 联机、官方规则、角色头像揭示动画。

## 本地运行

### 1. 后端

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://127.0.0.1:5173 （开发服务器已把 `/ws` 代理到后端）。

## 公网部署说明

当前会话未检测到可用的 Netlify MCP 工具。可用手动方式：

1. **前端 → Netlify**  
   - 根目录选 `frontend`，或仓库已含 `frontend/netlify.toml`  
   - 构建：`npm run build`，发布目录：`dist`  
   - 环境变量：`VITE_WS_URL=wss://你的后端域名/ws`（必须在 build 时注入）

2. **后端 → 支持 WebSocket 的宿主**（Render / Railway / Fly.io / 自有 VPS）  
   - Netlify 只能托管静态前端，**不能**跑 FastAPI WebSocket  
   - 启动：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`  
   - 打开 CORS（已默认 `*`）

## 玩法要点

- 房主设人数 → 人齐后按推荐角色开局（可自定义）  
- 身份卡翻转 + 专属 SVG 头像 + 夜间视野  
- 同时投票 / 同时出任务牌；局内表情；线下发言  
- 断线自动尝试重连（localStorage）

## 单人 / AI 测试

1. 创建房间并设定人数  
2. 房主点击 **「AI 填满空位」**  
3. 开始游戏：AI 会自动确认身份、组队、投票、出牌与刺杀  

页眉 **「说明书」** 可查看胜负目标、流程、人数任务表与各角色规则。
