'use client'

import { Clock, Check, X, Building2, FolderOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Invitation {
  id: string
  invitation_type: 'organization' | 'project'
  target_name: string
  invitee_email: string
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

interface InvitationCardProps {
  invitation: Invitation
  onResponded?: () => void
  onDeleted?: (id: string) => void
}

export function InvitationCard({ invitation, onResponded, onDeleted }: InvitationCardProps) {
  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          invitation.invitation_type === 'organization'
            ? 'bg-blue-500/10 text-blue-500'
            : 'bg-green-500/10 text-green-500'
        }`}>
          {invitation.invitation_type === 'organization' ? (
            <Building2 className="h-5 w-5" />
          ) : (
            <FolderOpen className="h-5 w-5" />
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white">
            邀请 {invitation.invitee_email}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            加入{invitation.invitation_type === 'organization' ? '组织' : '项目'}: {invitation.target_name}
          </p>
          {invitation.message && (
            <p className="text-sm text-zinc-500 mt-2 p-2 bg-zinc-900/50 rounded">
              {invitation.message}
            </p>
          )}
          <p className="text-xs text-zinc-600 mt-2">
            {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true, locale: zhCN })}
          </p>
        </div>

        {/* 状态标识 */}
        <div className="flex-shrink-0">
          {invitation.status === 'pending' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              <Clock className="w-3 h-3" />
              等待回复
            </span>
          )}
          {invitation.status === 'accepted' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
              <Check className="w-3 h-3" />
              已接受
            </span>
          )}
          {invitation.status === 'rejected' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
              <X className="w-3 h-3" />
              已拒绝
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
