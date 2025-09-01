'use client'

import { createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { ExtendedUserProfile, UserRole } from '@/types/auth'
import { useAuthState } from '@/hooks/useAuth'

interface AuthContextType {
  user: User | null
  profile: ExtendedUserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  hasPermission: (resource: string, action: string) => boolean
  isAdmin: () => boolean
  isStudent: () => boolean
  isGuest: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuthState()

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  )
}
