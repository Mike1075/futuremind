'use client'

import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/lib/aip/useUnreadCount'

interface NotificationBadgeProps {
  onClick?: () => void
}

export function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const { unreadCount, loading } = useUnreadCount()

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
      title={`通知${unreadCount > 0 ? ` (${unreadCount} 条未读)` : ''}`}
    >
      <Bell className="h-5 w-5" />

      {!loading && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </button>
  )
}
