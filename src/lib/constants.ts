export const API_CONFIG = {
  BASE_URL: process.env.SECONDME_API_BASE_URL || 'https://app.mindos.com/gate/lab',
  OAUTH_URL: process.env.SECONDME_AUTH_URL || 'https://go.second.me/oauth/',
  CLIENT_ID: process.env.SECONDME_CLIENT_ID || '',
  REDIRECT_URI: process.env.SECONDME_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
} as const

export const RARITY_COLORS = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-amber-500',
} as const

export const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
} as const

export const CATEGORY_LABELS = {
  programming: '编程',
  design: '设计',
  writing: '写作',
  marketing: '营销',
  analysis: '分析',
  communication: '沟通',
} as const

export const CATEGORY_ICONS: Record<string, string> = {
  programming: '',
  design: '',
  writing: '',
  marketing: '',
  analysis: '',
  communication: '',
}
