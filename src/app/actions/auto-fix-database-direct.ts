'use server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function executeSQLViaRestAPI(sql: string): Promise<{ success: boolean; error?: string; data?: any }> {
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
    
    if (!response.ok || (data && typeof data === 'object' && data.success === false)) {
      const errorMsg = typeof data === 'string' ? data : (data?.message || response.statusText)
      return {
        success: false,
        error: errorMsg
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

export async function autoFixDatabaseDirect(): Promise<{ success: boolean; message: string; details: any[] }> {
  const details: any[] = []
  let allSuccess = true

  try {
    details.push({ step: '开始自动修复数据库...', success: true })

    const testResult = await executeSQLViaRestAPI('SELECT 1 as test;')
    
    if (!testResult.success) {
      allSuccess = false
      details.push({ 
        step: 'exec_sql函数不可用', 
        success: false, 
        error: testResult.error 
      })
      return { 
        success: false, 
        message: 'exec_sql函数不可用。请先在Supabase SQL Editor中执行完整SQL脚本。', 
        details 
      }
    }

    details.push({ step: '数据库连接正常，exec_sql函数可用', success: true })

    const extCheckResult = await executeSQLViaRestAPI(`
      SELECT extname FROM pg_extension WHERE extname = 'vector';
    `)

    const hasVector = extCheckResult.success && 
                     extCheckResult.data && 
                     Array.isArray(extCheckResult.data) && 
                     extCheckResult.data.some((e: any) => e.extname === 'vector')
    
    if (!hasVector) {
      details.push({ step: '创建pgvector扩展...', success: true })
      const createExtResult = await executeSQLViaRestAPI('CREATE EXTENSION IF NOT EXISTS "vector";')
      
      if (!createExtResult.success) {
        allSuccess = false
        details.push({ step: '创建pgvector扩展失败', success: false, error: createExtResult.error })
      } else {
        details.push({ step: 'pgvector扩展创建成功', success: true })
      }
    } else {
      details.push({ step: 'pgvector扩展已存在', success: true })
    }

    const funcCheckResult = await executeSQLViaRestAPI(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'exec_sql';
    `)

    const hasExecSql = funcCheckResult.success && 
                      funcCheckResult.data && 
                      Array.isArray(funcCheckResult.data) && 
                      funcCheckResult.data.length > 0
    
    if (!hasExecSql) {
      details.push({ step: '创建exec_sql函数...', success: true })
      const createFuncResult = await executeSQLViaRestAPI(`
        CREATE OR REPLACE FUNCTION exec_sql(sql_param TEXT)
        RETURNS JSON
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            result JSON;
        BEGIN
            EXECUTE sql_param;
            result := json_build_object('success', true, 'message', 'SQL执行成功');
            RETURN result;
        EXCEPTION
            WHEN OTHERS THEN
                result := json_build_object('success', false, 'message', SQLERRM);
                RETURN result;
        END;
        $$;
        
        GRANT EXECUTE ON FUNCTION exec_sql TO postgres;
        GRANT EXECUTE ON FUNCTION exec_sql TO anon;
        GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
        GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
      `)
      
      if (!createFuncResult.success) {
        allSuccess = false
        details.push({ step: '创建exec_sql函数失败', success: false, error: createFuncResult.error })
      } else {
        details.push({ step: 'exec_sql函数创建成功', success: true })
      }
    }

    const triggerFuncCheckResult = await executeSQLViaRestAPI(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'update_updated_at_column';
    `)

    const hasTriggerFunc = triggerFuncCheckResult.success && 
                          triggerFuncCheckResult.data && 
                          Array.isArray(triggerFuncCheckResult.data) && 
                          triggerFuncCheckResult.data.length > 0
    
    if (!hasTriggerFunc) {
      details.push({ step: '创建update_updated_at_column函数...', success: true })
      const createTriggerFuncResult = await executeSQLViaRestAPI(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `)
      
      if (!createTriggerFuncResult.success) {
        allSuccess = false
        details.push({ step: '创建update_updated_at_column函数失败', success: false, error: createTriggerFuncResult.error })
      } else {
        details.push({ step: 'update_updated_at_column函数创建成功', success: true })
        
        const triggerResult = await executeSQLViaRestAPI(`
          DROP TRIGGER IF EXISTS update_negotiation_sessions_updated_at ON negotiation_sessions;
          CREATE TRIGGER update_negotiation_sessions_updated_at
            BEFORE UPDATE ON negotiation_sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `)
        
        if (!triggerResult.success) {
          details.push({ step: '创建触发器失败（不影响核心功能）', success: false, error: triggerResult.error })
        } else {
          details.push({ step: '触发器创建成功', success: true })
        }
      }
    }

    const cleanupFuncCheckResult = await executeSQLViaRestAPI(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'cleanup_expired_projections';
    `)

    const hasCleanupFunc = cleanupFuncCheckResult.success && 
                          cleanupFuncCheckResult.data && 
                          Array.isArray(cleanupFuncCheckResult.data) && 
                          cleanupFuncCheckResult.data.length > 0
    
    if (!hasCleanupFunc) {
      details.push({ step: '创建cleanup_expired_projections函数...', success: true })
      const createCleanupFuncResult = await executeSQLViaRestAPI(`
        CREATE OR REPLACE FUNCTION cleanup_expired_projections()
        RETURNS void AS $$
        BEGIN
          DELETE FROM agent_projections WHERE expires_at < NOW();
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      if (!createCleanupFuncResult.success) {
        allSuccess = false
        details.push({ step: '创建cleanup_expired_projections函数失败', success: false, error: createCleanupFuncResult.error })
      } else {
        details.push({ step: 'cleanup_expired_projections函数创建成功', success: true })
      }
    }

    details.push({ step: '自动修复完成', success: true })

    return {
      success: allSuccess,
      message: allSuccess ? '数据库自动修复成功' : '部分修复失败，请查看详细日志',
      details
    }

  } catch (error: any) {
    details.push({ step: '自动修复异常', success: false, error: error.message })
    return {
      success: false,
      message: '自动修复失败',
      details
    }
  }
}
