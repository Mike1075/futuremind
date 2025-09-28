'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageCircle, Trash2, ChevronRight } from 'lucide-react'
import GaiaAPI, { type ConversationSummary } from '@/lib/api/gaia'

interface ConversationManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectConversation: (conversationId: string) => void
  currentConversationId?: string
}

export default function ConversationManager({
  isOpen,
  onClose,
  onSelectConversation,
  currentConversationId
}: ConversationManagerProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 加载对话列表
  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const result = await GaiaAPI.getConversationList()
      if (result.success && result.data) {
        setConversations(result.data)
      } else {
        console.error('加载对话列表失败:', result.error)
      }
    } catch (error) {
      console.error('加载对话列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 创建新对话
  const createNewConversation = async () => {
    setIsCreating(true)
    try {
      const result = await GaiaAPI.createNewConversation()
      if (result.success && result.data) {
        await loadConversations() // 重新加载列表
        onSelectConversation(result.data.id) // 切换到新对话
        onClose() // 关闭管理器
      } else {
        console.error('创建新对话失败:', result.error)
      }
    } catch (error) {
      console.error('创建新对话失败:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // 删除对话
  const deleteConversation = async (conversationId: string) => {
    if (!confirm('确定要删除这个对话吗？')) return

    try {
      const result = await GaiaAPI.deleteConversation(conversationId)
      if (result.success) {
        await loadConversations() // 重新加载列表
        // 如果删除的是当前对话，切换到第一个对话
        if (conversationId === currentConversationId) {
          const remaining = conversations.filter(c => c.id !== conversationId)
          if (remaining.length > 0) {
            onSelectConversation(remaining[0].id)
          }
        }
      } else {
        console.error('删除对话失败:', result.error)
      }
    } catch (error) {
      console.error('删除对话失败:', error)
    }
  }

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  // 截取消息预览
  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message
    return message.slice(0, maxLength) + '...'
  }

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">对话管理</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 新建对话按钮 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={createNewConversation}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              {isCreating ? '创建中...' : '新建对话'}
            </button>
          </div>

          {/* 对话列表 */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                加载中...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>还没有任何对话</p>
                <p className="text-sm">点击上方按钮创建新对话</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group p-4 rounded-xl mb-2 cursor-pointer transition-colors ${
                      conversation.id === currentConversationId
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      onSelectConversation(conversation.id)
                      onClose()
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {conversation.title}
                          </h3>
                          {conversation.id === currentConversationId && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                              当前
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {truncateMessage(conversation.last_message)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {conversation.message_count} 条消息
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(conversation.updated_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conversation.id)
                          }}
                          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-all"
                          title="删除对话"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}