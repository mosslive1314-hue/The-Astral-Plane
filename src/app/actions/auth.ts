'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { DatabaseUser, DatabaseAgent } from '@/lib/database'
import type { Agent, AgentSkill, Achievement } from '@/types'

export async function syncUser(secondmeId: string, userInfo: {
  nickname?: string
  avatar?: string
  shades?: string[]
}) {
  try {
    // 1. 查找或创建用户
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('secondme_id', secondmeId)
      .single()

    let user: DatabaseUser

    if (selectError || !existingUser) {
      // 创建新用户
      const { data: newUser, error: insertError } = await supabaseAdmin
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
        console.error('Failed to create user:', JSON.stringify(insertError, null, 2))
        throw new Error(`Failed to create user: ${insertError.message}`)
      }

      user = newUser
      console.log('[DB] Created new user:', user.id)
    } else {
      // 更新现有用户
      const { data: updatedUser, error: updateError } = await supabaseAdmin
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
        console.error('Failed to update user:', JSON.stringify(updateError, null, 2))
        throw new Error(`Failed to update user: ${updateError.message}`)
      }

      user = updatedUser
      console.log('[DB] Updated user:', user.id)
    }

    // 2. 确保用户有一个 Agent
    const { data: existingAgent } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let agent: DatabaseAgent

    if (!existingAgent) {
      // 为新用户创建默认 Agent
      const { data: newAgent, error: agentError } = await supabaseAdmin
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
        console.error('Failed to create agent:', JSON.stringify(agentError, null, 2))
        throw new Error(`Failed to create agent: ${agentError.message}`)
      }

      agent = newAgent
      console.log('[DB] Created new agent:', agent.id)
    } else {
      agent = existingAgent
      console.log('[DB] Found existing agent:', agent.id)
    }

    return { user, agent }
  } catch (error: any) {
    console.error('[DB] Error in syncUser:', error)
    throw error
  }
}

export async function getAgentFullDetails(userId: string): Promise<Agent | null> {
  try {
    // 1. 获取 Agent 基本信息
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (agentError || !agent) return null

    // 2. 获取技能
    const { data: skillsData } = await supabaseAdmin
      .from('agent_skills')
      .select(`
        level,
        max_level,
        skill:skills (
          id,
          name,
          category,
          description,
          rarity
        )
      `)
      .eq('agent_id', agent.id)

    const skills: AgentSkill[] = (skillsData || []).map((item: any) => ({
      id: item.skill.id,
      name: item.skill.name,
      category: item.skill.category,
      description: item.skill.description,
      rarity: item.skill.rarity,
      level: item.level,
      maxLevel: item.max_level,
      exp: 0, // 数据库暂未存储当前经验值，暂设为0
      nextLevelExp: 100 * (item.level + 1)
    }))

    // 3. 获取成就
    const { data: achievementsData } = await supabaseAdmin
      .from('agent_achievements')
      .select(`
        unlocked_at,
        achievement:achievements (
          id,
          name,
          description,
          icon,
          requirement
        )
      `)
      .eq('agent_id', agent.id)

    // 获取所有成就以显示未解锁的
    const { data: allAchievements } = await supabaseAdmin
      .from('achievements')
      .select('*')

    const achievements: Achievement[] = (allAchievements || []).map((item: any) => {
      const unlocked = achievementsData?.find((a: any) => a.achievement.id === item.id)
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        requirement: item.requirement,
        unlockedAt: unlocked ? new Date(unlocked.unlocked_at) : undefined
      }
    })

    return {
      id: agent.id,
      userId: agent.user_id,
      name: agent.name,
      level: agent.level,
      coins: agent.coins,
      creditScore: agent.credit_score,
      avatar: agent.avatar,
      skills,
      achievements
    }
  } catch (error) {
    console.error('Error fetching agent details:', error)
    return null
  }
}
