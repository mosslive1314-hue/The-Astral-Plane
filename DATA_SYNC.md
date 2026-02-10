# Second Me Data Sync & Integration Guide

## 1. 核心架构：双源数据流 (Dual Source of Truth)

为了保证游戏化体验（实时性）与数字孪生（真实性）的平衡，我们采用了双数据源策略：

| 数据类型 | 来源 (Source) | 存储位置 (Storage) | 更新频率 |
| :--- | :--- | :--- | :--- |
| **身份信息** (Avatar, Name) | Second Me API | Supabase `users` 表 | 每次登录 / 手动同步 |
| **软记忆** (Skills, Interests) | Second Me API | 实时获取 (不存库) / 缓存 | 每次访问 Profile / 手动同步 |
| **数字资产** (Coins) | AgentCraft (游戏内) | Supabase `agents` 表 | 实时 (完成任务时) |
| **算力估值** (Hashrate) | 混合计算 | 实时计算 | 实时 (基于等级+资产) |

---

## 2. 如何对接真实 API

### 第一步：获取凭证
你需要向 Second Me 官方申请 OAuth2 应用凭证：
1. **Client ID**
2. **Client Secret**
3. **Redirect URI** (设置为 `http://localhost:3000/api/auth/callback` 或你的线上域名)

### 第二步：配置环境变量
在项目根目录创建或编辑 `.env.local` 文件，填入以下内容：

```bash
# Second Me OAuth2 Configuration
SECONDME_CLIENT_ID="你的_CLIENT_ID"
SECONDME_CLIENT_SECRET="你的_CLIENT_SECRET"
SECONDME_REDIRECT_URI="http://localhost:3000/api/auth/callback"

# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL="你的_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="你的_SUPABASE_KEY"
SUPABASE_SERVICE_ROLE_KEY="你的_SERVICE_ROLE_KEY"
```

### 第三步：验证流程
1. 启动项目 `npm run dev`。
2. 访问 `/profile` 页面。
3. 点击左侧卡片中的 **"同步 Second Me 数据"** 按钮。
   - 系统将调用 `getUserInfo` 和 `getUserSoftMemory` 接口。
   - 成功后，你的头像、昵称和右侧的“软记忆”列表将自动更新为 Second Me 的真实数据。

---

## 3. 常见问题 (FAQ)

**Q: 为什么“软记忆”不存入数据库？**
A: 软记忆属于用户的隐私数据，且在 Second Me 端可能频繁更新。为了保护隐私并确保数据即时性，我们选择在用户访问时实时拉取，而非持久化存储。

**Q: “算力估值”有什么用？**
A: 这是 AgentCraft 的核心机制。算力决定了你在“灵墟 (Market)”发布方案时的初始定价权，以及在“通爻 (ToWow)”协议中进行自动化协商时的权重。算力越高，协商成功率越高。

**Q: 如果 API 请求失败怎么办？**
A: 系统内置了 Mock (模拟) 数据模式。如果未配置环境变量或网络请求失败，UI 会自动降级显示演示数据，确保界面不会崩坏。
