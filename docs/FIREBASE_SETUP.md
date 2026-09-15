# Avalon · Firebase 联机配置

目标：朋友只打开 Netlify 链接就能进房，**不用填「服务器」**。

| 平台 | 作用 |
|------|------|
| **Netlify** | 网页 |
| **Firebase Realtime Database** | 房间状态实时同步 |

---

## 第 1 步：打开控制台并登录

1. 浏览器打开：https://console.firebase.google.com/
2. 用你的 Google 账号登录

---

## 第 2 步：创建项目

1. 点 **Create a project / 添加项目**
2. 项目名例如：`avalon-online`（随意）
3. Google Analytics 可关可开，不影响联机
4. 等到项目创建完成，进入项目首页

---

## 第 3 步：添加 Web 应用（拿到配置）

1. 项目概览里点 **</> Web**（或齿轮 → 项目设置 → 你的应用 → 添加应用）
2. 应用昵称例如：`avalon-web`
3. **不要**勾选 Firebase Hosting（我们用 Netlify）
4. 点注册应用
5. 页面会出现 `apiKey` / `authDomain` / `projectId` 等，**先复制保存**

> 此时可能还没有 `databaseURL`，下一步创建数据库后会出现。

---

## 第 4 步：创建 Realtime Database（关键）

1. 左侧菜单：**Build → Realtime Database**
2. 点 **Create Database**
3. 地区选离你近的即可
4. 安全规则选 **测试模式（test mode）**（熟人小范围）
5. 记下数据库地址，例如：

```text
https://xxxx-default-rtdb.firebaseio.com
```

---

## 第 5 步：本地环境变量

复制 `frontend/.env.example` 为 `frontend/.env`：

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=https://...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

- 不要把 `.env` 提交到 GitHub
- `DATABASE_URL` 必须带 `https://`

然后：

```bash
cd frontend
npm install
npm run dev
```

页眉应显示 **Firebase 已就绪**。

---

## 第 6 步：Netlify 环境变量（上线必做）

在 Netlify 站点 → **Environment variables** 添加同样 7 个名字：

1. `VITE_FIREBASE_API_KEY`
2. `VITE_FIREBASE_AUTH_DOMAIN`
3. `VITE_FIREBASE_DATABASE_URL`
4. `VITE_FIREBASE_PROJECT_ID`
5. `VITE_FIREBASE_STORAGE_BUCKET`
6. `VITE_FIREBASE_MESSAGING_SENDER_ID`
7. `VITE_FIREBASE_APP_ID`

保存后 **Trigger deploy**（必须重新 build，变量才会打进网页）。

---

## 怎么玩

1. 打开 Netlify 站点
2. 创建房间 → **邀请好友** 复制链接  
   （`https://avalononline.netlify.app/#/r/房间号`）
3. 朋友点开 → 填昵称 → 进同一房

房主需保持页面打开（房主权威结算）；可用 **AI 填满** 单人测流程。

---

## 安全说明

测试模式数据库读写较开放；房间 `state` 含身份信息。仅适合熟人局。正式对外再收紧规则。
