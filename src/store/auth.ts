import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { OAuthTokens, UserInfo, Agent } from '@/types'

interface AuthState {
  tokens: OAuthTokens | null
  user: UserInfo | null
  agent: Agent | null
  shades: string[] // 存储用户分身数据
  isAuthenticated: boolean
  _hasHydrated: boolean // 添加初始化状态标记
  setTokens: (tokens: OAuthTokens) => void
  setUser: (user: UserInfo) => void
  setAgent: (agent: Agent) => void
  setShades: (shades: string[]) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      user: null,
      agent: null,
      shades: [],
      isAuthenticated: false,
      _hasHydrated: false,
      setTokens: (tokens) =>
        set({ tokens, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setAgent: (agent) => set({ agent }),
      setShades: (shades) => set({ shades }),
      logout: () =>
        set({ tokens: null, user: null, agent: null, shades: [], isAuthenticated: false }),
    }),
    {
      name: 'agentcraft-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state._hasHydrated = true
      },
    }
  )
)
