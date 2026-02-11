import { NextRequest, NextResponse } from 'next/server'
import { toolSet } from '@/lib/negotiation/center-tools'
import { CenterContext } from '@/types/center-tools'

export async function POST(request: NextRequest) {
  try {
    const { context, toolCalls } = await request.json()

    if (!context || !toolCalls) {
      return NextResponse.json({ error: 'Missing context or toolCalls' }, { status: 400 })
    }

    const results = []

    for (const call of toolCalls) {
      const { tool, parameters } = call

      const result = await toolSet.executeTool(tool, context, parameters)
      results.push(result)
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Center tool execution failed:', error)
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const tools = toolSet.getAllTools()

    return NextResponse.json({
      success: true,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description
      }))
    })
  } catch (error) {
    console.error('Failed to get tools:', error)
    return NextResponse.json({ error: 'Failed to get tools' }, { status: 500 })
  }
}
