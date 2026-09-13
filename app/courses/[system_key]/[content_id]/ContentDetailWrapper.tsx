// @ts-nocheck
'use client'

import { useState } from 'react'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'

interface ContentDetailWrapperProps {
  systemKey: string
  children: React.ReactNode
}

export function ContentDetailWrapper({ systemKey, children }: ContentDetailWrapperProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)

  return (
    <div className="min-h-screen text-white relative">
      {/* 半透明渐变覆盖层 - 让星空背景透出 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-cosmic-deep/50 to-mystic-purple/20 pointer-events-none" />

      {/* 统一导航栏 */}
      <UnifiedNavbar
        onOpenProfile={() => setShowProfileModal(true)}
        rightButton={{
          label: '返回课程',
          href: `/courses/${systemKey}`
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {children}
      </div>

      {/* 用户资料弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  )
}
