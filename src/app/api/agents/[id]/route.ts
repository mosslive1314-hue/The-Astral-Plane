import { NextResponse } from 'next/server'
import { agentPool } from '@/lib/agent-pool'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await agentPool.initialize()

    const { id } = await params
    const agent = agentPool.getAgent(id)

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      agent
    })
  } catch (error: any) {
    console.error('Get agent error:', error)
    return NextResponse.json(
      { error: 'Failed to get agent', details: error.message },
      { status: 500 }
    )
  }
}
