'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Send, FolderOpen, Loader2, Check, AlertCircle, Users, Eye, Briefcase, Heart, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/lib/aip/types'

interface InviteModalProps {
  onClose: () => void
  projectId?: string // 如果传入，默认选中该项目
}

interface WillingUser {
  id: string
  full_name: string | null
  email: string | null
  profession: string | null
  hobbies: string | null
  bio: string | null
}

export function InviteModal({ onClose, projectId }: InviteModalProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [selectedProject, setSelectedProject] = useState(projectId || '')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 可邀请的项目
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)

  // 愿意参与项目的用户列表
  const [willingUsers, setWillingUsers] = useState<WillingUser[]>([])
  const [isLoadingWillingUsers, setIsLoadingWillingUsers] = useState(false)

  // 用户资料预览
  const [previewUser, setPreviewUser] = useState<WillingUser | null>(null)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      setIsLoadingProjects(true)
      setIsLoadingWillingUsers(true)

      try {
        // 获取用户管理的项目（owner和manager都可以邀请人）
        const { data: projectMembers } = await supabase
          .from('project_members')
          .select('*, project:projects(*)')
          .eq('user_id', user.id)
          .in('role_in_project', ['owner', 'manager'])

        const managedProjects = projectMembers?.map(pm => pm.project).filter(Boolean) || []
        setProjects(managedProjects as Project[])

        // 默认选择传入的项目或第一个
        if (projectId && managedProjects.some(p => p.id === projectId)) {
          setSelectedProject(projectId)
        } else if (managedProjects.length > 0) {
          setSelectedProject(managedProjects[0].id)
        }

        // 获取愿意参与项目的用户（排除当前用户）
        const { data: willingUsersData } = await supabase
          .from('profiles')
          .select('id, full_name, email, profession, hobbies, bio')
          .eq('willing_to_join_projects', true)
          .neq('id', user.id)

        setWillingUsers(willingUsersData || [])
      } catch (err) {
        console.error('加载数据失败:', err)
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setIsLoadingProjects(false)
        setIsLoadingWillingUsers(false)
      }
    }

    loadData()
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userId) {
      setError('请先登录')
      return
    }

    if (!email.trim()) {
      setError('请输入邮箱地址或选择用户')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('请输入有效的邮箱地址')
      return
    }

    if (!selectedProject) {
      setError('请选择邀请的项目')
      return
    }

    const targetProject = projects.find(p => p.id === selectedProject)
    if (!targetProject) {
      setError('无法获取项目信息')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      // 1. 查找被邀请者的用户ID（如果已注册）
      const { data: inviteeProfile, error: inviteeQueryError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle()

      if (inviteeQueryError) {
        throw new Error(`查询被邀请者信息失败：${inviteeQueryError.message}`)
      }

      const inviteeId = inviteeProfile?.id || null

      // 2. 创建邀请记录
      const { data: invitationData, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          inviter_id: userId,
          invitee_email: email.trim(),
          invitee_id: inviteeId || null,
          invitation_type: 'project',
          target_id: selectedProject,
          target_name: targetProject.name,
          message: message.trim() || null,
          status: 'pending'
        })
        .select()
        .single()

      if (inviteError) {
        throw new Error(`创建邀请失败：${inviteError.message}`)
      }

      // 3. 创建发送者的通知记录
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'invitation_sent',
          title: '邀请已发送',
          message: `您已向 ${email.trim()} 发送加入项目"${targetProject.name}"的邀请`,
          metadata: {
            invitation_id: invitationData.id,
            invitation_type: 'project',
            target_id: selectedProject,
            target_name: targetProject.name
          }
        })

      // 4. 如果被邀请者已注册，创建接收者的通知记录
      if (inviteeId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: inviteeId,
            type: 'invitation_received',
            title: '收到邀请',
            message: `您收到了加入项目"${targetProject.name}"的邀请`,
            metadata: {
              invitation_id: invitationData.id,
              invitation_type: 'project',
              target_id: selectedProject,
              target_name: targetProject.name,
              inviter_id: userId
            }
          })
      }

      setIsSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      console.error('发送邀请失败:', err)
      setError(err instanceof Error ? err.message : '发送邀请失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 选择愿意参与的用户
  const handleSelectWillingUser = (user: WillingUser) => {
    if (user.email) {
      setEmail(user.email)
    }
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">邀请发送成功！</h3>
            <p className="text-zinc-400">邀请已发送到 {email}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">邀请成员</h3>
              <p className="text-sm text-zinc-500">邀请成员加入项目</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* 选择项目 */}
          <section>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
              <FolderOpen className="h-4 w-4" /> 选择项目
            </label>
            {isLoadingProjects ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-zinc-500 text-sm">暂无可邀请的项目</div>
            ) : (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={isLoading}
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            )}
          </section>

          {/* 邮箱地址 */}
          <section>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
              <Mail className="h-4 w-4" /> 邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入被邀请者的邮箱"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              disabled={isLoading}
            />
          </section>

          {/* 愿意参与项目的用户 */}
          <section>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
              <Users className="h-4 w-4" /> 愿意参与项目的用户
            </label>
            {isLoadingWillingUsers ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
              </div>
            ) : willingUsers.length === 0 ? (
              <div className="text-zinc-500 text-sm bg-zinc-800/50 rounded-lg p-3">
                暂无愿意参与项目的用户
              </div>
            ) : (
              <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 max-h-40 overflow-y-auto">
                {willingUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-zinc-700/50 border-b border-zinc-700/50 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {user.full_name || '未命名用户'}
                      </div>
                      <div className="text-zinc-400 text-sm truncate">
                        {user.email || '无邮箱'}
                      </div>
                      {user.profession && (
                        <div className="text-zinc-500 text-xs truncate mt-0.5">
                          {user.profession}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        type="button"
                        onClick={() => setPreviewUser(user)}
                        className="p-1.5 hover:bg-zinc-600 rounded text-zinc-400 hover:text-white transition-colors"
                        title="查看资料"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectWillingUser(user)}
                        disabled={!user.email}
                        className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded border border-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        选择
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 邀请消息 */}
          <section>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              邀请消息 <span className="text-zinc-500 font-normal">(可选)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入一些个人化的邀请消息..."
              rows={2}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              disabled={isLoading}
            />
          </section>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || projects.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 发送中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> 发送邀请
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 用户资料预览弹窗 */}
      {previewUser && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setPreviewUser(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
              <h4 className="text-white font-semibold">用户资料</h4>
              <button
                onClick={() => setPreviewUser(null)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* 基本信息 */}
              <div>
                <div className="text-lg font-semibold text-white">
                  {previewUser.full_name || '未命名用户'}
                </div>
                <div className="text-zinc-400 text-sm">
                  {previewUser.email || '无邮箱'}
                </div>
              </div>

              {/* 职业 */}
              {previewUser.profession && (
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">职业</div>
                    <div className="text-zinc-300 text-sm">{previewUser.profession}</div>
                  </div>
                </div>
              )}

              {/* 爱好 */}
              {previewUser.hobbies && (
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">爱好</div>
                    <div className="text-zinc-300 text-sm">{previewUser.hobbies}</div>
                  </div>
                </div>
              )}

              {/* 简介 */}
              {previewUser.bio && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-zinc-500 mb-0.5">个人简介</div>
                    <div className="text-zinc-300 text-sm">{previewUser.bio}</div>
                  </div>
                </div>
              )}

              {/* 无额外信息 */}
              {!previewUser.profession && !previewUser.hobbies && !previewUser.bio && (
                <div className="text-zinc-500 text-sm text-center py-2">
                  该用户暂未填写详细资料
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  handleSelectWillingUser(previewUser)
                  setPreviewUser(null)
                }}
                disabled={!previewUser.email}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                选择该用户
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
