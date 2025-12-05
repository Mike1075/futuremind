// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { X, User, Briefcase, Heart, FileText, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ViewProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  // 是否是邀请场景（邀请场景下，即使 profile_public=false 也可以查看）
  isInviteContext?: boolean
}

interface ProfileData {
  id: string
  full_name: string | null
  email: string | null
  age: number | null
  gender: string | null
  profession: string | null
  hobbies: string | null
  bio: string | null
  profile_public: boolean
  willing_to_join_projects: boolean
  consciousness_level: number
}

export default function ViewProfileModal({
  isOpen,
  onClose,
  userId,
  isInviteContext = false
}: ViewProfileModalProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile()
    }
  }, [isOpen, userId])

  const loadProfile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, email, age, gender, profession, hobbies, bio, profile_public, willing_to_join_projects, consciousness_level')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      setProfile(data)
    } catch (err) {
      console.error('加载用户资料失败:', err)
      setError('无法加载用户资料')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  // 判断是否可以查看资料
  // 1. 用户开启了 profile_public -> 可以查看
  // 2. 用户开启了 willing_to_join_projects 且是邀请场景 -> 可以查看
  const canViewProfile = profile && (
    profile.profile_public ||
    (isInviteContext && profile.willing_to_join_projects)
  )

  const getGenderText = (gender: string | null) => {
    switch (gender) {
      case 'male': return '男'
      case 'female': return '女'
      case 'other': return '其他'
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">用户资料</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
              <p className="text-gray-400 text-sm">加载中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400">{error}</p>
            </div>
          ) : !canViewProfile ? (
            // 用户不公开资料
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <EyeOff className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {profile?.full_name || '该用户'}
              </h3>
              <p className="text-gray-400 text-center">
                该用户选择不公开个人资料
              </p>
            </div>
          ) : (
            // 显示完整资料
            <div className="space-y-6">
              {/* 头像和基本信息 */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {/* 旋转光影层 */}
                  <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-spin-slow opacity-75 blur-[2px]"></div>
                  {/* 头像 */}
                  <div className="relative w-16 h-16 bg-black rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {(profile.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {profile.full_name || '未命名用户'}
                  </h3>
                  {/* 意识等级 */}
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/20 rounded-full">
                    <span className="text-xs text-purple-300">意识等级</span>
                    <span className="text-xs font-medium text-purple-400">Lv.{profile.consciousness_level || 1}</span>
                  </div>
                </div>
              </div>

              {/* 详细信息 */}
              <div className="space-y-4">
                {/* 职业 */}
                {profile.profession && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">职业</div>
                      <div className="text-white">{profile.profession}</div>
                    </div>
                  </div>
                )}

                {/* 爱好 */}
                {profile.hobbies && (
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">爱好</div>
                      <div className="text-white">{profile.hobbies}</div>
                    </div>
                  </div>
                )}

                {/* 个人简介 */}
                {profile.bio && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">个人简介</div>
                      <div className="text-white whitespace-pre-wrap">{profile.bio}</div>
                    </div>
                  </div>
                )}

                {/* 如果没有填写任何详细信息 */}
                {!profile.profession && !profile.hobbies && !profile.bio && (
                  <div className="text-center py-4 text-gray-500">
                    该用户暂未填写详细资料
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部关闭按钮 */}
        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full btn-stardust py-2.5"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
