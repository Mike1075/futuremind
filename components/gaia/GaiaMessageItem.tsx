// @ts-nocheck
'use client'

import { memo } from 'react'
import { MessageCircle } from 'lucide-react'

interface Message {
  id?: string
  role?: 'user' | 'assistant'
  isGaia?: boolean
  content: string
  timestamp: string
  metadata?: {
    source?: string
    content_id?: string
  }
}

interface GaiaMessageItemProps {
  message: Message
  index: number
  isHighlighted: boolean
  isEditMode: boolean
  isSelected: boolean
  isLoading: boolean
  showGaiaHeader: boolean
  onToggleSelection: (index: number) => void
  messageRef: (el: HTMLDivElement | null) => void
}

// 判断消息是否是用户消息（兼容新旧格式）
const isUserMessage = (message: Message) => {
  if (message.role) {
    return message.role === 'user'
  }
  if (message.isGaia === false) return true
  return false
}

// 判断消息是否是AI消息（兼容新旧格式）
const isAssistantMessage = (message: Message) => {
  if (message.role) {
    return message.role === 'assistant'
  }
  if (message.isGaia === true) return true
  return false
}

/**
 * 单条消息渲染组件
 * 支持用户/AI消息、编辑模式选择、高亮显示
 */
export const GaiaMessageItem = memo(function GaiaMessageItem({
  message,
  index,
  isHighlighted,
  isEditMode,
  isSelected,
  isLoading,
  showGaiaHeader,
  onToggleSelection,
  messageRef
}: GaiaMessageItemProps) {
  const isUser = isUserMessage(message)
  const isAssistant = isAssistantMessage(message)

  return (
    <div
      ref={messageRef}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      {/* 盖亚头部：只在第一条 AI 消息或前一条是用户消息时显示 */}
      {showGaiaHeader && (
        <div className="flex items-center gap-2 mb-1">
          <div className="gaia-icon gaia-icon-tiny">
            <div className="gaia-icon-glow" />
            <div className="gaia-icon-border" />
            <div className="gaia-icon-inner" />
            <div className="gaia-icon-chat">
              <MessageCircle strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-sm text-gray-400">盖亚</span>
        </div>
      )}

      {/* 消息行：包含复选框和消息气泡 */}
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
        {/* 编辑模式下显示复选框（左侧-用户消息） */}
        {isEditMode && isUser && (
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id={`checkbox-user-${index}`}
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onToggleSelection(index)
              }}
              className="gaia-checkbox"
            />
          </div>
        )}

        <div className={`max-w-[85%] ${
          isUser
            ? 'bg-indigo-500/20 text-white border border-indigo-400/30'
            : 'bg-white/5 text-gray-100 border border-white/10'
        } rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 ${
          isHighlighted
            ? 'ring-4 ring-yellow-400 ring-opacity-75 scale-105 animate-pulse'
            : ''
        } ${
          isEditMode && isSelected
            ? 'ring-2 ring-blue-500'
            : ''
        }`}>
          {/* 如果是占位消息（正在加载的AI回复），显示加载动画 */}
          {isAssistant && message.content === '' && isLoading ? (
            <div className="flex gap-2 py-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${
                isUser ? 'text-purple-100' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleDateString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit'
                })} {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </>
          )}
        </div>

        {/* 编辑模式下显示复选框（右侧-AI消息） */}
        {isEditMode && isAssistant && (
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id={`checkbox-assistant-${index}`}
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onToggleSelection(index)
              }}
              className="gaia-checkbox"
            />
          </div>
        )}
      </div>
    </div>
  )
})

// 导出辅助函数供父组件使用
export { isUserMessage, isAssistantMessage }
