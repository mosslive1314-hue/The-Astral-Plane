import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('http://localhost:3000/api/llm/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [{ role: 'user', content: 'Test message' }],
        temperature: 0.7,
        max_tokens: 100
      })
    })

    const text = await response.text()
    const data = JSON.parse(text)

    return NextResponse.json({
      success: true,
      response: data
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
