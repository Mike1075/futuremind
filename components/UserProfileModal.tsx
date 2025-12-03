// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { X, User, Briefcase, Heart, FileText, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [profession, setProfession] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [bio, setBio] = useState('')
  const [willingToJoinProjects, setWillingToJoinProjects] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'extended' | 'password'>('basic')

  const supabase = createClient()

  // 加载用户信息
  useEffect(() => {
    if (isOpen) {
      loadUserProfile()
    }
  }, [isOpen])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        setNickname(user.user_metadata?.full_name || user.user_metadata?.nickname || '')

        // 从 profiles 表加载扩展信息
        const { data: profile } = await supabase
          .from('profiles')
          .select('age, gender, profession, hobbies, bio, willing_to_join_projects')
          .eq('id', user.id)
          .single()

        if (profile) {
          setAge(profile.age?.toString() || '')
          setGender(profile.gender || '')
          setProfession(profile.profession || '')
          setHobbies(profile.hobbies || '')
          setBio(profile.bio || '')
          setWillingToJoinProjects(profile.willing_to_join_projects || false)
        }
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('未找到用户信息')
      }

      // 1. 更新姓名到 auth.users
      if (nickname.trim()) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: { full_name: nickname.trim() }
        })
        if (authUpdateError) throw authUpdateError
      }

      // 2. 更新 profiles 表（包括所有扩展字段）
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: nickname.trim() || null,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          profession: profession || null,
          hobbies: hobbies || null,
          bio: bio || null,
          willing_to_join_projects: willingToJoinProjects
        })
        .eq('id', user.id)

      if (profileUpdateError) throw profileUpdateError

      // 3. 更新密码（如果填写了新密码）
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: '两次输入的密码不一致' })
          setIsSaving(false)
          return
        }
        if (newPassword.length < 6) {
          setMessage({ type: 'error', text: '密码长度至少为6位' })
          setIsSaving(false)
          return
        }
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })
        if (passwordError) throw passwordError
      }

      setMessage({ type: 'success', text: '保存成功！' })
      window.dispatchEvent(new CustomEvent('userProfileUpdated'))

      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error('保存失败:', error)
      setMessage({ type: 'error', text: error.message || '保存失败，请重试' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">个人资料</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            基本信息
          </button>
          <button
            onClick={() => setActiveTab('extended')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'extended'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            扩展资料
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            修改密码
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
          {/* 基本信息 */}
          {activeTab === 'basic' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入您的姓名"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    年龄
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="可选"
                    min="1"
                    max="150"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    性别
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">不公开</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* 扩展资料 */}
          {activeTab === 'extended' && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Briefcase className="w-4 h-4" />
                  职业
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="例如：学生、工程师、设计师..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Heart className="w-4 h-4" />
                  爱好
                </label>
                <input
                  type="text"
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                  placeholder="例如：阅读、编程、音乐..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <FileText className="w-4 h-4" />
                  个人简介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="介绍一下自己吧..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* 愿意参与项目开关 */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">愿意参与各种项目</div>
                      <div className="text-sm text-gray-400">
                        开启后，其他人在邀请成员时可以看到你
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWillingToJoinProjects(!willingToJoinProjects)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      willingToJoinProjects ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        willingToJoinProjects ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 修改密码 */}
          {activeTab === 'password' && (
            <>
              <p className="text-sm text-gray-400 mb-4">
                如果不需要修改密码，请留空
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少6位"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </>
          )}

          {/* 提示消息 */}
          {message && (
            <div className={`px-4 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* 底部保存按钮 */}
        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full btn-stardust py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  )
}
