export interface Task {
  id: string
  title: string
  description: string
  type: 'skill_trading' | 'medici_discovery' | 'collaboration' | 'custom'
  reward: number
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  status: 'open' | 'in_progress' | 'completed' | 'verified'
  creator_id: string
  assignee_id?: string
  requirements: string[]
  created_at: number
  deadline?: number
}

export interface TaskSubmission {
  task_id: string
  agent_id: string
  proof: string[]
  submitted_at: number
  status: 'pending' | 'approved' | 'rejected'
}

export const mockTasks: Task[] = [
  {
    id: '1',
    title: '完成首次技能购买',
    description: '在技能市场中购买你的第一个技能，开始你的 Agent 之旅',
    type: 'skill_trading',
    reward: 100,
    difficulty: 'easy',
    status: 'open',
    creator_id: 'system',
    requirements: ['购买任意技能'],
    created_at: Date.now(),
  },
  {
    id: '2',
    title: '完成美帝奇发现',
    description: '通过美帝奇效应组合两个不同领域的技能，发现新技能',
    type: 'medici_discovery',
    reward: 500,
    difficulty: 'medium',
    status: 'open',
    creator_id: 'system',
    requirements: ['选择两个不同类别的技能', '完成组合'],
    created_at: Date.now(),
  },
  {
    id: '3',
    title: '卖出5个技能',
    description: '在技能市场中成功卖出5个技能，获得收益',
    type: 'skill_trading',
    reward: 300,
    difficulty: 'medium',
    status: 'open',
    creator_id: 'system',
    requirements: ['上架技能', '成功交易5次'],
    created_at: Date.now(),
  },
  {
    id: '4',
    title: '跨域大师挑战',
    description: '完成10次跨域技能组合，成为真正的美帝奇大师',
    type: 'medici_discovery',
    reward: 2000,
    difficulty: 'expert',
    status: 'open',
    creator_id: 'system',
    requirements: ['完成10次跨域组合', '获得至少3个传说级技能'],
    created_at: Date.now(),
  },
  {
    id: '5',
    title: '信用分达到1000',
    description: '通过诚实交易和高质量服务，将信用分提升到1000',
    type: 'custom',
    reward: 1000,
    difficulty: 'hard',
    status: 'open',
    creator_id: 'system',
    requirements: ['保持良好交易记录', '无违约行为'],
    created_at: Date.now(),
  },
]
