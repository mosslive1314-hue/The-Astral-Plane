// 动态定价算法
export interface PricingFactors {
  demand: number // 需求系数 (0-2)
  scarcity: number // 稀缺性系数 (0-2)
  sellerCredit: number // 卖家信用分 (0-1000)
  skillRarity: number // 技能稀有度 (1-4)
  marketVolatility: number // 市场波动率 (0-1)
}

export interface PriceHistory {
  timestamp: number
  price: number
  volume: number
}

// 基础定价函数
export function calculateBasePrice(
  basePrice: number,
  factors: PricingFactors
): number {
  const demandMultiplier = 1 + (factors.demand - 1) * 0.3
  const scarcityMultiplier = 1 + (factors.scarcity - 1) * 0.2
  const creditBonus = (factors.sellerCredit - 500) / 500 * 0.1
  const rarityMultiplier = Math.pow(1.2, factors.skillRarity - 1)

  return basePrice * demandMultiplier * scarcityMultiplier * (1 + creditBonus) * rarityMultiplier
}

// 实时价格更新
export function updatePrice(
  currentPrice: number,
  basePrice: number,
  factors: PricingFactors,
  lastTradePrice?: number,
  timeSinceLastTrade?: number
): number {
  const targetPrice = calculateBasePrice(basePrice, factors)

  // 价格平滑过渡（每次向目标价格移动 10%）
  const smoothingFactor = 0.1

  // 如果有最近交易价格，考虑其影响
  let tradeInfluence = 0
  if (lastTradePrice && timeSinceLastTrade) {
    const tradeRecency = Math.max(0, 1 - timeSinceLastTrade / (24 * 60 * 60 * 1000)) // 24小时衰减
    tradeInfluence = (lastTradePrice - currentPrice) * tradeRecency * 0.3
  }

  // 随机波动
  const volatility = factors.marketVolatility * 0.05 * currentPrice
  const randomFluctuation = (Math.random() - 0.5) * 2 * volatility

  const newPrice =
    currentPrice * (1 - smoothingFactor) +
    targetPrice * smoothingFactor +
    tradeInfluence +
    randomFluctuation

  return Math.max(basePrice * 0.5, Math.round(newPrice))
}

// 计算稀缺性
export function calculateScarcity(
  totalListings: number,
  recentSales: number,
  totalSupply: number
): number {
  const listingRatio = totalListings / Math.max(1, totalSupply)
  const salesVelocity = recentSales / Math.max(1, totalListings)

  // 列表越少，稀缺性越高
  // 销售速度越快，稀缺性越高
  return Math.min(2, Math.max(0.5, 2 - listingRatio + salesVelocity))
}

// 计算需求
export function calculateDemand(
  recentViews: number,
  recentOffers: number,
  priceChange: number
): number {
  const viewInterest = Math.min(1, recentViews / 100)
  const offerPressure = Math.min(1, recentOffers / 10)
  const momentum = Math.max(-0.5, Math.min(0.5, priceChange / 100))

  return Math.min(2, Math.max(0.5, 0.5 + viewInterest + offerPressure + momentum))
}

// 模拟价格波动（用于前端演示）
export function simulatePriceChange(
  currentPrice: number,
  basePrice: number,
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
): number {
  const rarityVolatility = {
    common: 0.02,
    rare: 0.03,
    epic: 0.05,
    legendary: 0.08,
  }

  const volatility = rarityVolatility[rarity]
  const change = (Math.random() - 0.5) * 2 * volatility * currentPrice

  // 价格倾向于回归基准价格
  const meanReversion = (basePrice - currentPrice) * 0.01

  return Math.round(currentPrice + change + meanReversion)
}

// 生成价格历史数据
export function generatePriceHistory(
  basePrice: number,
  currentPrice: number,
  points: number = 20
): PriceHistory[] {
  const history: PriceHistory[] = []
  const now = Date.now()
  const interval = 60000 // 1分钟间隔

  let price = basePrice
  for (let i = 0; i < points; i++) {
    const targetPrice = basePrice + (currentPrice - basePrice) * (i / points)
    const variation = (Math.random() - 0.5) * basePrice * 0.03
    price = targetPrice + variation

    history.push({
      timestamp: now - (points - i) * interval,
      price: Math.round(price),
      volume: Math.floor(Math.random() * 50) + 1,
    })
  }

  return history
}
