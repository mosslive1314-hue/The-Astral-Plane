import { NextResponse } from 'next/server'
import { Client } from 'pg'

const connectionString = 'postgresql://postgres.tzqcimpabjmrxlftkgfy:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    
    // 创建表的 SQL
    const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secondme_id VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  avatar TEXT,
  shades TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  rarity VARCHAR(20) DEFAULT 'common',
  base_price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id),
  level INTEGER DEFAULT 1,
  max_level INTEGER DEFAULT 5,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, skill_id)
);

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_skill_id UUID REFERENCES market_skills(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES agents(id),
  seller_id UUID REFERENCES agents(id),
  market_skill_id UUID REFERENCES market_skills(id),
  price INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon TEXT,
  requirement TEXT
);

CREATE TABLE IF NOT EXISTS agent_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_market_skills_seller ON market_skills(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_skills_status ON market_skills(status);
CREATE INDEX IF NOT EXISTS idx_agent_skills_agent ON agent_skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_price_history_skill ON price_history(market_skill_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  tags TEXT[],
  thinking_model VARCHAR(50),
  linked_skill_id UUID REFERENCES skills(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_agent ON notes(agent_id);

INSERT INTO achievements (name, description, icon) VALUES
  ('初出茅庐', '完成首次技能购买', '🎯'),
  ('技能收藏家', '拥有 5 个技能', '💎'),
  ('美帝奇探索者', '完成首次技能组合', '✨'),
  ('交易达人', '完成 10 笔交易', '💰'),
  ('跨域大师', '完成 5 次跨域技能组合', '🔮')
ON CONFLICT DO NOTHING;
`

    await client.query(sql)

    // 验证表
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)

    await client.end()

    return NextResponse.json({
      success: true,
      message: 'Database setup complete',
      tables: result.rows.map(r => r.table_name)
    })

  } catch (error: any) {
    await client.end().catch(() => {})
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
