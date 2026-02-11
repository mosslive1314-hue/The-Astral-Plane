import { NextRequest, NextResponse } from 'next/server'
import { protocolEventBus } from '@/lib/protocol/event-bus'

const activeConnections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const negotiationId = url.searchParams.get('negotiationId') || undefined
  const sceneId = url.searchParams.get('sceneId') || undefined
  const eventTypesParam = url.searchParams.get('eventTypes')
  const eventTypes = eventTypesParam ? eventTypesParam.split(',') : undefined

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      activeConnections.set(connectionId, controller)

      const subscriptionId = protocolEventBus.subscribe(
        (event) => {
          try {
            const data = `data: ${JSON.stringify(event)}\n\n`
            controller.enqueue(encoder.encode(data))
          } catch (error) {
            console.error('[Events API] Error sending event:', error)
          }
        },
        {
          negotiationId,
          sceneId,
          eventTypes
        }
      )

      const initialMessage = {
        type: 'connection.established',
        connectionId,
        timestamp: new Date().toISOString()
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`))

      request.signal.addEventListener('abort', () => {
        protocolEventBus.unsubscribe(subscriptionId)
        activeConnections.delete(connectionId)
        try {
          controller.close()
        } catch (e) {
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { eventType, filters, limit } = await request.json()

    const history = protocolEventBus.getEventHistory({
      eventType,
      negotiationId: filters?.negotiationId,
      limit
    })

    return NextResponse.json({ success: true, events: history })
  } catch (error) {
    console.error('[Events API] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
