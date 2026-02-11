import { NextRequest, NextResponse } from 'next/server'
import { protocolAPI } from '@/lib/protocol/protocol-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params
    const result = await protocolAPI.getScene(sceneId)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('[Protocol API] Error getting scene:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
