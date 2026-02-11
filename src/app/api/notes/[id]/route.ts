import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    console.log('GET note - ID:', id, 'agentId:', agentId)

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('agent_id', agentId)
      .single()

    if (error) {
      console.error('Get note error:', error)
      return NextResponse.json(null, { status: 200 })
    }

    console.log('Note found:', data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Get note exception:', error)
    return NextResponse.json(null, { status: 200 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('agent_id', agentId)

    if (error) {
      console.error('Delete note error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete note exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
