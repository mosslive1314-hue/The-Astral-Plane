import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { requirement } = await req.json()

    if (!requirement || requirement.trim().length === 0) {
      return NextResponse.json(
        { error: '需求不能为空' },
        { status: 400 }
      )
    }

    const response = await fetch('http://localhost:8000/api/formulate/requirement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: requirement }),
    })

    if (!response.ok) {
      throw new Error('Python 服务返回错误')
    }

    const data = await response.json()

    const result = {
      intent: '任务',
      category: data.category || '通用',
      priority: data.priority || '中',
      keywords: data.keywords || [],
      suggested_actions: data.suggested_actions || [
        '前往灵墟市场寻找相关技能',
        '发布悬赏任务',
        '联系相关领域专家',
      ],
      estimated_budget: data.estimated_budget,
      estimated_time: data.estimated_time,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Analyze requirement error:', error)

    const mockResult = {
      intent: '任务',
      category: '通用',
      priority: '中',
      keywords: [],
      suggested_actions: [
        '前往灵墟市场寻找相关技能',
        '发布悬赏任务',
        '联系相关领域专家',
      ],
    }

    return NextResponse.json(mockResult)
  }
}
