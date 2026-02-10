import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface DatabaseUser {
  id: string
  secondme_id: string
  nickname: string | null
  avatar: string | null
  shades: string[] | null
  created_at: string
  updated_at: string
}

export interface DatabaseAgent {
  id: string
  user_id: string
  name: string
  level: number
  coins: number
  credit_score: number
  avatar: string | null
  created_at: string
  updated_at: string
}

/**
 * 创建或更新用户，并确保用户有一个Agent
 */
export async function createOrUpdateUser(secondmeId: string, userInfo: {
  nickname?: string
  avatar?: string
  shades?: string[]
}) {
  try {
    // 1. 查找或创建用户
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('secondme_id', secondmeId)
      .single()

    let user: DatabaseUser

    if (selectError || !existingUser) {
      // 创建新用户
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          secondme_id: secondmeId,
          nickname: userInfo.nickname || null,
          avatar: userInfo.avatar || null,
          shades: userInfo.shades || [],
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create user:', insertError)
        throw insertError
      }

      user = newUser
      console.log('[DB] Created new user:', user.id)
    } else {
      // 更新现有用户
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          nickname: userInfo.nickname || existingUser.nickname,
          avatar: userInfo.avatar || existingUser.avatar,
          shades: userInfo.shades || existingUser.shades,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update user:', updateError)
        throw updateError
      }

      user = updatedUser
      console.log('[DB] Updated user:', user.id)
    }

    // 2. 确保用户有一个 Agent
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let agent: DatabaseAgent

    if (!existingAgent) {
      // 为新用户创建默认 Agent
      const { data: newAgent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: userInfo.nickname || 'Agent',
          level: 1,
          coins: 1000, // 初始金币
          credit_score: 500, // 初始信用分
          avatar: userInfo.avatar || null,
        })
        .select()
        .single()

      if (agentError) {
        console.error('Failed to create agent:', agentError)
        throw agentError
      }

      agent = newAgent
      console.log('[DB] Created new agent:', agent.id)
    } else {
      agent = existingAgent
      console.log('[DB] Found existing agent:', agent.id)
    }

    return { user, agent }
  } catch (error) {
    console.error('[DB] Error in createOrUpdateUser:', error)
    throw error
  }
}

/**
 * 获取用户的 Agent
 */
export async function getUserAgent(userId: string): Promise<DatabaseAgent | null> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Failed to get agent:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserAgent:', error)
    return null
  }
}

/**
 * 获取用户的 SecondMe ID
 */
export async function getUserBySecondMeId(secondmeId: string): Promise<DatabaseUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('secondme_id', secondmeId)
      .single()

    if (error) {
      console.error('Failed to get user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserBySecondMeId:', error)
    return null
  }
}
