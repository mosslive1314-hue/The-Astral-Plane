import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Get chat session error:', error)
      return NextResponse.json(null, { status: 200 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Get chat session exception:', error)
    return NextResponse.json(null, { status: 200 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { messages } = await req.json()

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update({
        messages: messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update chat session error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Update chat session exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete chat session error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete chat session exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
