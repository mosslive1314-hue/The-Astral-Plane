'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { ResonanceEngine } from '@/components/resonance-engine'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export default function ResonancePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      setIsReady(true)
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isReady) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Navigation />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 pt-24 pb-12 w-full flex flex-col gap-8">
        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 min-h-[400px] -mt-16">
          <div className="text-center space-y-4 max-w-4xl relative">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-500/20 blur-[100px] rounded-full opacity-30 pointer-events-none" />
            
            <h1 className="relative text-8xl font-bold text-white tracking-tight pb-2 font-sans">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-purple-300 animate-gradient">
                灵波
              </span>
            </h1>
            <p className="relative text-xl text-zinc-300 font-light tracking-wide">
              广播灵感，在共振中迸发全新的灵光
            </p>
          </div>
          
          <ResonanceEngine />
        </div>
      </div>
    </div>
  )
}
