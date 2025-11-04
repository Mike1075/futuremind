'use client'

import { MessageSquare } from 'lucide-react'

interface DiscussionSectionProps {
  courseContentId: string
}

export function DiscussionSection({ courseContentId }: DiscussionSectionProps) {
  // TODO: Implement full discussion functionality with real-time updates
  // This will be developed in the next task

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
      <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">讨论区功能开发中</h3>
      <p className="text-gray-400 mb-4">
        即将上线：学员讨论、嵌套回复、点赞互动、实时更新等功能
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
        <span className="animate-pulse">●</span>
        功能开发中...
      </div>
    </div>
  )
}
