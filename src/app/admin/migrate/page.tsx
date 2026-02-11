'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, CheckCircle, AlertCircle, Loader2, Copy, ArrowRight, ExternalLink, Code, Zap, FileText } from 'lucide-react'
import { checkMigrationStatus, testSupabaseConnection, executeDatabaseMigration } from '@/app/actions/migrate-database'
import { verifyDatabaseStructure, checkExtensions, checkFunctions, testExecSqlFunction } from '@/app/actions/verify-database-direct'
import { createMissingComponents } from '@/app/actions/direct-execution'
import { toast } from 'sonner'

const EXPECTED_TABLES = [
  'negotiation_sessions',
  'agent_offers',
  'projection_lenses',
  'agent_projections',
  'sub_requirements'
]

const EXPECTED_FUNCTIONS = [
  'exec_sql'
]

const COMPLETE_SQL = `-- 通爻协议完整迁移脚本
-- 在 Supabase SQL Editor 中一次性执行此脚本

-- 第一步：创建执行SQL的RPC函数（用于未来自动化迁移）
CREATE OR REPLACE FUNCTION exec_sql(sql_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    EXECUTE sql_param;
    
    result := json_build_object(
        'success', true,
        'message', 'SQL执行成功'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', SQLERRM
        );
        RETURN result;
END;
$$;

-- 授权执行权限
GRANT EXECUTE ON FUNCTION exec_sql TO postgres;
GRANT EXECUTE ON FUNCTION exec_sql TO anon;
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;

-- 第二步：启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS "vector";

-- 第三步：创建协商会话表
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

-- 第四步：创建Agent Offer表
CREATE TABLE IF NOT EXISTS agent_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES negotiation_sessions(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  offer_content JSONB NOT NULL,
  confidence DECIMAL(3, 2),
  resonance_score DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 第五步：创建投影透镜配置表
CREATE TABLE IF NOT EXISTS projection_lenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入初始投影透镜
INSERT INTO projection_lenses (name, description, config, is_default) VALUES
  ('基础透镜', '只按技能名称和类别进行简单匹配', '{"weights": {"skill_name": 1.0, "skill_category": 1.0}, "filters": []}', true),
  ('经验透镜', '考虑Agent的等级和信用评分', '{"weights": {"skill_name": 0.8, "skill_category": 0.8, "agent_level": 0.5, "credit_score": 0.3}, "filters": {"min_level": 1}}', false),
  ('响应透镜', '优先考虑响应速度和在线状态', '{"weights": {"skill_name": 0.7, "skill_category": 0.7, "response_time": 0.8, "active": 1.0}, "filters": {"active_only": true}}', false)
ON CONFLICT (name) DO NOTHING;

-- 第六步：创建Agent投影缓存表
CREATE TABLE IF NOT EXISTS agent_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  secondme_data JSONB,
  profile_vector VECTOR(768),
  lens_id UUID REFERENCES projection_lenses(id),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '6 hours'
);

-- 第七步：创建子需求表
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

-- 第八步：扩展agents表
ALTER TABLE agents ADD COLUMN IF NOT EXISTS profile_vector VECTOR(768);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS projection_lens_id UUID REFERENCES projection_lenses(id);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_resonance_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER DEFAULT 30;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS satisfaction_rate DECIMAL(3, 2) DEFAULT 5.0;

-- 第九步：扩展users表，添加OAuth相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondme_synced_at TIMESTAMP WITH TIME ZONE;

-- 第十步：创建向量搜索索引
CREATE INDEX IF NOT EXISTS idx_agents_profile_vector ON agents USING ivfflat (profile_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_vector ON negotiation_sessions USING ivfflat (requirement_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_agent_projections_vector ON agent_projections USING ivfflat (profile_vector vector_cosine_ops);

-- 第十一步：创建性能索引
CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_user ON negotiation_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_offers_session ON agent_offers(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_projections_agent ON agent_projections(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_projections_expires ON agent_projections(expires_at);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active, last_resonance_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_requirements_parent ON sub_requirements(parent_session_id, status);

-- 第十二步：创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_negotiation_sessions_updated_at ON negotiation_sessions;
CREATE TRIGGER update_negotiation_sessions_updated_at
  BEFORE UPDATE ON negotiation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 第十三步：创建过期投影清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_projections()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_projections
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 迁移完成提示
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '通爻协议数据库迁移完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '  - negotiation_sessions (协商会话)';
  RAISE NOTICE '  - agent_offers (Agent方案)';
  RAISE NOTICE '  - projection_lenses (投影透镜)';
  RAISE NOTICE '  - agent_projections (Agent投影缓存)';
  RAISE NOTICE '  - sub_requirements (子需求)';
  RAISE NOTICE '已扩展的表：';
  RAISE NOTICE '  - agents (添加向量索引、投影透镜等)';
  RAISE NOTICE '  - users (添加OAuth令牌字段)';
  RAISE NOTICE '========================================';
END $$;`

export default function DatabaseMigrationPage() {
  const [isChecking, setIsChecking] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isAutoFixing, setIsAutoFixing] = useState(false)
  const [status, setStatus] = useState<{
    exists: boolean
    tables: string[]
    message: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean
    message: string
    step: number
    total: number
    failed: boolean
    details?: string
  } | null>(null)
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean
    tables: any[]
    summary: any
    extensions?: any
    functions?: any
  } | null>(null)
  const [fixDetails, setFixDetails] = useState<any[] | null>(null)

  const checkStatus = async () => {
    setIsChecking(true)
    try {
      const result = await checkMigrationStatus()
      setStatus(result)
    } catch (error: any) {
      toast.error('检查失败', {
        description: error.message || '无法连接数据库'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)
    try {
      const result = await testSupabaseConnection()
      if (result.success) {
        toast.success('数据库连接正常', {
          description: result.message
        })
      } else {
        toast.error('数据库连接失败', {
          description: result.message
        })
      }
    } catch (error: any) {
      toast.error('连接测试失败', {
        description: error.message || '未知错误'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(COMPLETE_SQL)
      setCopied(true)
      toast.success('已复制SQL脚本')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败', {
        description: '请手动复制SQL脚本'
      })
    }
  }

  const runAutoMigration = async () => {
    setIsMigrating(true)
    setMigrationResult(null)
    try {
      const result = await executeDatabaseMigration()
      setMigrationResult(result)
      
      if (result.success) {
        toast.success('数据库迁移成功', {
          description: `已完成 ${result.step}/${result.total} 个步骤`
        })
        await checkStatus()
      } else {
        if (result.details === 'EXEC_SQL_FUNCTION_NOT_FOUND') {
          toast.error('需要先创建exec_sql函数', {
            description: '请先在Supabase SQL Editor中创建exec_sql函数，然后再点击自动迁移'
          })
        } else {
          toast.error('数据库迁移失败', {
            description: result.message
          })
        }
      }
    } catch (error: any) {
      toast.error('迁移失败', {
        description: error.message || '未知错误'
      })
      setMigrationResult({
        success: false,
        message: error.message,
        step: 0,
        total: 13,
        failed: true
      })
    } finally {
      setIsMigrating(false)
    }
  }

  const verifyDatabase = async () => {
    setIsVerifying(true)
    try {
      const execSqlTest = await testExecSqlFunction()
      
      if (!execSqlTest.success) {
        toast.error('exec_sql函数不可用', {
          description: execSqlTest.message
        })
        setVerifyResult({
          success: false,
          tables: [],
          summary: { totalTables: 0, expectedTables: 5, missingTables: EXPECTED_TABLES },
          extensions: { success: false, extensions: [], missing: ['vector'] },
          functions: { success: false, functions: [], missing: EXPECTED_FUNCTIONS }
        })
        return
      }

      const tablesResult = await verifyDatabaseStructure()
      const extensionsResult = await checkExtensions()
      const functionsResult = await checkFunctions()

      setVerifyResult({
        ...tablesResult,
        extensions: extensionsResult,
        functions: functionsResult
      })

      if (tablesResult.success && extensionsResult.success && functionsResult.success) {
        toast.success('数据库验证成功', {
          description: '所有表、扩展和函数都已正确创建'
        })
      } else {
        toast.warning('数据库验证发现问题', {
          description: '请查看详细结果'
        })
      }
    } catch (error: any) {
      toast.error('验证失败', {
        description: error.message || '未知错误'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const autoFix = async () => {
    setIsAutoFixing(true)
    setFixDetails(null)
    try {
      const result = await createMissingComponents()
      setFixDetails(result.details)
      
      if (result.success) {
        toast.success('自动修复成功', {
          description: '所有缺失的组件已自动创建'
        })
        await verifyDatabase()
      } else {
        toast.error('自动修复失败', {
          description: result.message
        })
      }
    } catch (error: any) {
      toast.error('自动修复失败', {
        description: error.message || '未知错误'
      })
    } finally {
      setIsAutoFixing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              通爻协议数据库迁移
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">步骤1：测试数据库连接</h3>
                <p className="text-sm text-zinc-400 mb-3">确保您的Supabase连接正常</p>
                <Button
                  onClick={testConnection}
                  disabled={isTesting}
                  className="w-full sm:w-auto"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      测试连接
                    </>
                  )}
                </Button>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">步骤2：检查当前状态</h3>
                <p className="text-sm text-zinc-400 mb-3">查看通爻协议表是否已存在</p>
                <Button
                  onClick={checkStatus}
                  disabled={isChecking}
                  className="w-full sm:w-auto"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      检查中...
                    </>
                  ) : (
                    '检查数据库状态'
                  )}
                </Button>
              </div>

              {status && (
                <div className={`p-4 rounded-xl border ${
                  status.exists 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-start gap-3">
                    {status.exists ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">
                        {status.exists ? '通爻协议表已存在' : '尚未迁移'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">{status.message}</p>
                      {status.exists && status.tables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {status.tables.map(table => (
                            <Badge key={table} variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                              {table}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="h-px bg-white/10" />

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">步骤3：详细验证数据库结构</h3>
                <p className="text-sm text-zinc-400 mb-3">检查所有表、扩展和函数是否符合通爻协议要求</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={verifyDatabase}
                    disabled={isVerifying}
                    className="w-full sm:w-auto"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        验证中...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        详细验证数据库结构
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={autoFix}
                    disabled={isAutoFixing}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isAutoFixing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        自动修复中...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        一键自动修复
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {verifyResult && (
                <div className={`p-4 rounded-xl border ${
                  verifyResult.success && verifyResult.extensions?.success && verifyResult.functions?.success
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {verifyResult.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">表结构</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {verifyResult.summary.totalTables}/{verifyResult.summary.expectedTables} 个表已创建
                        </p>
                        {verifyResult.summary.missingTables.length > 0 && (
                          <p className="text-xs text-red-300 mt-1">
                            缺少表: {verifyResult.summary.missingTables.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {verifyResult.extensions?.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">pgvector扩展</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {verifyResult.extensions.success ? '已启用' : '未启用'}
                        </p>
                        {verifyResult.extensions.missing.length > 0 && (
                          <p className="text-xs text-red-300 mt-1">
                            缺少扩展: {verifyResult.extensions.missing.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {verifyResult.functions?.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">必需函数</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {verifyResult.functions?.success ? '全部存在' : '部分缺失'}
                        </p>
                        {verifyResult.functions?.missing.length > 0 && (
                          <p className="text-xs text-red-300 mt-1">
                            缺少函数: {verifyResult.functions.missing.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {fixDetails && (
                <div className={`p-4 rounded-xl border ${
                  fixDetails.every(d => d.success)
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <h4 className="text-sm font-semibold text-white mb-3">修复详情</h4>
                  <div className="space-y-2">
                    {fixDetails.map((detail, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {detail.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs text-white">{detail.step}</p>
                          {detail.error && (
                            <p className="text-xs text-red-300 mt-1">{detail.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px bg-white/10" />

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">步骤4：执行迁移</h3>
                <p className="text-sm text-zinc-400 mb-3">
                  选择以下任一方式执行迁移
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <h4 className="text-sm font-semibold text-white">方式一：自动迁移（推荐）</h4>
                    </div>
                    <Button
                      onClick={runAutoMigration}
                      disabled={isMigrating}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isMigrating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          迁移中...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          一键自动迁移
                        </>
                      )}
                    </Button>
                    <div className="mt-3 p-3 bg-purple-900/20 rounded-lg">
                      <p className="text-xs text-purple-200">
                        <strong>注意：</strong>首次使用自动迁移需要先在Supabase SQL Editor中创建exec_sql函数。
                      </p>
                      <a
                        href="/supabase/migrations/001_create_exec_sql_function.sql"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-300 hover:text-purple-200 underline mt-1 inline-block"
                      >
                        点击复制exec_sql函数脚本 →
                      </a>
                    </div>
                  </div>

                  {migrationResult && (
                    <div className={`p-4 rounded-xl border ${
                      migrationResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        {migrationResult.success ? (
                          <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm text-white font-medium">
                            {migrationResult.success ? '迁移完成' : '迁移失败'}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            进度: {migrationResult.step}/{migrationResult.total} 步骤
                          </p>
                          {!migrationResult.success && migrationResult.details && (
                            <p className="text-xs text-red-300 mt-1">
                              错误: {migrationResult.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-white/10" />

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="w-5 h-5 text-zinc-400" />
                      <h4 className="text-sm font-semibold text-white">方式二：手动执行</h4>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={copySQL}
                        disabled={copied}
                        variant="outline"
                        className="w-full"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            已复制到剪贴板
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            复制完整SQL脚本
                          </>
                        )}
                      </Button>

                      <a
                        href="https://supabase.com/dashboard/project/_/sql/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 transition-colors text-white text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        打开Supabase SQL Editor
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">迁移内容</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700">
                    <p className="text-xs text-zinc-400 mb-1">新建表 (5个)</p>
                    <p className="text-sm text-white">negotiation_sessions, agent_offers, projection_lenses, agent_projections, sub_requirements</p>
                  </div>
                  <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700">
                    <p className="text-xs text-zinc-400 mb-1">扩展表 (2个)</p>
                    <p className="text-sm text-white">agents (向量索引), users (OAuth令牌)</p>
                  </div>
                  <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700">
                    <p className="text-xs text-zinc-400 mb-1">索引 (9个)</p>
                    <p className="text-sm text-white">向量搜索索引 + 性能索引</p>
                  </div>
                  <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700">
                    <p className="text-xs text-zinc-400 mb-1">函数 (3个)</p>
                    <p className="text-sm text-white">exec_sql, update_updated_at, cleanup_expired_projections</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
