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

## 公网部署说明（Netlify 网页 + 后端）

Netlify **只能托管前端**，游戏联机依赖 WebSocket 后端。

### 1. 修复并部署前端到 Netlify
仓库已修正 `netlify.toml`（原先 `frontend/netlify.toml` 非法 TOML 会导致 “Reading and parsing configuration files” 失败）。推送 `main` 后应自动重新部署。

站点示例：`https://avalononline.netlify.app`（以你控制台域名为准）

### 2. 本机跑后端并开隧道（临时公网）
```bash
cd backend
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000
```
另开终端：
```bash
cloudflared tunnel --protocol http2 --url http://127.0.0.1:8000
```
记下输出的 `https://xxxx.trycloudflare.com`。

### 3. 在 Netlify 站点里连接后端
打开 Netlify 站点 → 点 **「服务器」** → 填入：
`wss://xxxx.trycloudflare.com/ws` → **保存并重连**。  
看到「已连接」后即可开房 / AI 单人游玩。

> 隧道关掉后公网就断了；长期上线请把后端放到 Render / Railway / VPS，再把该 `wss://.../ws` 填进站点。

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
