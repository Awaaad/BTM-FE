import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../api/auth'
import { setSessionExpiredHandler, tokenStore } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  /** True while the stored session is being validated on first load. */
  initializing: boolean
  /** identifier is a username or an email address. */
  login: (identifier: string, password: string) => Promise<void>
  register: (details: authApi.RegisterData) => Promise<void>
  logout: () => Promise<void>
  /** Refresh the cached user after a profile change. */
  setCurrentUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  // Validate any stored session on first load.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null))

    if (!tokenStore.getAccessToken() && !tokenStore.getRefreshToken()) {
      setInitializing(false)
      return
    }
    authApi
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        tokenStore.clear()
        setUser(null)
      })
      .finally(() => setInitializing(false))
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await authApi.login(identifier, password)
    setUser(data.user)
  }, [])

  const register = useCallback(async (details: authApi.RegisterData) => {
    const data = await authApi.register(details)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const setCurrentUser = useCallback((updated: User) => setUser(updated), [])

  const value = useMemo(
    () => ({ user, initializing, login, register, logout, setCurrentUser }),
    [user, initializing, login, register, logout, setCurrentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
