import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tzqcimpabjmrxlftkgfy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cWNpbXBhYmptcnhsZnRrZ2Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUzMTU2MSwiZXhwIjoyMDg2MTA3NTYxfQ.JvFQFJ_7ZLiQ20FFrE3kacFQEq9pePwhyI8_Oqc4WpY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🚀 Setting up AgentCraft database...\n')

  // SQL 语句
  const sql = `
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secondme_id VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  avatar TEXT,
  shades TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent 表
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

-- 技能表
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  rarity VARCHAR(20) DEFAULT 'common',
  base_price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 市场技能表
CREATE TABLE IF NOT EXISTS market_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES agents(id),
  current_price INTEGER NOT NULL,
  is_rental BOOLEAN DEFAULT false,
  rental_duration INTEGER,
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active'
);

-- Agent 技能表
CREATE TABLE IF NOT EXISTS agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id),
  level INTEGER DEFAULT 1,
  max_level INTEGER DEFAULT 5,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, skill_id)
);

-- 价格历史表
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_skill_id UUID REFERENCES market_skills(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 美帝奇组合记录表
CREATE TABLE IF NOT EXISTS medici_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id),
  skill1_id UUID REFERENCES skills(id),
  skill2_id UUID REFERENCES skills(id),
  new_skill_id UUID REFERENCES skills(id),
  status VARCHAR(20) DEFAULT 'discovering',
  discovered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES agents(id),
  seller_id UUID REFERENCES agents(id),
  market_skill_id UUID REFERENCES market_skills(id),
  price INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon TEXT,
  requirement TEXT
);

-- Agent 成就表
CREATE TABLE IF NOT EXISTS agent_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, achievement_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_market_skills_seller ON market_skills(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_skills_status ON market_skills(status);
CREATE INDEX IF NOT EXISTS idx_agent_skills_agent ON agent_skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_price_history_skill ON price_history(market_skill_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);

-- 插入初始成就
INSERT INTO achievements (name, description, icon) VALUES
  ('初出茅庐', '完成首次技能购买', '🎯'),
  ('技能收藏家', '拥有 5 个技能', '💎'),
  ('美帝奇探索者', '完成首次技能组合', '✨'),
  ('交易达人', '完成 10 笔交易', '💰'),
  ('跨域大师', '完成 5 次跨域技能组合', '🔮')
ON CONFLICT DO NOTHING;
`

  try {
    console.log('📡 Executing SQL via Supabase...')
    // 注意：这种方式需要通过 Supabase 的 RPC 或直接 SQL 执行
    // 使用 service_role key 通过 REST API 执行
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }

    console.log('✅ Database setup complete!')
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n💡 Alternative: Run the SQL manually in Supabase Dashboard SQL Editor')
  }
}

setupDatabase()
