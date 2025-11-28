'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  iconColor?: string
  bgColor: string
  borderColor: string
  children: React.ReactNode
  defaultOpen?: boolean
}

/**
 * 可折叠的课程内容区域组件
 *
 * 特性：
 * - 点击标题展开/收起内容
 * - 平滑动画过渡
 * - 自定义图标和颜色
 * - 悬停时显示炫彩边框效果
 * - 响应式设计
 */
export function CollapsibleSection({
  title,
  icon,
  iconColor,
  bgColor,
  borderColor,
  children,
  defaultOpen = false
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="mb-6">
      {/* 标题栏 - 使用炫彩边框wrapper */}
      <div className="collapsible-section-wrapper rounded-t-xl group/collapsible">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`collapsible-section-inner w-full flex items-center justify-between p-4 rounded-t-xl ${bgColor} transition-all duration-200`}
          style={{ '--section-border-color': borderColor.replace('border-', '') } as React.CSSProperties}
        >
          <div className="flex items-center gap-3">
            {/* 图标 - 仅在提供时显示 */}
            {icon && (
              <div className={`${iconColor} group-hover/collapsible:scale-110 transition-transform duration-200`}>
                {icon}
              </div>
            )}

            {/* 标题 */}
            <h2 className="text-h3 font-semibold text-starlight">
              {title}
            </h2>
          </div>

          {/* 展开/收起图标 */}
          <div className="text-starlight-muted group-hover/collapsible:text-starlight transition-colors">
            {isOpen ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>
      </div>

      {/* 内容区域 - 带动画和炫彩边框 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="collapsible-content-wrapper rounded-b-xl">
          <div className={`collapsible-content-inner ${bgColor} rounded-b-xl p-6`}>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
