import { NextRequest, NextResponse } from 'next/server'
import { SecondMeDataSource, Projector } from '@/lib/hdc/profile-datasource'
import { registerAgentVector } from '@/lib/towow-api'
import { supabaseAdmin } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: 'Missing userId or token' }, { status: 400 })
    }

    const dataSource = new SecondMeDataSource(token)

    if (!dataSource.validateSource()) {
      return NextResponse.json({ error: 'Invalid data source' }, { status: 400 })
    }

    const vector = await Projector.project(dataSource, userId)

    await registerAgentVector(userId, { userId })

    const { data: existingAgent } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!existingAgent) {
      await supabaseAdmin.from('agents').insert({
        user_id: userId,
        name: `Agent ${userId.substring(0, 8)}`,
        level: 1,
        coins: 1000,
        credit_score: 100,
        vector_data: vector.data
      })
    } else {
      await supabaseAdmin.from('agents')
        .update({ vector_data: vector.data })
        .eq('user_id', userId)
    }

    return NextResponse.json({
      success: true,
      agentId: userId,
      vectorDimension: vector.dimension
    })
  } catch (error) {
    console.error('Agent registration failed:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
