import { NextResponse } from 'next/server'

interface Session {
  id: string
  userId: string
  originalDemand: string
  status: 'formulating' | 'resonating' | 'collecting_offers' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  formulation?: any
  activatedAgents?: any[]
  offers?: any[]
}

const sessions = new Map<string, Session>()

export async function POST(req: Request) {
  try {
    const { userId, originalDemand, sceneId } = await req.json()

    if (!userId || !originalDemand) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const session: Session = {
      id: sessionId,
      userId,
      originalDemand,
      status: 'formulating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    sessions.set(sessionId, session)

    return NextResponse.json({
      success: true,
      session
    })
  } catch (error: any) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

    if (sessionId) {
      const session = sessions.get(sessionId)
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, session })
    }

    if (userId) {
      const userSessions = Array.from(sessions.values())
        .filter(s => s.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return NextResponse.json({
        success: true,
        sessions: userSessions,
        total: userSessions.length
      })
    }

    return NextResponse.json({
      success: true,
      sessions: Array.from(sessions.values()),
      total: sessions.size
    })
  } catch (error: any) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions', details: error.message },
      { status: 500 }
    )
  }
}
