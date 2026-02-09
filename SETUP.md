# 快速设置指南

## 方法：一键设置（推荐）

1. 访问 http://localhost:3000/setup
2. 点击"开始设置"按钮
3. 等待完成！

## 如果需要数据库密码

1. 访问 https://supabase.com/dashboard/project/tzqcimpabjmrxlftkgfy/settings/database
2. 找到 **Connection string** → **URI**
3. 点击 **Show password** 或 **Generate new password**
4. 复制密码后更新 `.env.local`:

```
DATABASE_URL=postgresql://postgres.tzqcimpabjmrxlftkgfy:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## 设置完成后

访问 http://localhost:3000 开始使用 AgentCraft！
