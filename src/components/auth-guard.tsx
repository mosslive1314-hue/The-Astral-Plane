'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requireAuth = true, fallback }: AuthGuardProps) {
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  if (!_hasHydrated) {
    return fallback || null
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  return <>{children}</>
}
