'use client'

import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/lib/aip/useUnreadCount'

interface NotificationBadgeProps {
  onClick?: () => void
}

export function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const { totalCount, unreadCount, pendingRequestCount, loading } = useUnreadCount()

  // 构建提示文本
  const getTitleText = () => {
    if (totalCount === 0) return '通知'
    const parts = []
    if (unreadCount > 0) parts.push(`${unreadCount} 条未读`)
    if (pendingRequestCount > 0) parts.push(`${pendingRequestCount} 个待审核`)
    return `通知 (${parts.join(', ')})`
  }

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
      title={getTitleText()}
    >
      <Bell className="h-5 w-5" />

      {!loading && totalCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        </div>
      )}
    </button>
  )
}
