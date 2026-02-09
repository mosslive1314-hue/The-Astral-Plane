'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Navigation } from '@/components/navigation'
import { MediciEffect } from '@/components/medici-effect'

export default function MediciPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            美帝奇效应实验室
          </h1>
          <p className="text-zinc-400">
            跨域技能组合，发现意想不到的创新突破
          </p>
        </div>
        <MediciEffect />
      </div>
    </div>
  )
}

import { Sparkles } from 'lucide-react'
