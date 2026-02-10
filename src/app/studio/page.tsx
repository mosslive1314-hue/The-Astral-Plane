'use client'

import { Navigation } from '@/components/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Brain, Hammer } from 'lucide-react'
import { MediciLab } from '@/components/medici/medici-lab'
import { NotesPanel } from '@/components/notes/notes-panel'
import { SkillCreatorPanel } from '@/components/skill/skill-creator-panel'

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navigation />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 pt-4 w-full flex flex-col min-h-0">
        
        {/* Intro Text (Compact) */}
        <div className="mb-2 text-center">
           <p className="text-zinc-400 text-sm max-w-4xl mx-auto leading-relaxed">
             <span className="text-white font-semibold">灵境</span> —— 您的私人创新实验室。在此利用美地奇实验室融合不同的灵感创造出新的方案，管理心智资产 (Mind Assets)，创造独有技能 (Skill Creation)。
           </p>
        </div>

        <Tabs defaultValue="medici" className="w-full h-full flex flex-col space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 border border-white/10 p-1 h-12 shrink-0">
            <TabsTrigger value="medici" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400">
              <Sparkles className="w-4 h-4 mr-2" />
              美帝奇实验室 (Medici)
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-zinc-400">
              <Brain className="w-4 h-4 mr-2" />
              心智资产 (Mind Assets)
            </TabsTrigger>
            <TabsTrigger value="skill" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-zinc-400">
              <Hammer className="w-4 h-4 mr-2" />
              创造独有技能 (Skill Creation)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medici" className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full h-full">
              <MediciLab />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <NotesPanel />
          </TabsContent>

          <TabsContent value="skill" className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SkillCreatorPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
