# AgentCraft - 数据库设置指南

## 步骤 1: 在 Supabase 创建表

1. 访问 https://supabase.com/dashboard
2. 选择你的项目 `tzqcimpabjmrxlftkgfy`
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New Query**
5. 复制 `schema.sql` 文件内容
6. 粘贴到编辑器中
7. 点击 **Run** 执行 SQL

## 步骤 2: 获取 API 密钥

1. 在 Supabase 项目中，点击 **Settings** → **API**
2. 复制以下信息：
   - **Project URL** (已配置): `https://tzqcimpabjmrxlftkgfy.supabase.co`
   - **anon public** key: 复制并更新到 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key: (已配置，不要泄露)

## 步骤 3: 更新 .env.local

如果 `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是示例值，请替换为你项目的实际 anon key。

## 步骤 4: 配置 Row Level Security (可选)

如需启用 RLS，在 SQL Editor 中执行：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;

-- 允许用户读取自己的数据
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = secondme_id);

CREATE POLICY "Agents can view own data" ON agents
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE secondme_id = auth.uid()::text));
```

## 完成后

重启开发服务器：
```bash
npm run dev
```

访问 http://localhost:3000 开始使用！
