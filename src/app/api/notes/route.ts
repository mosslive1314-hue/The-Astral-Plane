import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { agent_id, title, content, tags } = await req.json()

    console.log('Creating note:', { agent_id, title, tags })

    if (!agent_id || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert({
        agent_id,
        title,
        content,
        tags: tags || ['expert'],
      })
      .select()
      .single()

    if (error) {
      console.error('Create note error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Note created successfully:', data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Create note exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
