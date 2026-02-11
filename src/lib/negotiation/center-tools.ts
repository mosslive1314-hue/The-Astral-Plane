import {
  PlanOutput,
  MachineConfig,
  AgentQuestion,
  DiscoveryConfig,
  SubDemandConfig,
  ToolExecutionResult,
  CenterContext,
  AgentOffer
} from '@/types/center-tools'

export abstract class CenterTool {
  abstract name: string
  abstract description: string

  abstract execute(
    context: CenterContext,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult>
}

export class OutputPlanTool extends CenterTool {
  name = 'output_plan'
  description = '输出文本方案（信息类/建议类需求）'

  async execute(
    context: CenterContext,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult> {
    try {
      const { content, summary } = parameters as { content: string; summary?: string }

      const plan: PlanOutput = {
        type: 'plan',
        content,
        summary: summary || content.substring(0, 200)
      }

      return {
        tool: this.name,
        success: true,
        result: plan,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }
    }
  }
}

export class CreateMachineTool extends CenterTool {
  name = 'create_machine'
  description = '创建 WOWOK Machine 草案'

  async execute(
    context: CenterContext,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult> {
    try {
      const machineConfig = parameters as MachineConfig

      return {
        tool: this.name,
        success: true,
        result: {
          type: 'contract',
          machine: machineConfig,
          status: 'draft'
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }
    }
  }
}

export class AskAgentTool extends CenterTool {
  name = 'ask_agent'
  description = '向指定 Agent 追问'

  async execute(
    context: CenterContext,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult> {
    try {
      const { agent_id, question, context: questionContext } = parameters as AgentQuestion

      return {
        tool: this.name,
        success: true,
        result: {
          agent_id,
          question,
          status: 'pending'
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }
    }
  }
}

export class StartDiscoveryTool extends CenterTool {
  name = 'start_discovery'
  description = '触发发现性对话'

  async execute(
    context: CenterContext,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult> {
    try {
      const discoveryConfig = parameters as DiscoveryConfig

      return {
        tool: this.name,
        success: true,
        result: {
          sub_session_id: `discovery_${Date.now()}`,
          participants: [discoveryConfig.agent_a, discoveryConfig.agent_b],
          reason: discoveryConfig.reason,
          status: 'processing'
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }
    }
  }
}

export class CreateSubDemandTool extends CenterTool {
  name = 'create_sub_demand'
  description = '生成子需求，触发递归'

  async execute(
    context: CenterContext,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult> {
    try {
      const subDemandConfig = parameters as SubDemandConfig

      return {
        tool: this.name,
        success: true,
        result: {
          sub_demand_id: `sub_${Date.now()}`,
          parent_demand_id: subDemandConfig.parent_demand_id,
          gap_description: subDemandConfig.gap_description,
          priority: subDemandConfig.priority || 'medium',
          status: 'pending'
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        tool: this.name,
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }
    }
  }
}

export class ToolSet {
  private tools: Map<string, CenterTool> = new Map()

  constructor() {
    this.registerTool(new OutputPlanTool())
    this.registerTool(new CreateMachineTool())
    this.registerTool(new AskAgentTool())
    this.registerTool(new StartDiscoveryTool())
    this.registerTool(new CreateSubDemandTool())
  }

  registerTool(tool: CenterTool): void {
    this.tools.set(tool.name, tool)
  }

  getTool(name: string): CenterTool | undefined {
    return this.tools.get(name)
  }

  getAllTools(): CenterTool[] {
    return Array.from(this.tools.values())
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  async executeTool(
    toolName: string,
    context: CenterContext,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult> {
    const tool = this.getTool(toolName)
    if (!tool) {
      return {
        tool: toolName,
        success: false,
        error: `Tool not found: ${toolName}`,
        timestamp: new Date().toISOString()
      }
    }

    return tool.execute(context, parameters)
  }
}

export const toolSet = new ToolSet()
