'use server'

import { supabase } from '@/lib/database'

const MIGRATION_STATEMENTS = [
  {
    name: '启用pgvector扩展',
    sql: `CREATE EXTENSION IF NOT EXISTS "vector";`
  },
  {
    name: '创建协商会话表',
    sql: `
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
    `
  },
  {
    name: '创建Agent Offer表',
    sql: `
      CREATE TABLE IF NOT EXISTS agent_offers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID REFERENCES negotiation_sessions(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        offer_content JSONB NOT NULL,
        confidence DECIMAL(3, 2),
        resonance_score DECIMAL(3, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: '创建投影透镜配置表',
    sql: `
      CREATE TABLE IF NOT EXISTS projection_lenses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        config JSONB NOT NULL DEFAULT '{}',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: '插入初始投影透镜',
    sql: `
      INSERT INTO projection_lenses (name, description, config, is_default) VALUES
        ('基础透镜', '只按技能名称和类别进行简单匹配', '{"weights": {"skill_name": 1.0, "skill_category": 1.0}, "filters": []}', true),
        ('经验透镜', '考虑Agent的等级和信用评分', '{"weights": {"skill_name": 0.8, "skill_category": 0.8, "agent_level": 0.5, "credit_score": 0.3}, "filters": {"min_level": 1}}', false),
        ('响应透镜', '优先考虑响应速度和在线状态', '{"weights": {"skill_name": 0.7, "skill_category": 0.7, "response_time": 0.8, "active": 1.0}, "filters": {"active_only": true}}', false)
      ON CONFLICT (name) DO NOTHING;
    `
  },
  {
    name: '创建Agent投影缓存表',
    sql: `
      CREATE TABLE IF NOT EXISTS agent_projections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
        secondme_data JSONB,
        profile_vector VECTOR(768),
        lens_id UUID REFERENCES projection_lenses(id),
        last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '6 hours'
      );
    `
  },
  {
    name: '创建子需求表',
    sql: `
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
    `
  },
  {
    name: '扩展agents表',
    sql: `
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS profile_vector VECTOR(768);
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS projection_lens_id UUID REFERENCES projection_lenses(id);
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_resonance_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER DEFAULT 30;
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS satisfaction_rate DECIMAL(3, 2) DEFAULT 5.0;
    `
  },
  {
    name: '扩展users表',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS access_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS secondme_synced_at TIMESTAMP WITH TIME ZONE;
    `
  },
  {
    name: '创建向量搜索索引',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_agents_profile_vector ON agents USING ivfflat (profile_vector vector_cosine_ops);
      CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_vector ON negotiation_sessions USING ivfflat (requirement_vector vector_cosine_ops);
      CREATE INDEX IF NOT EXISTS idx_agent_projections_vector ON agent_projections USING ivfflat (profile_vector vector_cosine_ops);
    `
  },
  {
    name: '创建性能索引',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_user ON negotiation_sessions(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_agent_offers_session ON agent_offers(session_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_agent_projections_agent ON agent_projections(agent_id);
      CREATE INDEX IF NOT EXISTS idx_agent_projections_expires ON agent_projections(expires_at);
      CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active, last_resonance_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sub_requirements_parent ON sub_requirements(parent_session_id, status);
    `
  },
  {
    name: '创建更新时间触发器',
    sql: `
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
    `
  },
  {
    name: '创建过期投影清理函数',
    sql: `
      CREATE OR REPLACE FUNCTION cleanup_expired_projections()
      RETURNS void AS $$
      BEGIN
        DELETE FROM agent_projections
        WHERE expires_at < NOW();
      END;
      $$ LANGUAGE plpgsql;
    `
  }
]

export interface MigrationResult {
  success: boolean
  message: string
  step: number
  total: number
  failed: boolean
  details?: string
}

async function executeSQLDirectly(sql: string): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      success: false,
      error: '缺少必要的Supabase配置'
    }
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql_param: sql
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[SQL Direct] Execution failed:', data)
      
      const errorMsg = data.message || data.error || JSON.stringify(data)
      
      if (errorMsg.includes('function exec_sql') || errorMsg.includes('exec_sql')) {
        return {
          success: false,
          error: 'EXEC_SQL_FUNCTION_NOT_FOUND'
        }
      }
      
      return {
        success: false,
        error: errorMsg
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('[SQL Direct] Exception:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function executeDatabaseMigration(): Promise<MigrationResult> {
  const results: { step: number; name: string; success: boolean; error?: string }[] = []
  
  for (let i = 0; i < MIGRATION_STATEMENTS.length; i++) {
    const statement = MIGRATION_STATEMENTS[i]
    console.log(`[Migration ${i + 1}/${MIGRATION_STATEMENTS.length}] ${statement.name}...`)
    
    const result = await executeSQLDirectly(statement.sql)
    
    if (!result.success) {
      console.error(`[Migration ${i + 1}] Failed:`, result.error)
      results.push({
        step: i + 1,
        name: statement.name,
        success: false,
        error: result.error
      })
      break
    }
    
    results.push({
      step: i + 1,
      name: statement.name,
      success: true
    })
    
    console.log(`[Migration ${i + 1}] ✓ Success`)
  }
  
  const failedStep = results.find(r => !r.success)
  
  return {
    success: !failedStep,
    message: failedStep 
      ? `迁移失败于步骤 ${failedStep.step}: ${failedStep.name}`
      : '数据库迁移成功完成',
    step: results.length,
    total: MIGRATION_STATEMENTS.length,
    failed: !!failedStep,
    details: failedStep?.error
  }
}

export async function checkMigrationStatus(): Promise<{
  exists: boolean
  tables: string[]
  message: string
}> {
  try {
    const { data, error } = await supabase
      .from('projection_lenses')
      .select('count')
      .limit(1)
    
    if (error) {
      return {
        exists: false,
        tables: [],
        message: '通爻协议表不存在'
      }
    }
    
    return {
      exists: true,
      tables: ['negotiation_sessions', 'agent_offers', 'projection_lenses', 'agent_projections', 'sub_requirements'],
      message: '通爻协议表已存在'
    }
  } catch (error: any) {
    return {
      exists: false,
      tables: [],
      message: error.message
    }
  }
}

export async function testSupabaseConnection(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      return {
        success: false,
        message: `数据库连接失败: ${error.message}`
      }
    }
    
    return {
      success: true,
      message: '数据库连接正常'
    }
  } catch (error: any) {
    return {
      success: false,
      message: `数据库连接异常: ${error.message}`
    }
  }
}
