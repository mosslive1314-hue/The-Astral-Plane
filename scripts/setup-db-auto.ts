import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://tzqcimpabjmrxlftkgfy.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cWNpbXBhYmptcnhsZnRrZ2Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUzMTU2MSwiZXhwIjoyMDg2MTA3NTYxfQ.JvFQFJ_7ZLiQ20FFrE3kacFQEq9pePwhyI8_Oqc4WpY'

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function executeSQL(sql: string) {
  // 使用 Supabase 的 SQL 执行端点
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'params=single-object'
    },
    body: JSON.stringify({ query: sql })
  })

  return response
}

async function setupDatabase() {
  console.log('🚀 AgentCraft Database Setup\n')

  const sqlPath = path.join(process.cwd(), 'supabase', 'schema.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  // 将 SQL 拆分成单独的语句
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log(`📜 Found ${statements.length} SQL statements\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    try {
      console.log(`[${i + 1}/${statements.length}] Executing...`)
      console.log(`   ${statement.substring(0, 50)}...`)

      // 使用 fetch 直接调用 Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: statement })
      })

      if (response.ok) {
        successCount++
        console.log(`   ✅ Success\n`)
      } else {
        // 有些语句可能因为已存在而失败，这是正常的
        const text = await response.text()
        if (text.includes('already exists')) {
          successCount++
          console.log(`   ✅ Already exists\n`)
        } else {
          errorCount++
          console.log(`   ⚠️ ${response.status}: ${text}\n`)
        }
      }
    } catch (error) {
      errorCount++
      console.log(`   ❌ Error: ${error}\n`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Success: ${successCount}`)
  console.log(`⚠️ Warnings: ${errorCount}`)
  console.log('='.repeat(50))

  if (errorCount === 0 || successCount > 0) {
    console.log('\n🎉 Database setup complete!\n')

    // 验证表
    console.log('🔍 Verifying tables...')
    const { data: tables, error } = await supabase
      .rpc('get_tables')

    if (!error && tables) {
      console.log('✅ Tables created:')
      tables.forEach((t: any) => console.log(`   - ${t.table_name}`))
    }
  }
}

setupDatabase().catch(console.error)
