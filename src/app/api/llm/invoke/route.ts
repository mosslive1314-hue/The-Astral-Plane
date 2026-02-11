import { NextResponse } from 'next/server'
import { zhipu, GLM_MODEL } from '@/lib/zhipu'

export async function POST(req: Request) {
  try {
    const { model, messages, temperature, max_tokens } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing or invalid messages parameter' },
        { status: 400 }
      )
    }

    const response = await zhipu.chat.completions.create({
      model: model || GLM_MODEL,
      messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2000
    })

    const result = response.choices[0].message

    return NextResponse.json({
      success: true,
      data: result.content,
      usage: response.usage,
      model: response.model
    })
  } catch (error: any) {
    console.error('LLM API Error:', error)
    return NextResponse.json(
      { error: 'LLM invocation failed', details: error.message },
      { status: 500 }
    )
  }
}
