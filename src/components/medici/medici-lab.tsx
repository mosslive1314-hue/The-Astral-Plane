'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Atom, Plus, X, Zap, Sparkles, Hexagon, Rocket, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

// Particle representing an input concept
type Particle = {
  id: string
  text: string
  color: string
  x: number
  y: number
}

const COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500'
]

import { createNote, updateNoteTags } from '@/app/actions/notes'
import { generateMediciFusion, generateProjectTasks } from '@/app/actions/ai-rewrite'
import { useAuthStore } from '@/store/auth'
import { publishSkillToMarket } from '@/app/actions/market'
import { createProjectTasks } from '@/app/actions/tasks'

export function MediciLab() {
  const { agent } = useAuthStore()
  const [inputs, setInputs] = useState<Particle[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isFusing, setIsFusing] = useState(false)
  const [fusionResult, setFusionResult] = useState<string | null>(null)
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  
  // Animation controls
  const coreControls = useAnimation()

  const handleAddInput = () => {
    if (!inputValue.trim()) return
    if (inputs.length >= 6) {
      toast.error('反应堆容量已达上限')
      return
    }

    const newParticle: Particle = {
      id: Date.now().toString(),
      text: inputValue,
      color: COLORS[inputs.length % COLORS.length],
      // Random initial position around the center
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
    }

    setInputs([...inputs, newParticle])
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddInput()
  }

  const handleRemoveInput = (id: string) => {
    setInputs(inputs.filter(p => p.id !== id))
  }

  const handleFuse = async () => {
    if (inputs.length < 2) return
    
    setIsFusing(true)
    setCurrentNoteId(null) // Reset note ID on new fusion
    
    // 1. SUCK IN PARTICLES (Handled by inputs animation state)
    
    // 2. Accelerate Core (Implosion)
    await coreControls.start({
      scale: [1, 1.2, 0.1],
      rotate: [0, 360, 1080],
      transition: { duration: 1.5, times: [0, 0.6, 1], ease: "easeInOut" }
    })

    // 3. EXPLOSION & FLASH
    // (Handled by conditional rendering)

    // 4. Result
    try {
      const concepts = inputs.map(i => i.text)
      const result = await generateMediciFusion(concepts)
      setFusionResult(result)
      setIsFusing(false)
      // Reset core gentle pulse
      coreControls.start({ scale: 1, rotate: 0, transition: { duration: 0.5 } })
    } catch (error) {
      console.error(error)
      toast.error('融合失败，请重试')
      setIsFusing(false)
      coreControls.start({ scale: 1, rotate: 0 })
    }
  }


  const resetLab = () => {
    setFusionResult(null)
    setInputs([])
    setInputValue('')
    setCurrentNoteId(null)
    coreControls.start({ scale: 1, rotate: 0 })
  }

  // Helper to save or get existing note
  const ensureNoteSaved = async (tags: string[] = []) => {
    if (!fusionResult || !agent?.id) return null
    
    if (currentNoteId) {
      if (tags.length > 0) {
        await updateNoteTags(agent.id, currentNoteId, tags)
      }
      return currentNoteId
    }

    try {
      const concepts = inputs.map(i => i.text).join(' + ')
      // Extract One-Liner or Project Name for title if possible, else use default
      const titleMatch = fusionResult.match(/\*\*Project Name\*\*: (.*)/)
      const title = titleMatch ? titleMatch[1] : `灵光一现: ${concepts}`

      const note = await createNote(agent.id, {
        title: title,
        content: fusionResult,
        category: 'medici',
        tags: ['medici', ...inputs.map(i => i.text), ...tags]
      })
      
      setCurrentNoteId(note.id)
      return note.id
    } catch (error) {
      console.error(error)
      toast.error('保存失败')
      return null
    }
  }

  const handleSaveNote = async () => {
    const noteId = await ensureNoteSaved()
    if (noteId) {
      toast.success('灵感已存入心智资产库')
      resetLab()
    }
  }

  const handleImplement = async () => {
    if (!fusionResult || !agent?.id) return
    
    setIsFusing(true) // Show loading state on UI if possible, or use toast loading
    const toastId = toast.loading('正在拆解项目任务...')

    try {
      // 1. Ensure note is saved first
      const noteId = await ensureNoteSaved(['project', 'implemented'])
      if (!noteId) throw new Error('保存项目失败')

      // 2. Generate tasks using AI
      const tasks = await generateProjectTasks(fusionResult)
      
      if (tasks.length === 0) {
        toast.error('AI 未能生成有效任务，请重试', { id: toastId })
        setIsFusing(false)
        return
      }

      // 3. Save tasks to DB
      await createProjectTasks(agent.id, tasks)
      
      toast.success(`项目已启动！生成了 ${tasks.length} 个子任务并发布到大厅`, { id: toastId })
      resetLab()
    } catch (error) {
      console.error(error)
      toast.error('实施失败', { id: toastId })
    } finally {
      setIsFusing(false)
    }
  }

  const handlePublish = async () => {
    if (!fusionResult || !agent?.id) return

    try {
      // 1. Save note first
      const noteId = await ensureNoteSaved(['published', 'solution'])
      
      // 2. Extract title and content
      const titleMatch = fusionResult.match(/\*\*Project Name\*\*: (.*)/)
      const title = titleMatch ? titleMatch[1] : 'Medici Solution'

      // 3. Publish to market as a "Solution" (Skill)
      const result = await publishSkillToMarket(agent.id, {
        name: title,
        description: 'Generated by Medici Lab Innovation Engine',
        content: fusionResult,
        price: 500 // Premium price for solutions
      })

      if (result.success) {
        toast.success('方案已发布到市场！')
        resetLab()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error(error)
      toast.error('发布失败')
    }
  }

  return (
    <div className="w-full h-full max-h-[80vh] relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* --- REACTOR CORE --- */}
      <div className="relative w-[400px] h-[400px] flex items-center justify-center mb-8">
        
        {/* Energy Rings */}
        <motion.div 
          animate={isFusing ? { rotate: 360, scale: [1, 1.2, 1] } : { rotate: 360 }}
          transition={{ duration: isFusing ? 0.5 : 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/30"
        />
        <motion.div 
          animate={isFusing ? { rotate: -360, scale: [1, 0.8, 1] } : { rotate: -360 }}
          transition={{ duration: isFusing ? 0.5 : 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-blue-500/20"
        />

        {/* The Core */}
        <motion.div
          animate={coreControls}
          className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 blur-md flex items-center justify-center shadow-[0_0_50px_rgba(147,51,234,0.5)]"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
          <Atom className="w-10 h-10 text-white animate-spin-slow" />
        </motion.div>

        {/* Orbiting Particles (User Inputs) */}
        <AnimatePresence>
          {!fusionResult && inputs.map((particle, index) => {
            // Calculate orbit position based on index
            const angle = (index / inputs.length) * 2 * Math.PI
            const radius = 140
            
            return (
              <motion.div
                key={particle.id}
                initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                animate={{ 
                  scale: isFusing ? 0.2 : 1, 
                  opacity: isFusing ? 0 : 1,
                  x: isFusing ? 0 : Math.cos(angle) * radius,
                  y: isFusing ? 0 : Math.sin(angle) * radius,
                }}
                transition={{ duration: isFusing ? 1.2 : 0.5, ease: "easeInOut" }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -ml-16 -mt-5" // Center alignment fix
              >
                <div className="relative group">
                  <div className={`
                    w-32 py-2 px-3 rounded-full backdrop-blur-md border border-white/20
                    flex items-center justify-between gap-2 shadow-lg cursor-pointer
                    ${particle.color} bg-opacity-20 hover:bg-opacity-40 transition-all
                  `}>
                    <span className="text-xs text-white font-mono truncate max-w-[80px]">{particle.text}</span>
                    <button 
                      onClick={() => handleRemoveInput(particle.id)}
                      className="text-white/50 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* FUSION ANIMATION PARTICLES (Explosion) */}
        {isFusing && (
          <>
            <motion.div 
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.2, delay: 1.4 }}
            />
            {/* Shockwaves */}
             <motion.div 
              className="absolute inset-0 rounded-full border-4 border-amber-400"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2], opacity: [1, 0] }}
              transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
            />
          </>
        )}

        {/* RESULT CARD (Post Fusion) */}
        <AnimatePresence>
          {fusionResult && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute z-50 w-[420px]"
            >
              <Card className="bg-black/95 border-amber-500/50 shadow-[0_0_100px_rgba(245,158,11,0.3)] overflow-hidden backdrop-blur-3xl w-full h-full flex flex-col">
                <div className="h-1 bg-gradient-to-r from-amber-400 via-white to-purple-500 animate-pulse shrink-0" />
                <div className="p-8 text-center relative flex-1 flex flex-col min-h-0">
                  
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

                  <div className="relative z-10 space-y-8">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                         <Sparkles className="w-8 h-8 text-amber-400" />
                      </div>
                      <h3 className="text-3xl font-bold text-white tracking-tight">
                        灵光一现
                      </h3>
                      <p className="text-xs text-amber-500/80 font-mono tracking-[0.3em] uppercase mt-2">
                        Epiphany Moment
                      </p>
                    </div>

                    <div className="py-6 border-y border-white/10 max-h-[400px] overflow-y-auto custom-scrollbar text-left">
                       <div className="flex flex-wrap justify-center gap-2 mb-4">
                          {inputs.map(i => (
                            <span key={i.id} className="text-xs px-2 py-1 rounded bg-white/10 text-zinc-300 border border-white/5">
                              {i.text}
                            </span>
                          ))}
                       </div>
                       <div className="text-sm text-zinc-400 leading-relaxed font-light whitespace-pre-wrap">
                         {fusionResult}
                       </div>
                    </div>

                    <div className="pt-2 grid grid-cols-3 gap-2">
                      <Button onClick={handleSaveNote} variant="outline" className="border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                      <Button onClick={handleImplement} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0">
                        <Rocket className="w-4 h-4 mr-2" />
                        实施
                      </Button>
                      <Button onClick={handlePublish} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0">
                        <Store className="w-4 h-4 mr-2" />
                        发布
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* --- CONTROLS --- */}
      <div className="relative z-20 w-full max-w-md space-y-4">
        
        {/* Input Bar */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-30 group-hover:opacity-75 blur transition duration-500" />
          <div className="relative flex items-center bg-black rounded-xl border border-white/10 p-1">
            <Hexagon className="ml-3 w-5 h-5 text-zinc-500" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isFusing || !!fusionResult}
              placeholder="输入概念 / 学科 / 灵感 (回车添加)..."
              className="border-0 bg-transparent text-white placeholder:text-zinc-600 focus-visible:ring-0"
            />
            <Button 
              size="icon" 
              onClick={handleAddInput}
              disabled={!inputValue.trim() || isFusing || !!fusionResult}
              className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-8 w-8 mr-1"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Fusion Button */}
        <Button
          onClick={handleFuse}
          disabled={inputs.length < 2 || isFusing || !!fusionResult}
          className={`
            w-full h-12 text-md font-bold tracking-widest uppercase transition-all duration-500
            ${inputs.length >= 2 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}
          `}
        >
          {isFusing ? (
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 animate-pulse" />
              Fusing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Atom className="w-4 h-4" />
              启动美帝奇反应堆
            </span>
          )}
        </Button>

        {/* Status / Guide */}
        <div className="flex justify-between items-center px-2 text-[10px] font-mono text-zinc-500 uppercase">
          <span>Reactor Status: {inputs.length > 0 ? 'Active' : 'Standby'}</span>
          <span>Particles: {inputs.length}/6</span>
        </div>

      </div>
    </div>
  )
}
