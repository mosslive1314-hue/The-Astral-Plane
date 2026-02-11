import { NextRequest, NextResponse } from 'next/server'
import { protocolAPI } from '@/lib/protocol/protocol-api'

export async function POST(request: NextRequest) {
  try {
    const { name, description, config, ownerId } = await request.json()

    if (!name || !ownerId || !config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await protocolAPI.createScene({ name, description, config, ownerId })

    if (result.success) {
      return NextResponse.json({
        success: true,
        sceneId: result.sceneId
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Protocol API] Error creating scene:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || undefined

    const result = await protocolAPI.getScenes(userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Protocol API] Error getting scenes:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
