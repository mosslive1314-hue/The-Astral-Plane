import { NextRequest, NextResponse } from 'next/server'

const EMBEDDING_MODEL = 'all-MiniLM-L6-v2'

export async function POST(request: NextRequest) {
  try {
    const { text, model = EMBEDDING_MODEL } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 })
    }

    const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/' + model + '/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('HuggingFace API error:', errorText)
      return NextResponse.json({ error: 'Embedding generation failed' }, { status: 500 })
    }

    const data = await response.json()

    let embedding: number[]
    if (Array.isArray(data)) {
      embedding = data[0]
    } else if (data.embeddings) {
      embedding = data.embeddings
    } else {
      throw new Error('Unexpected response format from HuggingFace API')
    }

    return NextResponse.json({
      success: true,
      embedding,
      model,
      dimension: embedding.length
    })
  } catch (error) {
    console.error('Embedding generation failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
