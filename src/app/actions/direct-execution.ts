'use server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function executeSQLDirectly(sql: string): Promise<{ success: boolean; error?: string; data?: any }> {
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

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: errorText || response.statusText || `HTTP ${response.status}`
      }
    }

    const data = await response.json()
    
    if (data && typeof data === 'object' && data.success === false) {
      return {
        success: false,
        error: data.message || 'SQL执行失败'
      }
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function createMissingComponents(): Promise<{ success: boolean; message: string; details: any[] }> {
  const details: any[] = []

  const testResult = await executeSQLDirectly('SELECT 1 as test;')
  
  if (!testResult.success) {
    details.push({ step: '数据库连接测试失败', success: false, error: testResult.error })
    return { 
      success: false, 
      message: '无法连接数据库或exec_sql函数不存在。请先在Supabase SQL Editor中执行完整SQL脚本。', 
      details 
    }
  }

  details.push({ step: '数据库连接正常', success: true })

  const extResult = await executeSQLDirectly('CREATE EXTENSION IF NOT EXISTS "vector";')
  if (extResult.success) {
    details.push({ step: 'pgvector扩展创建成功', success: true })
  } else {
    details.push({ step: 'pgvector扩展创建失败', success: false, error: extResult.error })
  }

  const funcResult = await executeSQLDirectly(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `)
  if (funcResult.success) {
    details.push({ step: 'update_updated_at_column函数创建成功', success: true })
  } else {
    details.push({ step: 'update_updated_at_column函数创建失败', success: false, error: funcResult.error })
  }

  const triggerResult = await executeSQLDirectly(`
    DROP TRIGGER IF EXISTS update_negotiation_sessions_updated_at ON negotiation_sessions;
    CREATE TRIGGER update_negotiation_sessions_updated_at
      BEFORE UPDATE ON negotiation_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `)
  if (triggerResult.success) {
    details.push({ step: '触发器创建成功', success: true })
  } else {
    details.push({ step: '触发器创建失败（不影响核心功能）', success: false, error: triggerResult.error })
  }

  const cleanupFuncResult = await executeSQLDirectly(`
    CREATE OR REPLACE FUNCTION cleanup_expired_projections()
    RETURNS void AS $$
    BEGIN
      DELETE FROM agent_projections WHERE expires_at < NOW();
    END;
    $$ LANGUAGE plpgsql;
  `)
  if (cleanupFuncResult.success) {
    details.push({ step: 'cleanup_expired_projections函数创建成功', success: true })
  } else {
    details.push({ step: 'cleanup_expired_projections函数创建失败', success: false, error: cleanupFuncResult.error })
  }

  const successCount = details.filter(d => d.success).length
  const totalCount = details.length

  return {
    success: successCount === totalCount,
    message: successCount === totalCount 
      ? '所有组件修复成功' 
      : `修复完成: ${successCount}/${totalCount} 个组件成功`,
    details
  }
}

export async function checkPgVectorExtension(): Promise<{ success: boolean; exists: boolean; error?: string }> {
  const result = await executeSQLDirectly(`
    SELECT extname FROM pg_extension WHERE extname = 'vector';
  `)

  if (!result.success) {
    return { success: false, exists: false, error: result.error }
  }

  const exists = result.data && Array.isArray(result.data) && result.data.some((e: any) => e.extname && e.extname.toLowerCase() === 'vector')
  return { success: true, exists }
}

export async function checkFunctionExists(functionName: string): Promise<{ success: boolean; exists: boolean; error?: string }> {
  const result = await executeSQLDirectly(`
    SELECT routine_name FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = '${functionName}';
  `)

  if (!result.success) {
    return { success: false, exists: false, error: result.error }
  }

  const exists = result.data && Array.isArray(result.data) && result.data.some((f: any) => f.routine_name && f.routine_name.toLowerCase() === functionName.toLowerCase())
  return { success: true, exists }
}
