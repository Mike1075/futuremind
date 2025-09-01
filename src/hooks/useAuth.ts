'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { authClient } from '@/lib/auth'
import { ExtendedUserProfile, UserRole, hasPermission } from '@/types/auth'



export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // 获取初始用户状态
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { profile } = await authClient.getUserProfile(user.id)
        setProfile(profile)
      }
      
      setLoading(false)
    }

    getInitialUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { profile } = await authClient.getUserProfile(session.user.id)
          setProfile(profile)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await authClient.signIn(email, password)
    setLoading(false)
    return { error: error?.message || null }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'student') => {
    setLoading(true)
    
    // 首先注册用户
    const { error: signUpError } = await authClient.signUp(email, password, fullName)
    
    if (!signUpError) {
      // 注册成功后更新用户角色
      const { data: { user } } = await createClient().auth.getUser()
      if (user) {
        await authClient.updateUserProfile(user.id, { role })
      }
    }
    
    setLoading(false)
    return { error: signUpError?.message || null }
  }

  const signOut = async () => {
    setLoading(true)
    await authClient.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  const checkPermission = (resource: string, action: string) => {
    if (!profile) return false
    return hasPermission(profile.role, resource, action)
  }

  const isAdmin = () => profile?.role === 'admin'
  const isStudent = () => profile?.role === 'student'
  const isGuest = () => profile?.role === 'guest'

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission: checkPermission,
    isAdmin,
    isStudent,
    isGuest
  }
}


