'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

interface TableCheckResult {
  tableName: string
  exists: boolean
  columns: string[]
  error?: string
}

interface DatabaseVerificationResult {
  success: boolean
  tables: TableCheckResult[]
  summary: {
    totalTables: number
    expectedTables: number
    missingTables: string[]
  }
}

const EXPECTED_TABLES = [
  'negotiation_sessions',
  'agent_offers',
  'projection_lenses',
  'agent_projections',
  'sub_requirements'
]

const EXPECTED_EXTENSIONS = ['vector']

const EXPECTED_FUNCTIONS = [
  'exec_sql',
  'update_updated_at_column',
  'cleanup_expired_projections'
]

async function checkTableStructure(tableName: string): Promise<TableCheckResult> {
  try {
    console.log(`[DEBUG] Checking table: ${tableName}`)
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_param: `
          SELECT 
            column_name,
            data_type
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = '${tableName.toLowerCase()}'
          ORDER BY ordinal_position;
        `
      })

    console.log(`[DEBUG] Table ${tableName} - data:`, JSON.stringify(data))
    console.log(`[DEBUG] Table ${tableName} - error:`, error)

    if (error) {
      console.error(`Error checking table ${tableName}:`, error)
      return {
        tableName,
        exists: false,
        columns: [],
        error: error.message
      }
    }

    const resultArray = data?.data || data
    const columns = Array.isArray(resultArray) && resultArray.length > 0
      ? resultArray.map((col: any) => `${col.column_name} (${col.data_type})`)
      : []

    console.log(`[DEBUG] Table ${tableName} - exists:`, columns.length > 0, 'columns:', columns)

    return {
      tableName,
      exists: columns.length > 0,
      columns
    }
  } catch (error: any) {
    console.error(`[DEBUG] Exception checking table ${tableName}:`, error)
    return {
      tableName,
      exists: false,
      columns: [],
      error: error.message
    }
  }
}

export async function verifyDatabaseStructure(): Promise<DatabaseVerificationResult> {
  const results: TableCheckResult[] = []

  for (const tableName of EXPECTED_TABLES) {
    const result = await checkTableStructure(tableName)
    results.push(result)
  }

  const existingTables = results.filter(r => r.exists)
  const missingTables = EXPECTED_TABLES.filter(
    table => !results.find(r => r.tableName === table && r.exists)
  )

  return {
    success: missingTables.length === 0,
    tables: results,
    summary: {
      totalTables: existingTables.length,
      expectedTables: EXPECTED_TABLES.length,
      missingTables
    }
  }
}

export async function checkExtensions(): Promise<{ success: boolean; extensions: string[]; missing: string[] }> {
  try {
    console.log('[DEBUG] Checking extensions...')
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_param: `
          SELECT extname 
          FROM pg_extension 
          ORDER BY extname;
        `
      })

    console.log('[DEBUG] Extensions - data:', JSON.stringify(data))
    console.log('[DEBUG] Extensions - error:', error)

    if (error) {
      return {
        success: false,
        extensions: [],
        missing: EXPECTED_EXTENSIONS
      }
    }

    const resultArray = data?.data || data
    const extensions = Array.isArray(resultArray) ? resultArray.map((e: any) => e.extname?.toLowerCase() || '') : []
    
    console.log('[DEBUG] Parsed extensions:', extensions)
    
    return {
      success: EXPECTED_EXTENSIONS.every(ext => extensions.includes(ext.toLowerCase())),
      extensions,
      missing: EXPECTED_EXTENSIONS.filter(ext => !extensions.includes(ext.toLowerCase()))
    }
  } catch (error: any) {
    console.error('[DEBUG] Exception checking extensions:', error)
    return {
      success: false,
      extensions: [],
      missing: EXPECTED_EXTENSIONS
    }
  }
}

export async function checkFunctions(): Promise<{ success: boolean; functions: string[]; missing: string[] }> {
  try {
    console.log('[DEBUG] Checking functions...')
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_param: `
          SELECT routine_name 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          ORDER BY routine_name;
        `
      })

    console.log('[DEBUG] Functions - data:', JSON.stringify(data))
    console.log('[DEBUG] Functions - error:', error)

    if (error) {
      return {
        success: false,
        functions: [],
        missing: EXPECTED_FUNCTIONS
      }
    }

    const resultArray = data?.data || data
    const allFunctions = Array.isArray(resultArray) ? resultArray.map((f: any) => f.routine_name?.toLowerCase() || '') : []
    
    console.log('[DEBUG] Parsed functions:', allFunctions)
    
    return {
      success: EXPECTED_FUNCTIONS.every(f => allFunctions.includes(f.toLowerCase())),
      functions: allFunctions,
      missing: EXPECTED_FUNCTIONS.filter(fn => !allFunctions.includes(fn.toLowerCase()))
    }
  } catch (error: any) {
    console.error('[DEBUG] Exception checking functions:', error)
    return {
      success: false,
      functions: [],
      missing: EXPECTED_FUNCTIONS
    }
  }
}

export async function testExecSqlFunction(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[DEBUG] Testing exec_sql function...')
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_param: 'SELECT 1 as test;'
      })

    console.log('[DEBUG] Test - data:', JSON.stringify(data))
    console.log('[DEBUG] Test - error:', error)

    if (error) {
      return {
        success: false,
        message: `exec_sql函数调用失败: ${error.message}`
      }
    }

    return {
      success: true,
      message: 'exec_sql函数工作正常'
    }
  } catch (error: any) {
    return {
      success: false,
      message: `exec_sql函数异常: ${error.message}`
    }
  }
}

export async function getDetailedTableInfo(tableName: string) {
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_param: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position;
        `
      })

    if (error) {
      return { success: false, error }
    }

    const resultArray = data?.data || data
    return {
      success: true,
      columns: Array.isArray(resultArray) ? resultArray : []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
