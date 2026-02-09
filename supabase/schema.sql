-- AgentCraft 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户表 (存储 OAuth 用户信息)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secondme_id VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  avatar TEXT,
  shades TEXT[], -- 用户兴趣标签
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agent 表
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  level INTEGER DEFAULT 1,
  coins INTEGER DEFAULT 1000,
  credit_score INTEGER DEFAULT 500,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 技能表
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  base_price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 市场技能表 (在市场上出售/租赁的技能)
CREATE TABLE IF NOT EXISTS market_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES agents(id),
  current_price INTEGER NOT NULL,
  is_rental BOOLEAN DEFAULT false,
  rental_duration INTEGER, -- 租赁时长（小时）
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' -- active, sold, expired
);

-- 5. Agent 技能表 (Agent 拥有的技能)
CREATE TABLE IF NOT EXISTS agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id),
  level INTEGER DEFAULT 1,
  max_level INTEGER DEFAULT 5,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, skill_id)
);

-- 6. 价格历史表
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_skill_id UUID REFERENCES market_skills(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 美帝奇组合记录表
CREATE TABLE IF NOT EXISTS medici_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id),
  skill1_id UUID REFERENCES skills(id),
  skill2_id UUID REFERENCES skills(id),
  new_skill_id UUID REFERENCES skills(id),
  status VARCHAR(20) DEFAULT 'discovering', -- discovering, found, failed
  discovered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES agents(id),
  seller_id UUID REFERENCES agents(id),
  market_skill_id UUID REFERENCES market_skills(id),
  price INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- sale, rental
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 成就表
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon TEXT,
  requirement TEXT -- JSON 格式存储成就条件
);

-- 10. Agent 成就表
CREATE TABLE IF NOT EXISTS agent_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, achievement_id)
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_market_skills_seller ON market_skills(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_skills_status ON market_skills(status);
CREATE INDEX IF NOT EXISTS idx_agent_skills_agent ON agent_skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_price_history_skill ON price_history(market_skill_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);

-- 插入初始成就数据
INSERT INTO achievements (name, description, icon) VALUES
  ('初出茅庐', '完成首次技能购买', '🎯'),
  ('技能收藏家', '拥有 5 个技能', '💎'),
  ('美帝奇探索者', '完成首次技能组合', '✨'),
  ('交易达人', '完成 10 笔交易', '💰'),
  ('跨域大师', '完成 5 次跨域技能组合', '🔮')
ON CONFLICT DO NOTHING;
