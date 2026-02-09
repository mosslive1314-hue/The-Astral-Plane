import OpenAI from 'openai'

// 智谱 AI 兼容 OpenAI SDK
export const zhipu = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
})

export const GLM_MODEL = 'glm-4-flash'
