'use server'

import { supabase } from '@/lib/database'

interface TableCheckResult {
  tableName: string
  exists: boolean
  columns: string[]
  indexes: string[]
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
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql_param: `
          SELECT 
            column_name,
            data_type
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position;
        `
      })

    if (error) {
      return {
        tableName,
        exists: false,
        columns: [],
        indexes: [],
        error: error.message
      }
    }

    const columns = data?.map((col: any) => `${col.column_name} (${col.data_type})`) || []

    return {
      tableName,
      exists: columns.length > 0,
      columns,
      indexes: []
    }
  } catch (error: any) {
    return {
      tableName,
      exists: false,
      columns: [],
      indexes: [],
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
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql_param: `
          SELECT extname 
          FROM pg_extension 
          WHERE extname = 'vector';
        `
      })

    const extensions = data?.map((e: any) => e.extname) || []
    
    return {
      success: extensions.includes('vector'),
      extensions,
      missing: EXPECTED_EXTENSIONS.filter(ext => !extensions.includes(ext))
    }
  } catch (error: any) {
    return {
      success: false,
      extensions: [],
      missing: EXPECTED_EXTENSIONS
    }
  }
}

export async function checkFunctions(): Promise<{ success: boolean; functions: string[]; missing: string[] }> {
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql_param: `
          SELECT routine_name 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name IN (${EXPECTED_FUNCTIONS.map(f => `'${f}'`).join(', ')});
        `
      })

    const functions = data?.map((f: any) => f.routine_name) || []
    
    return {
      success: EXPECTED_FUNCTIONS.every(f => functions.includes(f)),
      functions,
      missing: EXPECTED_FUNCTIONS.filter(fn => !functions.includes(fn))
    }
  } catch (error: any) {
    return {
      success: false,
      functions: [],
      missing: EXPECTED_FUNCTIONS
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
      return { success: false, error: error.message }
    }

    return {
      success: true,
      columns: data || []
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
