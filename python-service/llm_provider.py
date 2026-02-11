from abc import ABC, abstractmethod
from typing import Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict

class LLMSettings(BaseSettings):
    llm_provider: str = "openai"
    openai_api_key: str = ""
    zhipu_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

class LLMProvider(ABC):
    @abstractmethod
    async def formulate_requirement(self, original: str) -> Dict[str, Any]:
        pass

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
    
    async def formulate_requirement(self, original: str) -> Dict[str, Any]:
        system_prompt = """你是一个需求分析专家。你的任务是将用户的原始需求（往往模糊、不完整）转化为结构化、可执行的描述。

规则：
1. 理解用户的核心需求，而不是字面意思
2. 识别隐含的需求和约束条件
3. 提供关键关键词（3-5个）
4. 给出置信度评分（0-1）
5. 输出必须是中文

输出格式（JSON）：
{
  "enriched": "丰富化后的需求描述",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "context": {
    "type": "需求类型（如：技能匹配、任务发布、方案咨询）",
    "domain": "领域（如：法律、金融、技术、设计）",
    "urgency": "紧急程度（如：高、中、低）",
    "complexity": "复杂度（如：简单、中等、复杂）"
  },
  "confidence": 0.9
}

示例：
输入："我需要审核一份合同"
输出：
{
  "enriched": "需要一位具有法律专业背景的专家协助审核跨境贸易合同的合规性，包括条款风险、法律效力等方面",
  "keywords": ["合同审核", "法律咨询", "合规性检查", "跨境贸易"],
  "context": {
    "type": "任务发布",
    "domain": "法律",
    "urgency": "中",
    "complexity": "中等"
  },
  "confidence": 0.85
}"""
        
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"原始需求：{original}"}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        import json
        content = response.choices[0].message.content
        result = json.loads(content)
        
        return result

class ZhipuProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def formulate_requirement(self, original: str) -> Dict[str, Any]:
        import httpx
        
        system_prompt = """你是一个需求分析专家。你的任务是将用户的原始需求（往往模糊、不完整）转化为结构化、可执行的描述。

规则：
1. 理解用户的核心需求，而不是字面意思
2. 识别隐含的需求和约束条件
3. 提供关键关键词（3-5个）
4. 给出置信度评分（0-1）
5. 输出必须是中文

输出格式（JSON）：
{
  "enriched": "丰富化后的需求描述",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "context": {
    "type": "需求类型（如：技能匹配、任务发布、方案咨询）",
    "domain": "领域（如：法律、金融、技术、设计）",
    "urgency": "紧急程度（如：高、中、低）",
    "complexity": "复杂度（如：简单、中等、复杂）"
  },
  "confidence": 0.9
}

示例：
输入："我需要审核一份合同"
输出：
{
  "enriched": "需要一位具有法律专业背景的专家协助审核跨境贸易合同的合规性，包括条款风险、法律效力等方面",
  "keywords": ["合同审核", "法律咨询", "合规性检查", "跨境贸易"],
  "context": {
    "type": "任务发布",
    "domain": "法律",
    "urgency": "中",
    "complexity": "中等"
  },
  "confidence": 0.85
}"""
        
        payload = {
            "model": "glm-4",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"原始需求：{original}"}
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://open.bigmodel.cn/api/paas/v4/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"智谱AI API错误: {response.status_code}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            result = json.loads(content)
            
            return result

def get_llm_provider() -> LLMProvider:
    settings = LLMSettings()
    provider_type = settings.llm_provider.lower()
    
    if provider_type == "zhipu":
        api_key = settings.zhipu_api_key
        if not api_key:
            raise ValueError("使用智谱AI需要配置ZHIPU_API_KEY")
        return ZhipuProvider(api_key)
    else:
        api_key = settings.openai_api_key
        if not api_key:
            raise ValueError("使用OpenAI需要配置OPENAI_API_KEY")
        return OpenAIProvider(api_key)
