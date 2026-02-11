import { NextRequest, NextResponse } from 'next/server'
import { gapIdentifier } from '@/lib/negotiation/gap-identifier'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const body = await request.json()

    switch (action) {
      case 'analyze':
        const { demand, offers, userPreferences } = body

        if (!demand || !offers) {
          return NextResponse.json({ error: 'Missing demand or offers' }, { status: 400 })
        }

        const analysis = await gapIdentifier.analyzeGaps(demand, offers, userPreferences)

        return NextResponse.json({
          success: true,
          analysis
        })

      case 'create_sub_demands':
        const { gaps, parentSessionId, parentDemandId, parentDemandText } = body

        if (!gaps || !parentSessionId) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const subDemands = await gapIdentifier.createSubDemands(
          gaps,
          parentSessionId,
          parentDemandId,
          parentDemandText
        )

        return NextResponse.json({
          success: true,
          subDemands,
          count: subDemands.length
        })

      case 'progressive_delivery':
        const { mainPlan } = body

        if (!mainPlan) {
          return NextResponse.json({ error: 'Missing main plan' }, { status: 400 })
        }

        const result = await gapIdentifier.progressiveDelivery(
          mainPlan,
          body.gaps,
          body.parentSessionId,
          body.parentDemandId,
          body.parentDemandText
        )

        return NextResponse.json({
          success: true,
          result
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Gaps API] Error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
