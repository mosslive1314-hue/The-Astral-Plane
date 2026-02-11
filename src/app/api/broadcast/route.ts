import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: '消息不能为空' },
        { status: 400 }
      )
    }

    const keywords = message.toLowerCase().split(/\s+/)
    
    const mockAgents = [
      { id: 'agent_1', name: '李明·法务专家', category: '法律', matchScore: 95 },
      { id: 'agent_2', name: '王强·金融分析师', category: '金融', matchScore: 88 },
      { id: 'agent_3', name: '张伟·物流优化师', category: '物流', matchScore: 82 },
    ]

    const mockSkills = [
      { id: 'skill_1', name: '跨境合同审查', category: '法律', matchScore: 92 },
      { id: 'skill_2', name: '量化交易策略生成', category: '金融', matchScore: 85 },
      { id: 'skill_3', name: '物流路径优化算法', category: '物流', matchScore: 78 },
    ]

    const mockSolutions = [
      { id: 'solution_1', name: '发布悬赏任务', matchScore: 80 },
      { id: 'solution_2', name: '购买技能服务', matchScore: 75 },
    ]

    let matchedAgents = 0
    let matchedSkills = 0
    let matchedSolutions = 0

    if (keywords.some((k: string) => k.includes('法律') || k.includes('合同'))) {
      matchedAgents++
      matchedSkills++
    }
    if (keywords.some((k: string) => k.includes('金融') || k.includes('股票') || k.includes('量化'))) {
      matchedAgents++
      matchedSkills++
    }
    if (keywords.some((k: string) => k.includes('物流') || k.includes('优化'))) {
      matchedAgents++
      matchedSkills++
    }

    matchedSolutions = Math.max(1, matchedAgents > 0 ? 1 : 0)

    return NextResponse.json({
      success: true,
      matchedAgents,
      matchedSkills,
      matchedSolutions
    })
  } catch (error: any) {
    console.error('Broadcast error:', error)
    return NextResponse.json(
      { error: '广播失败' },
      { status: 500 }
    )
  }
}
