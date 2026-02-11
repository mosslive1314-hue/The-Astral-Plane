import { NextRequest, NextResponse } from 'next/server'
import { protocolAPI } from '@/lib/protocol/protocol-api'

export async function POST(request: NextRequest) {
  try {
    const { sceneId, userId, intent, context } = await request.json()

    if (!sceneId || !userId || !intent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await protocolAPI.submitDemand({
      sceneId,
      userId,
      intent,
      context
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        demandId: result.demandId
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Protocol API] Error submitting demand:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
