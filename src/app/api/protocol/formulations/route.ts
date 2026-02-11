import { NextRequest, NextResponse } from 'next/server'
import { protocolAPI } from '@/lib/protocol/protocol-api'

export async function POST(request: NextRequest) {
  try {
    const { demandId, confirmedText } = await request.json()

    if (!demandId || !confirmedText) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await protocolAPI.confirmFormulation({
      demandId,
      confirmedText
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        negotiationId: result.negotiationId
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Protocol API] Error confirming formulation:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
