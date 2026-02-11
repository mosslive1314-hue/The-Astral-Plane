import { NextRequest, NextResponse } from 'next/server'
import { agentHealthMonitor } from '@/lib/infrastructure/agent-health-monitor'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId')

  if (agentId) {
    const status = agentHealthMonitor.getHealthStatus(agentId)
    const errors = agentHealthMonitor.getErrorLog(agentId)

    return NextResponse.json({
      success: true,
      agentId,
      healthStatus: status,
      recentErrors: errors.slice(-5)
    })
  }

  const allStatus = agentHealthMonitor.getAllHealthStatus()
  const unavailableAgents = agentHealthMonitor.getUnavailableAgents()

  return NextResponse.json({
    success: true,
    totalAgents: allStatus.length,
    activeAgents: allStatus.filter(s => s.status === 'active').length,
    unavailableAgents: unavailableAgents.length,
    unavailableAgentList: unavailableAgents,
    allStatus
  })
}

export async function POST(request: NextRequest) {
  const { agentId, operation } = await request.json()

  if (operation === 'checkHealth') {
    const isHealthy = await agentHealthMonitor.checkAgentHealth(agentId)
    
    return NextResponse.json({
      success: true,
      agentId,
      isHealthy,
      status: agentHealthMonitor.getHealthStatus(agentId)
    })
  }

  if (operation === 'reset') {
    agentHealthMonitor.resetAgentStatus(agentId)
    
    return NextResponse.json({
      success: true,
      agentId,
      message: 'Agent status reset'
    })
  }

  return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
}
