import { NextResponse } from 'next/server'
import { DemandFormulationSkill } from '@/lib/skills/demand-formulation-skill'

export async function GET() {
  try {
    const skill = new DemandFormulationSkill()
    const result = await skill.execute(
      { userId: 'test', sessionId: 'test-session', roundNumber: 1, timestamp: new Date().toISOString() },
      { originalIntent: 'Help me build a website', userProfile: {}, context: {} }
    )

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
