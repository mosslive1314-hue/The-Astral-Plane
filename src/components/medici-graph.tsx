'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Sparkles, X, Zap, FlaskConical, Atom } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

// 定义节点类型
type GraphNode = {
  id: string
  label: string
  group: number
  val: number
  desc?: string
  x?: number
  y?: number
  isUser?: boolean // 标记是否为用户技能
}

// 初始数据 - 更多元化的背景
const INITIAL_NODES: GraphNode[] = [
  { id: 'Creative', label: '艺术感知', group: 1, val: 20, desc: '对美、情感和故事的敏锐捕捉' },
  { id: 'Logic', label: '逻辑推理', group: 2, val: 20, desc: '严密的因果分析与结构化思维' },
  { id: 'Biology', label: '生物学', group: 4, val: 15, desc: '生命系统与演化规律' },
  { id: 'Finance', label: '金融学', group: 4, val: 15, desc: '价值流动与风险管理' },
  { id: 'Innovation', label: '涌现中心', group: 3, val: 30, desc: '不同学科碰撞的熔炉' },
  { id: 'Medici', label: '美帝奇效应', group: 3, val: 50, desc: '跨界创新的核心原点' },
]

const INITIAL_LINKS = [
  { source: 'Creative', target: 'Innovation' },
  { source: 'Logic', target: 'Innovation' },
  { source: 'Biology', target: 'Medici' },
  { source: 'Finance', target: 'Medici' },
  { source: 'Innovation', target: 'Medici' },
]

// 动态概念池 (更广泛的跨界组合)
const DISCOVERY_POOL = [
  { label: '认知盈余变现', desc: '将业余时间的认知能力转化为数字资产 (社会学 + 经济学)', group: 3 },
  { label: '算法伦理审查', desc: '确保 AI 决策符合人类道德标准 (哲学 + 计算机)', group: 3 },
  { label: '生物计算', desc: '利用生物分子进行数据存储与计算 (生物学 + 计算机)', group: 3 },
  { label: '城市代谢分析', desc: '像分析生物体一样分析城市资源流动 (城市规划 + 生物学)', group: 3 },
  { label: '情感计算艺术', desc: '根据观众情绪实时生成的动态艺术 (心理学 + 艺术)', group: 1 },
  { label: '分布式自治组织', desc: '基于代码契约运行的去中心化实体 (政治学 + 区块链)', group: 2 },
  { label: '神经架构搜索', desc: 'AI 自动设计更优的神经网络结构 (脑科学 + AI)', group: 2 },
  { label: '量子金融', desc: '利用量子算法解决复杂金融定价问题 (物理学 + 金融)', group: 2 },
  { label: '元宇宙考古', desc: '挖掘和保护数字世界的历史遗迹 (历史学 + VR)', group: 1 },
]

export function MediciGraph() {
  const fgRef = useRef<any>(null)
  const { agent } = useAuthStore()
  const [nodes, setNodes] = useState(INITIAL_NODES)
  const [links, setLinks] = useState(INITIAL_LINKS)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [isCombining, setIsCombining] = useState(false)
  const [discovery, setDiscovery] = useState<{label: string, desc: string} | null>(null)

  // 初始化：注入用户技能
  useEffect(() => {
    if (agent?.skills && agent.skills.length > 0) {
      setNodes(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        // 映射用户技能为节点
        const skillNodes: GraphNode[] = agent.skills.map((s: any) => ({
          id: `Skill_${s.id}`, // 避免 ID 冲突
          label: s.name,
          group: 2, // 默认归为逻辑/技能类
          val: 15,
          desc: s.description || '用户已掌握的技能',
          isUser: true
        }))
        
        // 过滤已存在的
        const newNodes = skillNodes.filter(n => !existingIds.has(n.id))
        
        // 为新节点创建一些随机连接到中心节点，避免孤立
        if (newNodes.length > 0) {
          const newLinks = newNodes.map(n => ({
            source: 'Medici',
            target: n.id
          }))
          setLinks(prevLinks => [...prevLinks, ...newLinks])
        }

        return [...prev, ...newNodes]
      })
    }
  }, [agent])

  // 处理节点点击
  const handleNodeClick = (node: GraphNode) => {
    if (isCombining) return

    // 如果已经选中了一个节点，且点击了另一个不同的节点 -> 触发组合
    if (selectedNode && selectedNode.id !== node.id) {
      combineNodes(selectedNode, node)
      setSelectedNode(null)
    } else {
      // 否则选中当前节点
      setSelectedNode(node === selectedNode ? null : node)
    }
  }

  // 组合逻辑
  const combineNodes = async (nodeA: GraphNode, nodeB: GraphNode) => {
    setIsCombining(true)
    
    // 模拟 AI 思考/共振过程
    toast.info(`正在尝试融合: ${nodeA.label} + ${nodeB.label}...`, {
      icon: <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
    })
    
    setTimeout(() => {
      // 总是成功：如果没有预设规则，则从发现池中随机抽取一个，或者组合名字
      // 简单的伪随机算法：基于两个节点的 ID 长度和字符码
      const seed = (nodeA.label.length + nodeB.label.length) % DISCOVERY_POOL.length
      const result = DISCOVERY_POOL[seed]
      
      // 生成新节点
      const newNodeId = `New_${Date.now()}`
      const newNode: GraphNode = {
        id: newNodeId,
        label: result.label, // 或者 `${nodeA.label} x ${nodeB.label}`
        group: result.group,
        val: 25,
        desc: `由 [${nodeA.label}] 与 [${nodeB.label}] 碰撞产生的创新概念：${result.desc}`,
        x: (nodeA.x! + nodeB.x!) / 2, 
        y: (nodeA.y! + nodeB.y!) / 2
      }

      setNodes(prev => [...prev, newNode])
      setLinks(prev => [
        ...prev,
        { source: nodeA.id, target: newNodeId },
        { source: nodeB.id, target: newNodeId }
      ])
      
      // 成功反馈
      setDiscovery({ label: newNode.label, desc: newNode.desc! })
      toast.success(`✨ 创新涌现！发现了 "${newNode.label}"`)

      // 聚焦到新节点
      if (fgRef.current) {
        fgRef.current.centerAt(newNode.x, newNode.y, 1000)
        fgRef.current.zoom(3, 2000)
      }
      
      setIsCombining(false)
    }, 1500)
  }

  // 节点绘制
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label || node.id
    const fontSize = 12 / globalScale
    const isSelected = selectedNode?.id === node.id

    // 绘制节点圆圈
    ctx.beginPath()
    const r = node.val / 4
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false)
    
    // 颜色逻辑
    if (node.group === 1) ctx.fillStyle = '#ec4899' // Pink (Creative)
    if (node.group === 2) ctx.fillStyle = '#3b82f6' // Blue (Logic)
    if (node.group === 3) ctx.fillStyle = '#f59e0b' // Amber (Innovation)
    if (node.isUser) ctx.fillStyle = '#10b981' // Emerald (User Skills)
    if (isSelected) ctx.fillStyle = '#ffffff' // Selected
    
    ctx.fill()

    // 选中光圈 / 用户技能光圈
    if (isSelected || node.isUser) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r * 1.5, 0, 2 * Math.PI, false)
      ctx.strokeStyle = isSelected ? '#ffffff' : '#10b981'
      ctx.lineWidth = (isSelected ? 2 : 0.5) / globalScale
      ctx.stroke()
    }

    // 文字
    ctx.font = `${fontSize}px Sans-Serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.fillText(label, node.x, node.y + r + fontSize)
  }, [selectedNode])

  return (
    <div className="relative w-full h-[600px] bg-black/40 rounded-xl border border-white/5 overflow-hidden">
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          美帝奇共振场 (Medici Resonance Field)
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          {selectedNode 
            ? `已激活: ${selectedNode.label} (点击另一个节点进行共振)`
            : '点击任意节点以激活，寻找共振点'}
        </p>
      </div>

      {/* Discovery Popup */}
      {discovery && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-black/90 border border-amber-500/50 rounded-2xl p-6 text-center animate-in zoom-in fade-in duration-300 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.3)]">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Atom className="w-6 h-6 text-amber-400 animate-spin-slow" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{discovery.label}</h2>
            <p className="text-sm text-zinc-400 max-w-xs">{discovery.desc}</p>
            <Button 
              size="sm" 
              variant="ghost" 
              className="mt-4 pointer-events-auto"
              onClick={() => setDiscovery(null)}
            >
              收入囊中
            </Button>
          </div>
        </div>
      )}

      {/* Selected Node Details Card */}
      {selectedNode && (
        <Card className="absolute top-4 right-4 z-10 w-64 bg-black/80 border-purple-500/30 backdrop-blur-md p-4 animate-in fade-in slide-in-from-right-10">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-white text-sm">{selectedNode.label}</h4>
            <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
            {selectedNode.desc || '暂无描述'}
          </p>
          <div className="text-[10px] text-zinc-500 flex gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5">
              能量值: {selectedNode.val}
            </span>
            {selectedNode.isUser && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                我的技能
              </span>
            )}
          </div>
        </Card>
      )}

      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeLabel="label"
        nodeCanvasObject={paintNode}
        onNodeClick={handleNodeClick}
        onBackgroundClick={() => setSelectedNode(null)}
        backgroundColor="#00000000"
        linkColor={() => '#ffffff20'}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        enableZoomInteraction={false} // 禁用滚轮缩放，避免干扰页面滚动
      />
    </div>
  )
}
