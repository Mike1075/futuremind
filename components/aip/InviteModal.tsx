'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Send, Building2, FolderOpen, Loader2, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, Project } from '@/lib/aip/types'

interface InviteModalProps {
  onClose: () => void
}

type InvitationType = 'organization' | 'project'

export function InviteModal({ onClose }: InviteModalProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [invitationType, setInvitationType] = useState<InvitationType>('organization')
  const [selectedTarget, setSelectedTarget] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 目标（去哪里）
  const [targetOrganizations, setTargetOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingTargets, setIsLoadingTargets] = useState(false)

  // 邀请谁：方式 + 源组织 + 成员
  const [inviteMethod, setInviteMethod] = useState<'member' | 'email'>('email')
  const [sourceOrganizations, setSourceOrganizations] = useState<Organization[]>([])
  const [selectedSourceOrg, setSelectedSourceOrg] = useState('')
  const [isLoadingSourceOrgs, setIsLoadingSourceOrgs] = useState(false)
  const [orgMembers, setOrgMembers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      setIsLoadingTargets(true)
      setIsLoadingSourceOrgs(true)

      try {
        // 获取用户管理的组织（可以邀请人的组织）
        const { data: userOrgs } = await supabase
          .from('user_organizations')
          .select('*, organization:organizations(*)')
          .eq('user_id', user.id)
          .in('role_in_org', ['owner', 'admin'])

        const managedOrgs = userOrgs?.map(uo => uo.organization).filter(Boolean) || []
        setTargetOrganizations(managedOrgs as Organization[])

        // 获取用户管理的项目
        const { data: projectMembers } = await supabase
          .from('project_members')
          .select('*, project:projects(*)')
          .eq('user_id', user.id)
          .eq('role_in_project', 'manager')

        const managedProjects = projectMembers?.map(pm => pm.project).filter(Boolean) || []
        setProjects(managedProjects as Project[])

        // 获取用户参与的所有组织（用于选择成员）
        const { data: allUserOrgs } = await supabase
          .from('user_organizations')
          .select('*, organization:organizations(*)')
          .eq('user_id', user.id)

        const allOrgs = allUserOrgs?.map(uo => uo.organization).filter(Boolean) || []
        setSourceOrganizations(allOrgs as Organization[])

        // 默认选择
        if (managedOrgs.length > 0) {
          setInvitationType('organization')
          setSelectedTarget(managedOrgs[0].id)
        } else if (managedProjects.length > 0) {
          setInvitationType('project')
          setSelectedTarget(managedProjects[0].id)
        }

        if (allOrgs.length > 0) {
          setSelectedSourceOrg(allOrgs[0].id)
        }
      } catch (err) {
        console.error('加载数据失败:', err)
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setIsLoadingTargets(false)
        setIsLoadingSourceOrgs(false)
      }
    }

    loadData()
  }, [])

  // 加载组织成员
  useEffect(() => {
    const loadMembers = async () => {
      if (inviteMethod !== 'member' || !selectedSourceOrg) {
        setOrgMembers([])
        setSelectedMemberId('')
        return
      }

      setIsLoadingMembers(true)
      try {
        const supabase = createClient()
        const { data: userOrgData } = await supabase
          .from('user_organizations')
          .select('user_id')
          .eq('organization_id', selectedSourceOrg)

        if (!userOrgData || userOrgData.length === 0) {
          setOrgMembers([])
          setSelectedMemberId('')
          setIsLoadingMembers(false)
          return
        }

        const userIds = userOrgData.map(uo => uo.user_id).filter(id => id !== userId)

        if (userIds.length === 0) {
          setOrgMembers([])
          setSelectedMemberId('')
          setIsLoadingMembers(false)
          return
        }

        // 获取这些用户的profile信息
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        const members = profilesData?.map(profile => ({
          id: profile.id,
          name: profile.full_name || '未命名用户',
          email: profile.email || ''
        })) || []

        setOrgMembers(members)
        setSelectedMemberId('')
      } catch (err) {
        console.error('加载成员失败:', err)
      } finally {
        setIsLoadingMembers(false)
      }
    }

    loadMembers()
  }, [inviteMethod, selectedSourceOrg, userId])

  // 切换邀请类型时重置目标
  useEffect(() => {
    if (invitationType === 'organization' && targetOrganizations.length > 0) {
      setSelectedTarget(targetOrganizations[0].id)
    } else if (invitationType === 'project' && projects.length > 0) {
      setSelectedTarget(projects[0].id)
    } else {
      setSelectedTarget('')
    }
  }, [invitationType, targetOrganizations, projects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userId) {
      setError('请先登录')
      return
    }

    if (!email.trim()) {
      setError(inviteMethod === 'member' ? '请选择成员' : '请输入邮箱地址')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('请输入有效的邮箱地址')
      return
    }

    if (!selectedTarget) {
      setError('请选择邀请的目标')
      return
    }

    const targetName = invitationType === 'organization'
      ? targetOrganizations.find(o => o.id === selectedTarget)?.name || ''
      : projects.find(p => p.id === selectedTarget)?.name || ''

    if (!targetName) {
      setError('无法获取目标名称')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          inviter_id: userId,
          invitee_email: email.trim(),
          invitation_type: invitationType,
          target_id: selectedTarget,
          target_name: targetName,
          message: message.trim() || null,
          status: 'pending'
        })

      if (inviteError) throw inviteError

      setIsSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      console.error('发送邀请失败:', err)
      setError(err instanceof Error ? err.message : '发送邀请失败')
    } finally {
      setIsLoading(false)
    }
  }

  const currentTargets = invitationType === 'organization' ? targetOrganizations : projects

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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-xl mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">发送邀请</h3>
              <p className="text-sm text-zinc-500">邀请成员加入组织或项目</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 邀请谁 */}
          <section>
            <h4 className="text-sm font-semibold text-white mb-3">邀请谁</h4>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setInviteMethod('email')}
                className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                  inviteMethod === 'email'
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                填写邮箱
              </button>
              <button
                type="button"
                onClick={() => setInviteMethod('member')}
                className={`flex-1 p-2 rounded-lg border text-sm transition-colors ${
                  inviteMethod === 'member'
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                从组织选择
              </button>
            </div>

            {inviteMethod === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1">
                  邮箱地址
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入被邀请者的邮箱"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">选择组织</label>
                  {isLoadingSourceOrgs ? (
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                    </div>
                  ) : sourceOrganizations.length === 0 ? (
                    <div className="text-zinc-500 text-sm">暂无可选组织</div>
                  ) : (
                    <select
                      value={selectedSourceOrg}
                      onChange={(e) => setSelectedSourceOrg(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      {sourceOrganizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">选择成员</label>
                  {isLoadingMembers ? (
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> 正在加载成员...
                    </div>
                  ) : orgMembers.length === 0 ? (
                    <div className="text-zinc-500 text-sm">暂无可邀请成员</div>
                  ) : (
                    <select
                      value={selectedMemberId}
                      onChange={(e) => {
                        const id = e.target.value
                        setSelectedMemberId(id)
                        const picked = orgMembers.find(m => m.id === id)
                        setEmail(picked?.email || '')
                      }}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                      <option value="">选择成员...</option>
                      {orgMembers.map(m => (
                        <option key={m.id} value={m.id}>{`${m.name} (${m.email})`}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 到哪里去 */}
          <section>
            <h4 className="text-sm font-semibold text-white mb-3">到哪里去</h4>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setInvitationType('organization')}
                disabled={targetOrganizations.length === 0 || isLoading}
                className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
                  invitationType === 'organization'
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                } ${targetOrganizations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Building2 className="h-4 w-4" /> 组织
              </button>
              <button
                type="button"
                onClick={() => setInvitationType('project')}
                disabled={projects.length === 0 || isLoading}
                className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
                  invitationType === 'project'
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                } ${projects.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FolderOpen className="h-4 w-4" /> 项目
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                选择{invitationType === 'organization' ? '组织' : '项目'}
              </label>
              {isLoadingTargets ? (
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                </div>
              ) : currentTargets.length === 0 ? (
                <div className="text-zinc-500 text-sm">
                  暂无可邀请的{invitationType === 'organization' ? '组织' : '项目'}
                </div>
              ) : (
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={isLoading}
                >
                  {currentTargets.map(target => (
                    <option key={target.id} value={target.id}>{target.name}</option>
                  ))}
                </select>
              )}
            </div>
          </section>

          {/* 邀请消息 */}
          <section>
            <label htmlFor="message" className="block text-sm font-medium text-zinc-300 mb-2">
              邀请消息 <span className="text-zinc-500 font-normal">(可选)</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入一些个人化的邀请消息..."
              rows={3}
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
              disabled={isLoading || currentTargets.length === 0}
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
    </div>
  )
}
