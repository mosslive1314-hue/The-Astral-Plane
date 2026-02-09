export interface FuturesContract {
  id: string
  skill_id: string
  skill_name: string
  contract_type: 'long' | 'short'
  strike_price: number
  current_price: number
  quantity: number
  leverage: number
  margin: number
  expiry_date: number
  status: 'active' | 'settled' | 'liquidated'
  buyer_id?: string
  created_at: number
}

export interface FuturesOrder {
  id: string
  skill_id: string
  skill_name: string
  type: 'long' | 'short'
  price: number
  quantity: number
  leverage: number
  expiry_date: number
  status: 'open' | 'filled' | 'cancelled'
}

export const mockFuturesContracts: FuturesContract[] = [
  {
    id: '1',
    skill_id: '1',
    skill_name: 'Python 编程大师',
    contract_type: 'long',
    strike_price: 5000,
    current_price: 5200,
    quantity: 10,
    leverage: 2,
    margin: 25000,
    expiry_date: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天后
    status: 'active',
    buyer_id: 'current_agent',
    created_at: Date.now(),
  },
  {
    id: '2',
    skill_id: '2',
    skill_name: 'UI 设计灵感',
    contract_type: 'short',
    strike_price: 2700,
    current_price: 2650,
    quantity: 5,
    leverage: 3,
    margin: 4500,
    expiry_date: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3天后
    status: 'active',
    buyer_id: 'current_agent',
    created_at: Date.now(),
  },
]

export const mockFuturesOrders: FuturesOrder[] = [
  {
    id: '1',
    skill_id: '3',
    skill_name: '技术写作',
    type: 'long',
    price: 1200,
    quantity: 20,
    leverage: 2,
    expiry_date: Date.now() + 14 * 24 * 60 * 60 * 1000,
    status: 'open',
  },
  {
    id: '2',
    skill_id: '4',
    skill_name: '数据分析技能',
    type: 'short',
    price: 3300,
    quantity: 5,
    leverage: 5,
    expiry_date: Date.now() + 7 * 24 * 60 * 60 * 1000,
    status: 'open',
  },
]

// 计算合约盈亏
export function calculatePnL(contract: FuturesContract): number {
  const priceDiff = contract.contract_type === 'long'
    ? contract.current_price - contract.strike_price
    : contract.strike_price - contract.current_price

  return priceDiff * contract.quantity * contract.leverage
}

// 计算合约价值
export function calculateContractValue(contract: FuturesContract): number {
  return contract.current_price * contract.quantity
}

// 计算未实现盈亏百分比
export function calculatePnLPercent(contract: FuturesContract): number {
  const pnl = calculatePnL(contract)
  return (pnl / contract.margin) * 100
}

// 检查是否需要清算
export function checkLiquidation(contract: FuturesContract): boolean {
  const pnl = calculatePnL(contract)
  // 如果亏损超过保证金的 80%，触发清算
  return pnl < -contract.margin * 0.8
}
