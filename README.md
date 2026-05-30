# ScentMate · 气味名片

> 记录嗅觉记忆，把香水收藏变成可视化的气味星云。
>
> Capture olfactory memories — turn your perfume collection into a visual scent nebula.

[![Live](https://img.shields.io/badge/live-scent--mate.com-fc4c02?style=flat-square)](https://scent-mate.com)
[![Made with Vanilla JS](https://img.shields.io/badge/made%20with-vanilla%20js-f7df1e?style=flat-square)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/auth%20%26%20data-firebase-ffca28?style=flat-square)](https://firebase.google.com)
[![D3.js](https://img.shields.io/badge/visualization-d3-orange?style=flat-square)](https://d3js.org)

---

## ✨ 功能亮点 · Highlights

- **嗅觉日记**：录入每瓶香水的品牌、前/中/后调，自动归类到 11 个气味家族（柑橘、花香、木质、辛辣、美食、草本、果香、树脂、动物、绿叶、其他）。
- **气味星云**：基于 D3.js 力导向图，把你收藏夹里的所有气味画成网络——节点大小反映出现频次，连线粗细反映共现强度。
- **AI 气味名片**：调用大语言模型，根据你的"灵魂香调 Top 3"生成专属的收藏夹名、卡片标题、短香评，并匹配一首气质相合的古典作品。
- **组合搜索**：在星云上选中两个及以上气味或共现连线，让 AI 推荐真实存在的、含有这组组合的香水。
- **气味相投**：与公开了气味名片/收藏夹的其他用户对比共同喜好，按共鸣度（Jaccard 系数）排序。
- **双语界面**：中文 / English 一键切换，全部气味词条提供英文翻译。

---

## 🛠️ 技术栈 · Stack

| 模块 | 选型 |
| --- | --- |
| 前端 | 原生 HTML / CSS / ES Module |
| 可视化 | [D3.js](https://d3js.org) 力导向图 |
| 认证 / 数据 | Firebase Auth + Firestore |
| AI 代理 | Vercel Serverless Function（`/api/ai`） |
| 部署 | Vercel |

没有打包工具、没有框架——所有逻辑都在 `js/*.js`，方便直接调试。

---

## 🚀 本地运行 · Run locally

```bash
# 1. 克隆
git clone https://github.com/FenjuFu/ScentMate.git
cd ScentMate

# 2. 启动任意静态服务器
npx http-server . -p 4321
# 或: python -m http.server 4321

# 3. 浏览器打开
open http://localhost:4321
```

### 需要的环境变量（Vercel）

| 变量 | 用途 |
| --- | --- |
| `AI_BASE_URL` | OpenAI 兼容 API 基地址（例如 `https://api.openai.com/v1`） |
| `AI_API_KEY` | 上面服务的 API Key |
| `AI_MODEL` | 模型名（例如 `gpt-4o-mini`） |
| `GITHUB_TOKEN` | 用于「意见反馈」自动创建 Issue 的 PAT（`public_repo` 权限即可） |

Firebase 配置写在 [js/firebase-config.js](js/firebase-config.js)。

---

## 📁 目录结构 · Layout

```
ScentMate/
├── index.html              # 主入口
├── css/style.css           # 全部样式
├── js/
│   ├── app.js              # 应用主类与路由
│   ├── auth.js             # 登录 / 注册 / 账户设置
│   ├── store.js            # Firestore 读写 & 离线降级
│   ├── viz.js              # D3 力导向图与组合搜索
│   ├── ai-service.js       # 大模型调用 & 兜底音乐配对
│   ├── data.js             # 词典（气味家族、翻译、文案）
│   └── firebase-config.js  # Firebase 项目配置
├── api/
│   ├── ai.js               # AI 代理
│   └── feedback.js         # 意见反馈 → GitHub Issue
└── firestore.rules         # Firestore 安全规则
```

---

## 🎨 设计 · Design

- 主色：`#fc4c02`（暖橙）
- 辅色：四组 Morandi（沙、苔、玫、雾）作为页面背景渐变与卡片点缀
- 字体：Georgia 衬线（标题）+ 系统无衬线（正文）

每张香水卡片左侧的色带由「前调首位香气」所属家族决定，让收藏夹一眼可辨。

---

## 🤝 贡献 · Contributing

欢迎在 [Issues](https://github.com/FenjuFu/ScentMate/issues) 反馈想法和 Bug。
应用内"意见反馈"入口会自动把建议同步到这里。

---

## 📜 License

MIT
