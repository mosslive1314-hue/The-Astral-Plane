'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import type { SkillCategory, SkillRarity } from '@/types'

export type DiscoveryResult = {
  success: boolean
  message: string
  newSkill?: any
  combinationId?: string
}

/**
 * 发现新技能（美帝奇效应）
 */
export async function discoverSkill(
  agentId: string,
  skill1Id: string,
  skill2Id: string
): Promise<DiscoveryResult> {
  try {
    // 1. 验证 Agent 是否拥有这两个技能
    const { data: skills, error: skillsError } = await supabaseAdmin
      .from('agent_skills')
      .select('skill_id, level, skill:skills(*)')
      .eq('agent_id', agentId)
      .in('skill_id', [skill1Id, skill2Id])

    if (skillsError || !skills || skills.length !== 2) {
      return { success: false, message: '你必须拥有这两个技能才能进行组合' }
    }

    const s1 = skills[0].skill
    const s2 = skills[1].skill
    
    // 2. 检查是否已经尝试过这个组合
    // 这里的逻辑可以是：
    // - 每个组合只能尝试一次？
    // - 或者每次都有概率成功？
    // 简单起见，我们假设每次都是新的尝试，或者检查历史记录
    
    // 3. 执行组合算法 (服务端逻辑)
    // s1 和 s2 是通过 supabase join 查询出来的，可能是数组也可能是对象
    // 但在 TypeScript 中，supabase 的 select('..., skill:skills(*)') 
    // 如果是一对一关联，默认返回的是单对象，但类型推断可能认为是数组
    const skill1 = Array.isArray(s1) ? s1[0] : s1
    const skill2 = Array.isArray(s2) ? s2[0] : s2
    
    const isCrossDomain = skill1.category !== skill2.category
    
    // 简单概率算法：跨域组合成功率高，同域低
    // 但为了 Demo 效果，我们让它总是成功，或者高概率成功
    
    // 生成新技能属性
    const newName = generateSkillName(skill1, skill2)
    const newCategory = isCrossDomain ? skill1.category : skill2.category
    const newRarity = calculateRarity(skill1, skill2)
    const newDesc = `由 ${skill1.name} 和 ${skill2.name} 融合而成的全新技能。`
    const newPrice = Math.round((skill1.base_price + skill2.base_price) * 1.5)

    // 4. 保存新技能
    const { data: newSkill, error: createError } = await supabaseAdmin
      .from('skills')
      .insert({
        name: newName,
        category: newCategory,
        description: newDesc,
        rarity: newRarity,
        base_price: newPrice
      })
      .select()
      .single()

    if (createError) throw createError

    // 5. 记录组合历史
    const { data: combination, error: combError } = await supabaseAdmin
      .from('medici_combinations')
      .insert({
        agent_id: agentId,
        skill1_id: skill1.id,
        skill2_id: skill2.id,
        new_skill_id: newSkill.id,
        status: 'found',
        discovered_at: new Date().toISOString()
      })
      .select()
      .single()
      
    if (combError) throw combError
    
    // 6. 给予 Agent 新技能
    await supabaseAdmin.from('agent_skills').insert({
      agent_id: agentId,
      skill_id: newSkill.id,
      level: 1,
      max_level: 5
    })

    // 7. 触发成就检查 (简化)
    if (isCrossDomain) {
      // 检查是否已有 "美帝奇探索者" 成就，没有则添加
      // 这里省略具体成就逻辑，假设前端或触发器处理
    }

    revalidatePath('/medici')
    revalidatePath('/profile')

    return {
      success: true,
      message: '发现新技能！',
      newSkill: {
        ...newSkill,
        uniqueAttributes: isCrossDomain
        ? [`跨域融合：${skill1.category} × ${skill2.category}`, '创新思维突破']
        : ['同域深化']
      },
      combinationId: combination.id
    }

  } catch (error: any) {
    console.error('Discovery error:', error)
    return { success: false, message: `发现失败: ${error.message}` }
  }
}

// 辅助函数 (不导出，或者是普通函数)
function generateSkillName(s1: any, s2: any): string {
  const prefixes = ['量子', '神经', '智能', '创意', '动态', '全栈', '跨域', '融合']
  const suffixes = ['大师', '专家', '架构师', '工程师', '设计师', '分析师']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  // 简单的字符串处理，取类别的前两个字
  const c1 = s1.category.substring(0, 2)
  const c2 = s2.category.substring(0, 2)
  return `${prefix}${c1}${c2}${suffix}`
}

function calculateRarity(s1: any, s2: any): SkillRarity {
  const rarityValue: Record<string, number> = { common: 1, rare: 2, epic: 3, legendary: 4 }
  const r1 = rarityValue[s1.rarity] || 1
  const r2 = rarityValue[s2.rarity] || 1
  const avg = (r1 + r2) / 2
  const isCross = s1.category !== s2.category
  
  if (isCross && avg >= 3.5) return 'legendary'
  if (isCross && avg >= 2.5) return 'epic'
  if (isCross) return 'rare'
  return s1.rarity as SkillRarity
}
