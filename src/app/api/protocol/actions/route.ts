import { NextRequest, NextResponse } from 'next/server'
import { protocolAPI } from '@/lib/protocol/protocol-api'

export async function POST(request: NextRequest) {
  try {
    const { type, negotiationId, content, modifications } = await request.json()

    if (!type || !negotiationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await protocolAPI.userAction({
      type,
      negotiationId,
      timestamp: new Date().toISOString(),
      content,
      modifications
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Protocol API] Error processing user action:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
