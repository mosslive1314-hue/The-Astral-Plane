import { NextResponse } from 'next/server'
import { agentPool } from '@/lib/agent-pool'
import { hdEncoder } from '@/lib/hdc/encoder'

export async function POST(req: Request) {
  try {
    const { demand, threshold = 0.5, limit = 5 } = await req.json()

    if (!demand) {
      return NextResponse.json(
        { error: 'Missing demand parameter' },
        { status: 400 }
      )
    }

    await agentPool.initialize()

    const demandVector = await hdEncoder.textToHyperVector(
      await hdEncoder.encodeText(demand)
    )

    const matches = await agentPool.findResonantAgents(
      demandVector,
      threshold,
      limit
    )

    return NextResponse.json({
      success: true,
      matches: matches.map(m => ({
        agent: {
          id: m.agent.id,
          name: m.agent.name,
          description: m.agent.description,
          capabilities: m.agent.capabilities,
          expertise: m.agent.expertise,
          experience: m.agent.experience,
          rating: m.agent.rating,
          completedTasks: m.agent.completedTasks
        },
        score: m.score
      })),
      total: matches.length
    })
  } catch (error: any) {
    console.error('Match agents error:', error)
    return NextResponse.json(
      { error: 'Failed to match agents', details: error.message },
      { status: 500 }
    )
  }
}
