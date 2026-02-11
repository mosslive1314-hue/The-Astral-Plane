import { NextRequest, NextResponse } from 'next/server'
import { protocolLearningEngine } from '@/lib/protocol/protocol-learning'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') as any
    const sceneId = url.searchParams.get('sceneId') || undefined
    const outcome = url.searchParams.get('outcome') as any || undefined
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined

    if (url.searchParams.get('action') === 'insights') {
      const insights = protocolLearningEngine.generateProtocolInsights()
      return NextResponse.json({ success: true, insights })
    }

    if (url.searchParams.get('action') === 'failures') {
      const analyses = protocolLearningEngine.analyzeSceneFailures(sceneId)
      return NextResponse.json({ success: true, analyses })
    }

    if (url.searchParams.get('action') === 'k_star') {
      const result = sceneId
        ? protocolLearningEngine.getOptimalKStarForScene(sceneId)
        : null
      return NextResponse.json({ success: true, result })
    }

    if (url.searchParams.get('action') === 'formulation') {
      const patterns = protocolLearningEngine.getEffectiveFormulationPatterns()
      return NextResponse.json({ success: true, patterns })
    }

    if (url.searchParams.get('action') === 'tools') {
      const insights = protocolLearningEngine.getCenterToolInsights()
      return NextResponse.json({ success: true, insights })
    }

    const records = protocolLearningEngine.getLearningRecords({
      type,
      sceneId,
      outcome,
      limit
    })

    return NextResponse.json({ success: true, records })
  } catch (error) {
    console.error('[Protocol Learning API] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case 'k_star':
        protocolLearningEngine.recordKStarUsage(data)
        break

      case 'formulation':
        protocolLearningEngine.recordFormulationPattern(data)
        break

      case 'center_tool':
        protocolLearningEngine.recordCenterToolUsage(data)
        break

      case 'scene_failure':
        protocolLearningEngine.recordSceneFailure(data)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Protocol Learning API] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
