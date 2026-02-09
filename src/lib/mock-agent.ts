import type { Agent } from '@/types'

export const mockAgent: Agent = {
  id: '1',
  name: 'Nova',
  level: 5,
  coins: 2500,
  creditScore: 850,
  avatar: undefined,
  skills: [
    { id: '1', name: '编程基础', category: 'programming', level: 3, maxLevel: 5 },
    { id: '2', name: '数据分析', category: 'analysis', level: 2, maxLevel: 5 },
    { id: '3', name: '技术写作', category: 'writing', level: 1, maxLevel: 5 },
    { id: '4', name: 'UI 设计', category: 'design', level: 1, maxLevel: 5 },
  ],
  achievements: [
    { id: '1', name: '初出茅庐', description: '完成首次技能购买', icon: '', unlockedAt: new Date() },
    { id: '2', name: '技能收藏家', description: '拥有 5 个技能', icon: '', unlockedAt: new Date() },
    { id: '3', name: '美帝奇探索者', description: '完成首次技能组合', icon: '' },
  ],
}
