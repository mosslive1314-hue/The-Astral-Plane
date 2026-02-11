import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { agentId, title, agentName, messages } = await req.json()

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        agent_id: agentId,
        title: title || '新对话',
        agent_name: agentName || '专家',
        messages: messages || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Create chat session error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Create chat session exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('agent_id', agentId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Get chat sessions error:', error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Get chat sessions exception:', error)
    return NextResponse.json([], { status: 200 })
  }
}
