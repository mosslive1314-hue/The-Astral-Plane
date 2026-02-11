import { NextResponse } from 'next/server'
import { agentPool } from '@/lib/agent-pool'
import { hdEncoder } from '@/lib/hdc/encoder'

export async function GET() {
  try {
    console.log('[Debug] Starting...')

    await agentPool.initialize()
    const agents = agentPool.getAllAgents()
    console.log(`[Debug] Total agents: ${agents.length}`)

    const testText = '我需要开发一个电商网站'
    console.log(`[Debug] Test text: ${testText}`)

    const embedding = await hdEncoder.encodeText(testText)
    console.log(`[Debug] Embedding dimension: ${embedding.length}`)

    const vector = await hdEncoder.textToHyperVector(embedding)
    console.log(`[Debug] Hyper-vector dimension: ${vector.dimension}`)
    console.log(`[Debug] Hyper-vector sample: ${vector.data.slice(0, 10)}`)

    let matchCount = 0
    for (const agent of agents) {
      if (agent.vector) {
        const sample = agent.vector.data.slice(0, 10)
        console.log(`[Debug] Agent ${agent.id} vector sample: ${sample}`)

        let matches = 0
        const len = Math.min(vector.data.length, agent.vector.data.length)
        for (let i = 0; i < len; i++) {
          if (vector.data[i] === agent.vector.data[i]) {
            matches++
          }
        }
        const score = matches / len
        console.log(`[Debug] Agent ${agent.id} score: ${score.toFixed(4)}`)

        if (score >= 0.1) {
          matchCount++
        }
      }
    }

    console.log(`[Debug] Matched agents (threshold 0.1): ${matchCount}`)

    return NextResponse.json({
      success: true,
      testText,
      embeddingDimension: embedding.length,
      vectorDimension: vector.dimension,
      totalAgents: agents.length,
      matchedAgents: matchCount
    })
  } catch (error: any) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
