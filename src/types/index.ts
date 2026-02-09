// Agent 相关类型
export interface Agent {
  id: string
  userId?: string
  name: string
  level: number
  coins: number
  creditScore: number
  avatar?: string
  skills: AgentSkill[]
  achievements: Achievement[]
}

export interface AgentSkill {
  id: string
  name: string
  category: string
  level: number
  maxLevel: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: Date
}

// 技能市场相关类型
export interface MarketSkill {
  id: string
  name: string
  category: SkillCategory
  description: string
  rarity: SkillRarity
  basePrice: number
  currentPrice: number
  priceHistory: PricePoint[]
  seller: string
  sellerLevel: number
  listedAt: Date
  isRental: boolean
  rentalDuration?: number // 租赁时长（小时）
}

export type SkillCategory =
  | 'programming'
  | 'design'
  | 'writing'
  | 'marketing'
  | 'analysis'
  | 'communication'

export type SkillRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface PricePoint {
  timestamp: number
  price: number
}

// 美帝奇效应相关类型
export interface MediciCombination {
  id: string
  skill1: MarketSkill
  skill2: MarketSkill
  newSkill?: GeneratedSkill
  status: 'discovering' | 'found' | 'failed'
  discoveryTime?: number
}

export interface GeneratedSkill {
  id: string
  name: string
  description: string
  category: SkillCategory
  rarity: SkillRarity
  uniqueAttributes: string[]
  estimatedValue: number
}

// OAuth 相关类型
export interface OAuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface UserInfo {
  id: string
  nickname: string
  avatar?: string
  shades?: string[]
}
