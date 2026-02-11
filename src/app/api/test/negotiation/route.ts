import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    console.log('[Test] Starting negotiation flow test...')

    const testCases = [
      {
        name: 'Web Development Request',
        demand: '我需要开发一个电商网站，包含商品展示、购物车、支付功能',
        userId: 'test-user-001'
      },
      {
        name: 'UI/UX Design Request',
        demand: '帮我设计一个移动端APP的用户界面，需要现代简约风格',
        userId: 'test-user-002'
      },
      {
        name: 'Data Analysis Request',
        demand: '分析销售数据，提供可视化报表和趋势预测',
        userId: 'test-user-003'
      }
    ]

    const results = []

    for (const testCase of testCases) {
      console.log(`[Test] Running: ${testCase.name}`)

      try {
        const response = await fetch(`${baseUrl}/api/negotiation/flow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testCase.userId,
            originalDemand: testCase.demand,
            context: {}
          })
        })

        const data = await response.json()

        if (data.success) {
          results.push({
            name: testCase.name,
            status: 'success',
            negotiationId: data.negotiationId,
            hasFormulation: !!data.formulation,
            formulationConfidence: data.formulation?.confidence,
            activatedAgentsCount: data.activatedAgents?.length || 0,
            offersCount: data.offers?.length || 0,
            topAgent: data.activatedAgents?.[0]?.agentName,
            topScore: data.activatedAgents?.[0]?.score
          })
        } else {
          results.push({
            name: testCase.name,
            status: 'failed',
            error: data.error
          })
        }
      } catch (error: any) {
        results.push({
          name: testCase.name,
          status: 'error',
          error: error.message
        })
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      error: results.filter(r => r.status === 'error').length
    }

    console.log('[Test] Summary:', summary)

    return NextResponse.json({
      success: true,
      summary,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[Test] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
