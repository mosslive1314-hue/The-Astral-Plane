import { NextRequest, NextResponse } from 'next/server'
import { protocolAPI } from '@/lib/protocol/protocol-api'
import { SecondMeDataSource } from '@/lib/hdc/profile-datasource'
import { agentPool } from '@/lib/agent-pool'

export async function POST(request: NextRequest) {
  try {
    const { sceneId, agentId, userId, token } = await request.json()

    if (!sceneId || !agentId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await agentPool.initialize()
    const agent = agentPool.getAgent(agentId)

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found in pool' },
        { status: 404 }
      )
    }

    const dataSource = new SecondMeDataSource(token)

    const result = await protocolAPI.registerAgent({
      sceneId,
      agentId,
      userId,
      profileDataSource: dataSource
    })

    if (result.success) {
      return NextResponse.json({ success: true, agent })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Protocol API] Error registering agent:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
