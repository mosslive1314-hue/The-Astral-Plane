"use server"

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export interface MigrateResponse {
  success: boolean
  message: string
  tables_created: string[]
  tables_existed: string[]
  errors: string[]
}

export async function migrateDatabase(): Promise<MigrateResponse> {
  try {
    const response = await fetch('http://localhost:8000/api/db/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Migration failed: ${response.status}`)
    }

    const data: MigrateResponse = await response.json()
    console.log('Database migration result:', data)

    return data
  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      tables_created: [],
      tables_existed: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

export async function getUserBySecondMeId(secondmeId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('secondme_id', secondmeId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserBySecondMeId:', error)
    return null
  }
}

export async function createUserFromSecondMe(
  secondmeId: string,
  nickname: string,
  avatar: string | null,
  shades: string[],
  accessToken: string,
  refreshToken: string
) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        secondme_id: secondmeId,
        nickname,
        avatar,
        shades,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        secondme_synced_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createUserFromSecondMe:', error)
    return null
  }
}

export async function updateUserShades(userId: string, shades: string[]) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        shades,
        secondme_synced_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating shades:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateUserShades:', error)
    return false
  }
}

export async function updateUserSoftMemory(userId: string, softMemory: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        soft_memory: softMemory,
        secondme_synced_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating soft memory:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateUserSoftMemory:', error)
    return false
  }
}

export async function getAgents() {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select(`
        id,
        user_id,
        name,
        level,
        coins,
        credit_score,
        avatar,
        is_active,
        last_resonance_at,
        response_time_minutes,
        satisfaction_rate,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agents:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAgents:', error)
    return []
  }
}

export async function getNegotiationSession(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('negotiation_sessions')
      .select(`
        id,
        user_id,
        requirement,
        formulated_requirement,
        status,
        result,
        created_at,
        updated_at,
        completed_at
      `)
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching session:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getNegotiationSession:', error)
    return null
  }
}

export async function createNegotiationSession(
  userId: string,
  requirement: string,
  formulatedRequirement: any
) {
  try {
    const { data, error } = await supabase
      .from('negotiation_sessions')
      .insert({
        user_id: userId,
        requirement,
        formulated_requirement: formulatedRequirement,
        status: 'negotiating',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createNegotiationSession:', error)
    return null
  }
}

export async function getAgentOffers(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('agent_offers')
      .select(`
        id,
        session_id,
        agent_id,
        offer_content,
        confidence,
        resonance_score,
        created_at
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching offers:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAgentOffers:', error)
    return []
  }
}

export async function createAgentOffer(
  sessionId: string,
  agentId: string,
  offerContent: any,
  confidence: number,
  resonanceScore: number
) {
  try {
    const { data, error } = await supabase
      .from('agent_offers')
      .insert({
        session_id: sessionId,
        agent_id: agentId,
        offer_content: offerContent,
        confidence,
        resonance_score: resonanceScore,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating offer:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createAgentOffer:', error)
    return null
  }
}
