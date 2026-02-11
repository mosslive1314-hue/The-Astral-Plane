-- 通爻协议表结构扩展
-- 在 Supabase SQL Editor 中执行此脚本

-- 启用 pgvector 扩展（用于向量搜索）
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. 协商会话表
CREATE TABLE IF NOT EXISTS negotiation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  formulated_requirement JSONB,
  requirement_vector VECTOR(768),
  status VARCHAR(20) DEFAULT 'negotiating',
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Agent Offer表
CREATE TABLE IF NOT EXISTS agent_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES negotiation_sessions(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  offer_content JSONB NOT NULL,
  confidence DECIMAL(3, 2),
  resonance_score DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 投影透镜配置表
CREATE TABLE IF NOT EXISTS projection_lenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入初始投影透镜（渐进式，从简单到复杂）
INSERT INTO projection_lenses (name, description, config, is_default) VALUES
  ('基础透镜', '只按技能名称和类别进行简单匹配', '{"weights": {"skill_name": 1.0, "skill_category": 1.0}, "filters": []}', true),
  ('经验透镜', '考虑Agent的等级和信用评分', '{"weights": {"skill_name": 0.8, "skill_category": 0.8, "agent_level": 0.5, "credit_score": 0.3}, "filters": {"min_level": 1}}'),
  ('响应透镜', '优先考虑响应速度和在线状态', '{"weights": {"skill_name": 0.7, "skill_category": 0.7, "response_time": 0.8, "active": 1.0}, "filters": {"active_only": true}}')
ON CONFLICT (name) DO NOTHING;

-- 4. Agent投影缓存表（避免频繁从SecondMe拉取）
CREATE TABLE IF NOT EXISTS agent_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  secondme_data JSONB,
  profile_vector VECTOR(768),
  lens_id UUID REFERENCES projection_lenses(id),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '6 hours'
);

-- 5. 子需求表（用于递归协商）
CREATE TABLE IF NOT EXISTS sub_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_session_id UUID REFERENCES negotiation_sessions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  vector VECTOR(768),
  status VARCHAR(20) DEFAULT 'pending',
  assigned_agent_id UUID REFERENCES agents(id),
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 扩展agents表
ALTER TABLE agents ADD COLUMN IF NOT EXISTS profile_vector VECTOR(768);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS projection_lens_id UUID REFERENCES projection_lenses(id);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_resonance_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER DEFAULT 30;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS satisfaction_rate DECIMAL(3, 2) DEFAULT 5.0;

-- 7. 扩展users表，添加OAuth相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondme_synced_at TIMESTAMP WITH TIME ZONE;

-- 8. 创建向量搜索索引
CREATE INDEX IF NOT EXISTS idx_agents_profile_vector ON agents USING ivfflat (profile_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_vector ON negotiation_sessions USING ivfflat (requirement_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_agent_projections_vector ON agent_projections USING ivfflat (profile_vector vector_cosine_ops);

-- 9. 创建性能索引
CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_user ON negotiation_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_offers_session ON agent_offers(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_projections_agent ON agent_projections(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_projections_expires ON agent_projections(expires_at);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active, last_resonance_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_requirements_parent ON sub_requirements(parent_session_id, status);

-- 10. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_negotiation_sessions_updated_at
  BEFORE UPDATE ON negotiation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. 创建过期投影清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_projections()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_projections
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 12. 清理过期数据的定时任务（需要pg_cron扩展，Supabase默认支持）
-- SELECT cron.schedule('cleanup-projections', '0 * * * * *', 'SELECT cleanup_expired_projections()');
