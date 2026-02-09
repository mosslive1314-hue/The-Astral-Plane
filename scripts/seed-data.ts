import { Client } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:1qegAHL2NsKHLJNJ@db.tzqcimpabjmrxlftkgfy.supabase.co:5432/postgres'

const mockSkills = [
  {
    name: 'Python 编程大师',
    category: 'programming',
    description: '精通 Python 语言，擅长数据处理、自动化脚本和后端开发',
    rarity: 'legendary',
    basePrice: 5000,
    currentPrice: 5200,
    isRental: false,
  },
  {
    name: 'UI 设计灵感',
    category: 'design',
    description: '创造美观且用户友好的界面设计，注重用户体验',
    rarity: 'epic',
    basePrice: 2500,
    currentPrice: 2650,
    isRental: false,
  },
  {
    name: '技术写作',
    category: 'writing',
    description: '将复杂的技术概念转化为易于理解的文章和文档',
    rarity: 'rare',
    basePrice: 1200,
    currentPrice: 1180,
    isRental: false,
  },
  {
    name: '数据分析技能',
    category: 'analysis',
    description: '深度分析数据，发现趋势和洞察',
    rarity: 'epic',
    basePrice: 3000,
    currentPrice: 3200,
    isRental: false,
  },
  {
    name: 'React 开发',
    category: 'programming',
    description: '构建现代化的 Web 应用，精通 React 生态系统',
    rarity: 'rare',
    basePrice: 2000,
    currentPrice: 2100,
    isRental: false,
  },
  {
    name: '社交媒体营销',
    category: 'marketing',
    description: '策划和执行有效的社交媒体营销活动',
    rarity: 'rare',
    basePrice: 1500,
    currentPrice: 1450,
    isRental: false,
  },
  {
    name: 'Python 编程大师 (租赁)',
    category: 'programming',
    description: '精通 Python 语言，擅长数据处理、自动化脚本和后端开发',
    rarity: 'legendary',
    basePrice: 200,
    currentPrice: 220,
    isRental: true,
    rentalDuration: 24,
  },
  {
    name: '团队沟通协调',
    category: 'communication',
    description: '优秀的团队协作和沟通能力，促进项目顺利进行',
    rarity: 'common',
    basePrice: 500,
    currentPrice: 480,
    isRental: false,
  },
]

async function seedDatabase() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔌 连接数据库...')
    await client.connect()
    console.log('✅ 连接成功!\n')

    // 1. 创建卖家用户和Agent
    console.log('👤 创建卖家 Agent...')
    const sellerId = 'seed-seller-001'
    
    // 检查用户是否存在
    let userId
    const userRes = await client.query('SELECT id FROM users WHERE secondme_id = $1', [sellerId])
    
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id
      console.log('   - 卖家用户已存在')
    } else {
      const newUser = await client.query(`
        INSERT INTO users (secondme_id, nickname, avatar)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [sellerId, 'System Seller', 'https://api.dicebear.com/7.x/bottts/svg?seed=system'])
      userId = newUser.rows[0].id
      console.log('   - 创建新卖家用户')
    }

    // 检查 Agent 是否存在
    let agentId
    const agentRes = await client.query('SELECT id FROM agents WHERE user_id = $1', [userId])
    
    if (agentRes.rows.length > 0) {
      agentId = agentRes.rows[0].id
      console.log('   - 卖家 Agent 已存在')
    } else {
      const newAgent = await client.query(`
        INSERT INTO agents (user_id, name, level, coins, credit_score)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [userId, 'System Marketplace', 99, 999999, 999])
      agentId = newAgent.rows[0].id
      console.log('   - 创建新卖家 Agent')
    }

    // 2. 插入技能和市场条目
    console.log('\n📦 插入技能和市场条目...')
    
    for (const skill of mockSkills) {
      // 插入技能
      const skillRes = await client.query(`
        INSERT INTO skills (name, category, description, rarity, base_price)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [skill.name, skill.category, skill.description, skill.rarity, skill.basePrice])
      
      const skillId = skillRes.rows[0].id
      console.log(`   - 创建技能: ${skill.name}`)

      // 上架到市场
      await client.query(`
        INSERT INTO market_skills (skill_id, seller_id, current_price, is_rental, rental_duration, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
      `, [
        skillId, 
        agentId, 
        skill.currentPrice, 
        skill.isRental, 
        skill.isRental ? (skill.rentalDuration || 24) : null
      ])
      console.log(`     -> 已上架`)
    }

    console.log('\n🎉 种子数据填充完成!')

  } catch (error: any) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seedDatabase()
