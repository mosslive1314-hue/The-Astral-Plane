import { Zap, Brain, Heart, Shield, Target, Sparkles, User, Anchor, Compass } from 'lucide-react'

// 定义人格维度
export interface PersonaTraits {
  rationality: number // 理性
  sensitivity: number // 感性
  adventure: number   // 冒险/创新
  structure: number   // 结构/保守
}

// 定义 Buff
export interface PersonaBuff {
  name: string
  desc: string
  icon: any // Lucide icon component
  type: 'tech' | 'art' | 'social' | 'science' | 'general'
}

// 定义完整画像
export interface DigitalPersona {
  archetype: string // 原型名称 (e.g. "创新实干家")
  traits: { name: string; value: number; color: string }[]
  coreValues: string[]
  buffs: PersonaBuff[]
}

// 关键词映射表 (用于分析 Shades)
const KEYWORD_MAP: Record<string, Partial<PersonaTraits>> = {
  // 理性/技术类
  'developer': { rationality: 20, structure: 10 },
  'engineer': { rationality: 20, structure: 10 },
  'programmer': { rationality: 20, structure: 5 },
  'tech': { rationality: 15, adventure: 5 },
  'science': { rationality: 20, structure: 10 },
  'data': { rationality: 25, structure: 10 },
  'logic': { rationality: 20, structure: 15 },
  'analysis': { rationality: 20, structure: 15 },
  
  // 感性/艺术类
  'art': { sensitivity: 20, adventure: 10 },
  'design': { sensitivity: 15, adventure: 15 },
  'music': { sensitivity: 20, adventure: 5 },
  'writer': { sensitivity: 25, structure: -5 },
  'poet': { sensitivity: 30, adventure: 5 },
  'creative': { sensitivity: 15, adventure: 20 },
  'emotion': { sensitivity: 25 },
  
  // 冒险/创新类
  'entrepreneur': { adventure: 25, rationality: 10 },
  'founder': { adventure: 25, structure: -5 },
  'startup': { adventure: 20, rationality: 5 },
  'travel': { adventure: 15, sensitivity: 5 },
  'explorer': { adventure: 25 },
  'innovation': { adventure: 20, rationality: 5 },
  
  // 结构/保守类
  'manager': { structure: 20, rationality: 10 },
  'admin': { structure: 25, rationality: 5 },
  'finance': { structure: 25, rationality: 15 },
  'lawyer': { structure: 30, rationality: 10 },
  'teacher': { structure: 15, sensitivity: 10 },
  'history': { structure: 15, sensitivity: 5 }
}

// 原型定义
const ARCHETYPES = [
  { name: '未来架构师', condition: (t: PersonaTraits) => t.rationality > 70 && t.structure > 60 },
  { name: '浪漫诗人', condition: (t: PersonaTraits) => t.sensitivity > 70 && t.adventure > 50 },
  { name: '创新黑客', condition: (t: PersonaTraits) => t.adventure > 70 && t.rationality > 50 },
  { name: '社群领袖', condition: (t: PersonaTraits) => t.sensitivity > 60 && t.structure > 40 },
  { name: '数据哲学家', condition: (t: PersonaTraits) => t.rationality > 80 && t.sensitivity > 40 },
  { name: '自由探险家', condition: (t: PersonaTraits) => t.adventure > 80 && t.structure < 40 },
  { name: '平衡守护者', condition: (t: PersonaTraits) => Math.abs(t.rationality - t.sensitivity) < 20 },
]

export function analyzePersona(shades: string[]): DigitalPersona {
  // 1. 基础分值
  let traits: PersonaTraits = {
    rationality: 50, // 基础分 50
    sensitivity: 50,
    adventure: 50,
    structure: 50
  }

  // 2. 关键词匹配
  const shadeText = shades.join(' ').toLowerCase()
  
  Object.entries(KEYWORD_MAP).forEach(([keyword, modifiers]) => {
    if (shadeText.includes(keyword)) {
      if (modifiers.rationality) traits.rationality += modifiers.rationality
      if (modifiers.sensitivity) traits.sensitivity += modifiers.sensitivity
      if (modifiers.adventure) traits.adventure += modifiers.adventure
      if (modifiers.structure) traits.structure += modifiers.structure
    }
  })

  // 3. 归一化 (限制在 0-100)
  const normalize = (val: number) => Math.min(100, Math.max(0, val))
  traits = {
    rationality: normalize(traits.rationality),
    sensitivity: normalize(traits.sensitivity),
    adventure: normalize(traits.adventure),
    structure: normalize(traits.structure)
  }

  // 4. 确定原型
  let archetype = '探索者' // 默认
  for (const arch of ARCHETYPES) {
    if (arch.condition(traits)) {
      archetype = arch.name
      break
    }
  }

  // 5. 提取核心价值观
  const coreValues: string[] = []
  if (traits.rationality > 70) coreValues.push('第一性原理', '逻辑至上')
  if (traits.sensitivity > 70) coreValues.push('共情', '人文关怀')
  if (traits.adventure > 70) coreValues.push('颠覆', '快速迭代')
  if (traits.structure > 70) coreValues.push('秩序', '稳健')
  if (traits.rationality > 60 && traits.adventure > 60) coreValues.push('技术向善')
  if (coreValues.length === 0) coreValues.push('持续成长', '开放包容') // 兜底

  // 6. 生成 Buffs
  const buffs: PersonaBuff[] = []
  
  if (traits.rationality > 60) {
    buffs.push({
      name: '结构化思维',
      desc: '生成的笔记逻辑性 +30%',
      icon: Brain,
      type: 'tech'
    })
  }
  
  if (traits.sensitivity > 60) {
    buffs.push({
      name: '情感共鸣',
      desc: '社交类洞察深度 +30%',
      icon: Heart,
      type: 'social'
    })
  }
  
  if (traits.adventure > 60) {
    buffs.push({
      name: '创新直觉',
      desc: '更容易发现反直觉的切入点',
      icon: Zap,
      type: 'general'
    })
  }

  if (traits.structure > 60) {
    buffs.push({
      name: '系统稳健性',
      desc: '行动建议的可执行性 +40%',
      icon: Shield,
      type: 'general'
    })
  }

  // 默认 Buff
  if (buffs.length === 0) {
    buffs.push({
      name: '全能视角',
      desc: '平衡各维度的思维模型',
      icon: Compass,
      type: 'general'
    })
  }

  return {
    archetype,
    traits: [
      { name: '理性', value: traits.rationality, color: 'bg-blue-500' },
      { name: '感性', value: traits.sensitivity, color: 'bg-pink-500' },
      { name: '冒险', value: traits.adventure, color: 'bg-amber-500' },
      { name: '结构', value: traits.structure, color: 'bg-emerald-500' }
    ],
    coreValues: coreValues.slice(0, 3), // 最多展示3个
    buffs: buffs.slice(0, 3) // 最多展示3个
  }
}
