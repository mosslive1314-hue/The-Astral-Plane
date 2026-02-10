const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tzqcimpabjmrxlftkgfy.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cWNpbXBhYmptcnhsZnRrZ2Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUzMTU2MSwiZXhwIjoyMDg2MTA3NTYxfQ.JvFQFJ_7ZLiQ20FFrE3kacFQEq9pePwhyI8_Oqc4WpY'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkTable() {
  console.log('正在连接 Supabase 数据库...')
  console.log('数据库地址:', supabaseUrl)

  try {
    // 检查 notes 表是否存在
    console.log('\n=== 检查 notes 表 ===')
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .limit(1)

    if (notesError) {
      console.log('❌ notes 表不存在或无法访问')
      console.log('错误详情:', JSON.stringify(notesError, null, 2))
    } else {
      console.log('✅ notes 表存在')
      console.log('记录数:', notes?.length || 0)
      if (notes && notes.length > 0) {
        console.log('最新一条记录:', JSON.stringify(notes[0], null, 2))
      }
    }

    // 检查所有表
    console.log('\n=== 检查所有表 ===')
    const tables = ['users', 'agents', 'skills', 'market_skills', 'agent_skills', 
                   'price_history', 'medici_combinations', 'transactions', 
                   'achievements', 'agent_achievements', 'tasks']

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${table}: 不存在`)
      } else {
        console.log(`✅ ${table}: 存在 (记录数: ${data?.length || 0})`)
      }
    }

    // 查询 notes 表的历史记录（如果存在）
    console.log('\n=== 检查 notes 表历史记录 ===')
    const { data: allNotes, error: historyError } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.log('无法查询 notes 历史记录')
    } else if (allNotes && allNotes.length > 0) {
      console.log(`找到 ${allNotes.length} 条 notes 记录`)
      console.log('前 5 条最新记录:')
      allNotes.slice(0, 5).forEach((note, i) => {
        console.log(`\n${i + 1}. ${note.title}`)
        console.log(`   创建时间: ${note.created_at}`)
        console.log(`   标签: ${note.tags || []}`)
        console.log(`   内容长度: ${note.content?.length || 0} 字符`)
      })
    } else {
      console.log('notes 表为空或不存在')
    }

  } catch (error) {
    console.error('检查失败:', error)
  }
}

checkTable()
