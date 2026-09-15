# Avalon Online

熟人局网页阿瓦隆：房间码联机、官方规则、角色头像揭示动画。  
朋友打开同一 Netlify 链接即可开房 / 进房，**不用填服务器**。

## 本地运行

1. 按 [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) 配置 `frontend/.env`（7 个 `VITE_FIREBASE_*`）
2. 安装并启动前端：

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://127.0.0.1:5173

## 公网部署（Netlify + Firebase）

| 平台 | 作用 |
|------|------|
| **Netlify** | 静态网页 |
| **Firebase Realtime Database** | 房间状态实时同步（房主权威） |

1. Netlify → Environment variables 填入与本地相同的 7 个 `VITE_FIREBASE_*`
2. Trigger deploy / 重新部署（必须重新 build）
3. 打开站点 → 创建房间 → **邀请好友** 复制链接（形如 `https://你的站点/#/r/房间号`）

## 玩法要点

- 房主设人数（5–10）→ 人齐后按推荐角色开局（可自定义）
- 身份卡翻转 + 专属 SVG 头像 + 夜间视野
- 同时投票 / 同时出任务牌；局内表情；线下发言
- 断线后用同一浏览器重开邀请链接可回到房间

## 单人 / AI 测试

1. 创建房间并设定人数
2. 房主点击 **「AI 填满」**
3. 开始游戏：AI 会自动确认身份、组队、投票、出牌与刺杀

页眉 **「说明书」** 可查看胜负目标、流程、人数任务表与各角色规则。

> 注意：测试模式 RTDB 下，房间状态（含身份）对拿到房间号的人可读。仅适合熟人小局。
