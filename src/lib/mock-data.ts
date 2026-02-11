import type { MarketSkill, PricePoint } from '@/types'

// 模拟技能数据
export const mockSkills: MarketSkill[] = [
  {
    id: '1',
    name: 'Python 编程大师',
    category: 'programming',
    description: '精通 Python 语言，擅长数据处理、自动化脚本和后端开发',
    rarity: 'legendary',
    basePrice: 5000,
    currentPrice: 5200,
    price: 5200,
    priceHistory: generatePriceHistory(5000, 5200),
    seller: 'AlphaAgent',
    sellerLevel: 42,
    listedAt: new Date(),
    isRental: false,
  },
  {
    id: '2',
    name: 'UI 设计灵感',
    category: 'design',
    description: '创造美观且用户友好的界面设计，注重用户体验',
    rarity: 'epic',
    basePrice: 2500,
    currentPrice: 2650,
    price: 2650,
    priceHistory: generatePriceHistory(2500, 2650),
    seller: 'CreativeBot',
    sellerLevel: 35,
    listedAt: new Date(),
    isRental: false,
  },
  {
    id: '3',
    name: '技术写作',
    category: 'writing',
    description: '将复杂的技术概念转化为易于理解的文章和文档',
    rarity: 'rare',
    basePrice: 1200,
    currentPrice: 1180,
    price: 1180,
    priceHistory: generatePriceHistory(1200, 1180),
    seller: 'WriterAI',
    sellerLevel: 28,
    listedAt: new Date(),
    isRental: false,
  },
  {
    id: '4',
    name: '数据分析技能',
    category: 'analysis',
    description: '深度分析数据，发现趋势和洞察',
    rarity: 'epic',
    basePrice: 3000,
    currentPrice: 3200,
    price: 3200,
    priceHistory: generatePriceHistory(3000, 3200),
    seller: 'DataNinja',
    sellerLevel: 38,
    listedAt: new Date(),
    isRental: false,
  },
  {
    id: '5',
    name: 'React 开发',
    category: 'programming',
    description: '构建现代化的 Web 应用，精通 React 生态系统',
    rarity: 'rare',
    basePrice: 2000,
    currentPrice: 2100,
    price: 2100,
    priceHistory: generatePriceHistory(2000, 2100),
    seller: 'FrontendMaster',
    sellerLevel: 31,
    listedAt: new Date(),
    isRental: false,
  },
  {
    id: '6',
    name: '社交媒体营销',
    category: 'marketing',
    description: '策划和执行有效的社交媒体营销活动',
    rarity: 'rare',
    basePrice: 1500,
    currentPrice: 1450,
    price: 1450,
    priceHistory: generatePriceHistory(1500, 1450),
    seller: 'MarketingPro',
    sellerLevel: 25,
    listedAt: new Date(),
    isRental: false,
  },
  {
    id: '7',
    name: 'Python 编程大师 (租赁)',
    category: 'programming',
    description: '精通 Python 语言，擅长数据处理、自动化脚本和后端开发',
    rarity: 'legendary',
    basePrice: 200,
    currentPrice: 220,
    price: 220,
    priceHistory: generatePriceHistory(200, 220),
    seller: 'AlphaAgent',
    sellerLevel: 42,
    listedAt: new Date(),
    isRental: true,
    rentalDuration: 24,
  },
  {
    id: '8',
    name: '团队沟通协调',
    category: 'communication',
    description: '优秀的团队协作和沟通能力，促进项目顺利进行',
    rarity: 'common',
    basePrice: 500,
    currentPrice: 480,
    price: 480,
    priceHistory: generatePriceHistory(500, 480),
    seller: 'TeamPlayer',
    sellerLevel: 18,
    listedAt: new Date(),
    isRental: false,
  },
]

function generatePriceHistory(basePrice: number, currentPrice: number): PricePoint[] {
  const history: PricePoint[] = []
  const now = Date.now()
  const points = 10
  const interval = 60000 // 1分钟间隔

  let price = basePrice
  for (let i = 0; i < points; i++) {
    const variation = (Math.random() - 0.5) * basePrice * 0.02
    price = basePrice + (currentPrice - basePrice) * (i / points) + variation
    history.push({
      timestamp: now - (points - i) * interval,
      price: Math.round(price),
    })
  }

  return history
}

// 模拟价格波动
export function simulatePriceFluctuation(skills: MarketSkill[]): MarketSkill[] {
  return skills.map(skill => {
    const fluctuation = (Math.random() - 0.5) * skill.currentPrice * 0.05
    const newPrice = Math.max(skill.basePrice * 0.5, skill.currentPrice + fluctuation)

    return {
      ...skill,
      currentPrice: Math.round(newPrice),
      priceHistory: [
        ...skill.priceHistory.slice(-9),
        {
          timestamp: Date.now(),
          price: Math.round(newPrice),
        },
      ],
    }
  })
}
