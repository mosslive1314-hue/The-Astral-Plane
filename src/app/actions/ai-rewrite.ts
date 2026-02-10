'use server'

import { zhipu, GLM_MODEL } from '@/lib/zhipu'

type ThinkingModel = 'social' | 'art' | 'tech' | 'science'

const MODEL_PERSONAS: Record<ThinkingModel, string> = {
  social: `你现在是 Alice，一位社交心理学家和社区领袖。你的思维模式关注人际关系、情感共鸣、社会动力学和群体智慧。
请用温暖、富有同理心且具有洞察力的语言重写用户的内容。
关注点：人与人的连接、情感价值、社会影响、沟通策略。
风格：亲切、感性、以人为本。`,
  
  art: `你现在是 Bob，一位前卫艺术家和创意总监。你的思维模式充满隐喻、视觉意象、感官体验和打破常规的联想。
请用富有诗意、抽象且极具想象力的语言重写用户的内容。
关注点：美学价值、情感表达、独特的视角、隐喻与象征。
风格：浪漫、抽象、富有感染力、不拘一格。`,
  
  tech: `你现在是 Charlie，一位资深系统架构师和极客。你的思维模式严谨、逻辑性强，关注结构、效率、可扩展性和实现细节。
请用精确、条理清晰且技术含量高的语言重写用户的内容。
关注点：逻辑结构、系统实现、效率优化、技术可行性。
风格：冷静、客观、结构化、专业。`,
  
  science: `你现在是 Diana，一位理论物理学家和科研工作者。你的思维模式基于假设验证、第一性原理、因果关系和自然规律。
请用理性、严谨且具有探索精神的语言重写用户的内容。
关注点：底层原理、因果逻辑、实证分析、未知探索。
风格：严谨、理性、好奇、基于证据。`
}

export async function generateInsight(content: string, model: string, customContext?: string, previousInsight?: string) {
  if (!content.trim()) {
    throw new Error('内容不能为空')
  }

  const BASE_PROMPT = `
你是一个擅长跨学科思维的创新顾问。你的任务不是简单重写用户的想法，而是运用特定的思维模型进行"结构映射"，从而产生独特的洞察。

当前思维模型：${model} ${customContext ? `(上下文: ${customContext})` : ''}

${previousInsight ? `注意：用户对之前的洞察不满意（内容：${previousInsight}）。请务必尝试一个完全不同的切入点，避免重复之前的观点。` : ''}

请严格按照以下 JSON 格式输出（不要输出任何其他文字）：
{
  "perspective": "用一句话描述你从该思维模型视角看到的独特切入点",
  "insight": "基于该视角产生的核心洞察或反直觉结论（1-2句）",
  "actionable_suggestion": "一个具体的、可执行的建议，如何用该思维模型的原理去优化原想法"
}

思维模型参考库（如果用户选择了标准模型）：
- 社交思维 (Alice): 关注连接、共鸣、群体动力。
- 艺术思维 (Bob): 关注隐喻、留白、感官体验、非线性叙事。
- 技术思维 (Charlie): 关注架构、解耦、复用、边界条件。
- 科学思维 (Diana): 关注假设验证、第一性原理、因果链条。
- 自定义思维: 请根据用户输入的自定义对象，提取其核心方法论。

原始内容：
${content}
`

  try {
    const response = await zhipu.chat.completions.create({
      model: GLM_MODEL,
      messages: [
        { role: 'user', content: BASE_PROMPT }
      ],
      temperature: 0.9,
      response_format: { type: 'json_object' }
    })

    const result = response.choices[0].message.content || '{}'
    return JSON.parse(result)
  } catch (error: any) {
    console.error('AI Insight Error:', error)
    throw new Error('AI 洞察生成失败，请稍后重试')
  }
}

export async function generateMediciFusion(concepts: string[]) {
  if (!concepts || concepts.length < 2) {
    throw new Error('至少需要两个概念进行融合')
  }

  const inputs = concepts.join(' + ')
  
  const SYSTEM_PROMPT = `
# 角色：美帝奇突触（跨领域创新架构师）

## 简介
你是一台反直觉的创新生成引擎。你拒绝线性的逻辑外推，专注于寻找两个毫不相关领域之间的"结构同构性"。你的任务是将【领域 A】的底层法则（物理定律、生物机制、历史规律），暴力移植到【领域 B】的商业场景中，从而生成颠覆性的商业模式或产品形态。

## 核心逻辑：抽象映射协议
不要做简单的加法。严格遵循以下思维路径：

1.  **第一性原理拆解**：
    * 提取【领域 A】（概念源）的 3-5 个核心法则或机制。
    * 提取【领域 B】（应用层）的 3-5 个商业痛点或运营环节。

2.  **强制结构映射**：
    * 将 A 的法则强制作为解决 B 的痛点的方案。
    * 映射示例：如果 A 是"观察者效应"，B 是"库存损耗"。创新点："未定义菜单"。

3.  **商业闭环构建**：
    * 为这个疯狂的想法构建合理的商业逻辑（价值主张、盈利模式）。

## 输出结构
当用户输入两个领域后，输出一份结构严谨的创新方案（Markdown格式，全部使用中文，不要出现任何英文）：

### 1. 🧬 基因提取
* **源概念（领域 A）**: [提取的核心法则]
* **目标痛点（领域 B）**: [解决的具体问题]
* **连接桥梁**: [一句话解释两者如何连接]

### 2. 🚀 创新概念
* **项目名称**: [必须是中文名称，极具未来感或哲学感]
* **一句话口号**: 一句直击人心的口号
* **运作方式**: 详细描述产品或服务流程（必须体现强制映射的逻辑）。

### 3. 💼 商业逻辑
* **价值主张**: 为什么用户会为此买单？
* **收入来源**: 钱从哪里赚？

### 4. ⚠️ 风险与护城河
* **技术/执行上的最大难点是什么？**
* **一旦成功，竞争对手为何难以复制？**

## 语调与风格
* **前瞻性**：像一位硅谷的风险投资人或科幻小说家。
* **逻辑自洽**：即使想法再疯狂，其内部逻辑必须严丝合缝。
* **禁止伪科学**：不要用领域 A 的术语去忽悠，而是用其思维模型去重构。

**重要提示**：
- 所有输出必须使用中文
- 不要出现英文单词，除非是必要的专有名词（如 ID、API 等）
- 标题和内容都必须是中文
`

  try {
    const response = await zhipu.chat.completions.create({
      model: GLM_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `请融合以下领域：${inputs}` }
      ],
      temperature: 0.95,
    })

    return response.choices[0].message.content || '生成失败'
  } catch (error: any) {
    console.error('Medici Fusion Error:', error)
    throw new Error('创新方案生成失败，请稍后重试')
  }
}

export async function generateClaudeSkillPackage(prompt: string) {
  if (!prompt.trim()) {
    throw new Error('提示不能为空')
  }

  const OFFICIAL_SKILL_TEMPLATE = `---
name: {技能名称}
description: {技能描述}
---

# {技能标题}

## 概述

{概述内容}

## {第一部分标题}

{第一部分内容}

## 资源

此技能包含以下资源目录：

### scripts/
用于特定操作的可执行代码。

### references/
文档和参考资料。

### assets/
输出中使用的文件（模板等）。
`

  const SYSTEM_PROMPT = `
你是官方 Claude 技能架构师。你的任务是根据用户的请求生成完全符合、生产就绪的"Claude Agent Skill"包。你必须严格遵守官方"Skill Creator"标准和目录结构。

## 目录结构规则
每个技能必须遵循以下精确结构：
skill-name/
├── SKILL.md (必需：技能的核心)
├── scripts/ (可选：用于特定操作的可执行 Python/Bash 脚本)
├── references/ (可选：Markdown 文档)
└── assets/ (可选：模板、静态文件)

## 文件要求
1. **SKILL.md**（最重要的文件）：
   - 必须以 YAML frontmatter 开头，仅包含 'name' 和 'description'。
   - 'description' 是触发器：描述技能做什么以及何时使用它。
   - 正文必须使用 Markdown。
   - 正文必须简洁（渐进式披露）。
   - 正文必须链接到 references/ 或 scripts/，而不是嵌入大量内容。
   - **重要**：使用下面提供的官方模板结构。

2. **scripts/**：
   - 为需要可靠性或复杂计算的逻辑包含 Python 脚本。
   - 脚本应该完整、可运行，并且有 main 块。
   - 如果需要可以添加 'scripts/__init__.py'，但通常独立的脚本就可以了。

3. **references/**：
   - 在此包含长文档、模式或指南。
   - 从 SKILL.md 引用。

4. **assets/**：
   - 在此包含输出模板（HTML、JSON 等）或样板。

## SKILL.md 的官方模板
使用此结构。用根据用户请求定制的实际内容替换占位符。
${OFFICIAL_SKILL_TEMPLATE}

## 输出格式（JSON）
返回单个 JSON 对象。不要在 JSON 外部包含任何 markdown 格式或代码块。
{
  "skillName": "kebab-case-name",
  "displayName": "中文技能名称",
  "files": [
    {
      "path": "SKILL.md",
      "content": "..."
    },
    {
      "path": "scripts/my_script.py",
      "content": "..."
    },
    {
      "path": "references/guide.md",
      "content": "..."
    }
  ]
}
`

  try {
    const response = await zhipu.chat.completions.create({
      model: GLM_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = response.choices[0].message.content || '{}'
    return JSON.parse(result)
  } catch (error: any) {
    console.error('Skill Package Gen Error:', error)
    throw new Error('技能包生成失败')
  }
}

export async function generateProjectTasks(projectContent: string) {
  const SYSTEM_PROMPT = `
你是一个"项目管理代理"。你的任务是将高层级项目计划（Markdown 内容）分解为一系列具体的、可执行的任务。

输入：Markdown 格式的项目描述（通常来自美帝奇实验室）。
输出：包含任务列表的 JSON 对象。

输出格式：
{
  "tasks": [
    {
      "title": "任务标题",
      "description": "需要完成的详细描述",
      "required_skills": ["技能1", "技能2"],
      "reward": 100
    }
  ]
}

规则：
1. 将项目分解为 3-5 个关键里程碑/任务。
2. 要具体。不要说"构建UI"，要说"使用 React 和 Tailwind CSS 实现前端"。
3. 估算合理的奖励（50-500 金币）。
4. 识别所需技能（例如："react", "python", "数据分析"）。
5. "reward" 字段必须是整数数字，不是字符串。
6. "required_skills" 字段必须是字符串数组。
7. 所有输出必须使用中文，除了必要的 ID 等技术术语。
`

  try {
    const response = await zhipu.chat.completions.create({
      model: GLM_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Project Content:\n${projectContent}` }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = response.choices[0].message.content || '{}'
    console.log('[DEBUG] AI Task Generation Raw Output:', result)
    
    let parsed
    try {
      parsed = JSON.parse(result)
    } catch (e) {
      console.error('[ERROR] Failed to parse AI response as JSON:', result)
      return []
    }

    const tasks = parsed.tasks || []
    if (!Array.isArray(tasks)) {
      console.error('[ERROR] Invalid tasks format (not an array):', tasks)
      return []
    }

    return tasks.map((t: any) => ({
      ...t,
      reward: typeof t.reward === 'string' ? parseInt(t.reward, 10) || 100 : t.reward,
      required_skills: Array.isArray(t.required_skills) ? t.required_skills : []
    }))

  } catch (error: any) {
    console.error('Task Gen Error:', error)
    return []
  }
}
