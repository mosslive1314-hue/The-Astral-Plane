import { SkillInterface, SkillContext, SkillResult, SkillExecutionConfig } from '@/types/skill'

export abstract class BaseSkill implements SkillInterface {
  abstract name: string
  abstract role: string
  abstract responsibility: string
  abstract inputType: string
  abstract outputType: string
  abstract principles: string[]
  abstract constraints: string[]
  abstract invocationPhase: string

  protected config: SkillExecutionConfig = {
    model: 'glm-4-flash',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000
  }

  protected defaultConfig: SkillExecutionConfig = {
    model: 'glm-4-flash',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000
  }

  private getApiUrl(path: string): string {
    if (typeof window !== 'undefined') {
      return path
    }
    return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + path
  }

  abstract execute(
    context: SkillContext,
    input: any,
    config?: Partial<SkillExecutionConfig>
  ): Promise<SkillResult>

  protected async callLLM(
    prompt: string,
    config?: Partial<SkillExecutionConfig>
  ): Promise<SkillResult> {
    const finalConfig = { ...this.defaultConfig, ...config, ...this.config }

    try {
      const response = await fetch(this.getApiUrl('/api/llm/invoke'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: finalConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.maxTokens
        })
      })

      if (!response.ok) {
        const error = await response.text()
        return {
          success: false,
          error: `LLM API error: ${error}`,
          timestamp: new Date().toISOString()
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.content,
        reasoning: data.reasoning,
        tokenUsage: data.usage,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }
    }
  }

  protected validateInput(input: any): { valid: boolean; error?: string } {
    if (input === null || input === undefined) {
      return { valid: false, error: 'Input cannot be null or undefined' }
    }
    return { valid: true }
  }

  protected logExecution(context: SkillContext, result: SkillResult): void {
    console.log(`[Skill:${this.name}] Execution`, {
      userId: context.userId,
      sessionId: context.sessionId,
      round: context.roundNumber,
      success: result.success,
      timestamp: result.timestamp,
      tokenUsage: result.tokenUsage,
      hasData: result.data !== undefined,
      dataPreview: typeof result.data === 'string' ? result.data.substring(0, 100) : typeof result.data
    })
  }

  configure(config: Partial<SkillExecutionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): SkillExecutionConfig {
    return { ...this.config }
  }

  getInterface(): SkillInterface {
    return {
      name: this.name,
      role: this.role,
      responsibility: this.responsibility,
      inputType: this.inputType,
      outputType: this.outputType,
      principles: this.principles,
      constraints: this.constraints,
      invocationPhase: this.invocationPhase
    }
  }
}
