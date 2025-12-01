// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Check, X, Loader2, Mail, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface PendingRequest {
  id: string
  user_id: string | null
  message: string | null
  created_at: string | null
  user?: {
    id: string
    full_name: string | null
    email: string | null
  }
}

interface PendingRequestsPanelProps {
  organizationId?: string
  projectId?: string
  type: 'organization' | 'project'
}

export function PendingRequestsPanel({ organizationId, projectId, type }: PendingRequestsPanelProps) {
  const toast = useToast()
  const { confirm } = useConfirm()
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [organizationId, projectId])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      if (type === 'organization' && organizationId) {
        // 加载组织加入申请
        const { data: requestsData } = await supabase
          .from('organization_join_requests')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (requestsData) {
          // 获取每个申请的用户信息
          const userIds = requestsData.map(r => r.user_id).filter((id): id is string => id !== null)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)

          const requestsWithUsers = requestsData.map(request => ({
            ...request,
            user: profiles?.find(p => p.id === request.user_id)
          }))

          setRequests(requestsWithUsers)
        }
      } else if (type === 'project' && projectId) {
        // 加载项目加入申请
        const { data: requestsData } = await supabase
          .from('project_join_requests')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (requestsData) {
          // 获取每个申请的用户信息
          const userIds = requestsData.map(r => r.user_id).filter((id): id is string => id !== null)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)

          const requestsWithUsers = requestsData.map(request => ({
            ...request,
            user: profiles?.find(p => p.id === request.user_id)
          }))

          setRequests(requestsWithUsers)
        }
      }
    } catch (err) {
      console.error('加载申请列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string, userId: string | null) => {
    if (!userId) {
      toast.error('申请用户信息缺失')
      return
    }

    setProcessingId(requestId)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      if (type === 'organization' && organizationId) {
        // 1. 更新申请状态为已批准
        const { error: updateError } = await supabase
          .from('organization_join_requests')
          .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', requestId)

        if (updateError) throw updateError

        // 2. 将用户添加到组织成员
        const { error: memberError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: userId,
            organization_id: organizationId,
            role_in_org: 'member'
          })

        if (memberError) throw memberError

        // 3. 获取组织名称
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single()

        // 4. 发送通知给申请者
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'join_request',
          title: '组织加入申请已通过',
          message: `您加入组织「${org?.name || '未知组织'}」的申请已被批准，欢迎加入！`,
          is_read: false,
          metadata: {
            organization_id: organizationId,
            request_id: requestId,
            action: 'approved'
          }
        })

        toast.success('申请已批准，用户已加入组织')
      } else if (type === 'project' && projectId) {
        // 1. 更新申请状态为已批准
        const { error: updateError } = await supabase
          .from('project_join_requests')
          .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', requestId)

        if (updateError) throw updateError

        // 2. 将用户添加到项目成员
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            user_id: userId,
            project_id: projectId,
            role_in_project: 'member'
          })

        if (memberError) throw memberError

        // 3. 获取项目名称
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single()

        // 4. 发送通知给申请者
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'join_request',
          title: '项目加入申请已通过',
          message: `您加入项目「${project?.name || '未知项目'}」的申请已被批准，欢迎加入！`,
          is_read: false,
          metadata: {
            project_id: projectId,
            request_id: requestId,
            action: 'approved'
          }
        })

        toast.success('申请已批准，用户已加入项目')
      }

      // 重新加载申请列表
      await loadRequests()
    } catch (err) {
      console.error('批准申请失败:', err)
      toast.error('批准申请失败，请重试')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string, userId: string | null) => {
    if (!await confirm({ title: '确认拒绝', message: '确定要拒绝这个申请吗？', type: 'warning' })) return
    if (!userId) {
      toast.error('申请用户信息缺失')
      return
    }

    setProcessingId(requestId)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const tableName = type === 'organization'
        ? 'organization_join_requests'
        : 'project_join_requests'

      const { error } = await supabase
        .from(tableName)
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      // 发送通知给申请者
      if (type === 'organization' && organizationId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single()

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'join_request',
          title: '组织加入申请未通过',
          message: `很抱歉，您加入组织「${org?.name || '未知组织'}」的申请未被批准。`,
          is_read: false,
          metadata: {
            organization_id: organizationId,
            request_id: requestId,
            action: 'rejected'
          }
        })
      } else if (type === 'project' && projectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single()

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'join_request',
          title: '项目加入申请未通过',
          message: `很抱歉，您加入项目「${project?.name || '未知项目'}」的申请未被批准。`,
          is_read: false,
          metadata: {
            project_id: projectId,
            request_id: requestId,
            action: 'rejected'
          }
        })
      }

      toast.success('申请已拒绝')

      // 重新加载申请列表
      await loadRequests()
    } catch (err) {
      console.error('拒绝申请失败:', err)
      toast.error('拒绝申请失败，请重试')
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未知时间'
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-zinc-400">加载申请列表中...</span>
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return null // 没有待审核申请时不显示面板
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-400" />
          待审核申请
          <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-sm rounded-full">
            {requests.length}
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="border border-zinc-800 rounded-lg p-4 bg-zinc-800/50 hover:bg-zinc-800/70 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* 用户信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <UserPlus className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {request.user?.full_name || '未知用户'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{request.user?.email || '无邮箱'}</span>
                    </div>
                  </div>
                </div>

                {/* 申请理由 */}
                {request.message && (
                  <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-700">
                    <p className="text-sm text-zinc-300">{request.message}</p>
                  </div>
                )}

                {/* 申请时间 */}
                <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
                  <Calendar className="h-3 w-3" />
                  <span>申请时间：{formatDate(request.created_at)}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(request.id, request.user_id)}
                  disabled={processingId === request.id}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="批准"
                >
                  {processingId === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      批准
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(request.id, request.user_id)}
                  disabled={processingId === request.id}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="拒绝"
                >
                  {processingId === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      拒绝
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
