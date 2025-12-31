// @ts-nocheck
'use client'

import { memo } from 'react'
import { MessageCircle } from 'lucide-react'

interface GaiaFloatingButtonProps {
  onClick: () => void
}

/**
 * 盖亚浮动按钮组件
 * 显示在右下角，点击打开盖亚对话
 */
export const GaiaFloatingButton = memo(function GaiaFloatingButton({
  onClick
}: GaiaFloatingButtonProps) {
  return (
    <div
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 cursor-pointer hover:scale-110 transition-transform duration-300"
      aria-label="打开盖亚对话"
    >
      <div className="gaia-icon">
        <div className="gaia-icon-glow" />
        <div className="gaia-icon-border" />
        <div className="gaia-icon-inner" />
        <div className="gaia-icon-chat">
          <MessageCircle strokeWidth={2.5} />
        </div>
      </div>
    </div>
  )
})
