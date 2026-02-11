-- 添加 soft_memory 字段到 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS soft_memory JSONB DEFAULT '[]'::jsonb;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_users_secondme_id ON users(secondme_id);
CREATE INDEX IF NOT EXISTS idx_users_shades ON users USING GIN(shades);
CREATE INDEX IF NOT EXISTS idx_users_soft_memory ON users USING GIN(soft_memory);
