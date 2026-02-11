import { NextResponse } from 'next/server'
import { agentPool } from '@/lib/agent-pool'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const available = searchParams.get('available') === 'true'

    await agentPool.initialize()

    const agents = available ? agentPool.getAvailableAgents() : agentPool.getAllAgents()

    return NextResponse.json({
      success: true,
      agents,
      total: agents.length
    })
  } catch (error: any) {
    console.error('List agents error:', error)
    return NextResponse.json(
      { error: 'Failed to list agents', details: error.message },
      { status: 500 }
    )
  }
}
