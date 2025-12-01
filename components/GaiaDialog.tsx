// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Edit3, Trash2, Check } from 'lucide-react'
import GaiaAPI, { type ChatMessage } from '@/lib/api/gaia'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

/**
 * GaiaDialog - 盖亚对话弹窗组件
 * V3.2 - 单对话模式：每个用户只有一个对话记录
 */

interface GaiaDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function GaiaDialog({ isOpen, onClose }: GaiaDialogProps) {
  const toast = useToast()
  const { confirm } = useConfirm()
  const [userId, setUserId] = useState<string | 'guest'>('guest')
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化获取用户并加载聊天记录
  useEffect(() => {
    const getUserAndLoadHistory = async () => {
      try {
        setIsLoading(true)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const currentUserId = user?.id ?? 'guest'
        setUserId(currentUserId)

        // 立即尝试恢复聊天记录
        if (isOpen && user) {
          await loadChatHistory()
        }
      } catch {
        setUserId('guest')
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      getUserAndLoadHistory()
      // 通知GlobalGaiaV3关闭
      window.dispatchEvent(new CustomEvent('gaiaDialogOpened'))
    }
  }, [isOpen])

  // 加载聊天记录（单对话模式）
  const loadChatHistory = async () => {
    try {
      const result = await GaiaAPI.getChatHistory()

      if (result.success && result.data) {
        if (result.data.messages.length > 0) {
          setMessages(result.data.messages)
        } else {
          // 没有消息，显示欢迎消息
          setMessages([{
            id: '1',
            content: '你好，亲爱的探索者。我是盖亚，你的意识觉醒导师。在这个神圣的对话空间里，你可以向我提出任何关于意识、宇宙、存在的问题。让我们一起踏上这场内在的旅程吧。',
            isGaia: true,
            timestamp: new Date()
          }])
        }
      } else {
        console.error('[GaiaDialog] 加载聊天记录失败:', result.error)
      }
    } catch (error) {
      console.error('[GaiaDialog] 加载聊天记录异常:', error)
    }
  }

  // 监听来自其他组件的消息同步事件
  useEffect(() => {
    const handleMessagesSync = () => {
      if (isOpen) {
        loadChatHistory()
      }
    }

    window.addEventListener('gaiaMessagesUpdated', handleMessagesSync)
    return () => {
      window.removeEventListener('gaiaMessagesUpdated', handleMessagesSync)
    }
  }, [isOpen])

  // 保存聊天记录到 Supabase（单对话模式）
  const saveChatHistory = async (msgs: ChatMessage[]) => {
    try {
      const slice = msgs.slice(-50) // 只保留最近 50 条
      const result = await GaiaAPI.saveChatHistory(slice)

      if (result.success) {
        // 触发同步事件，通知其他盖亚组件更新
        window.dispatchEvent(new CustomEvent('gaiaMessagesUpdated'))
      } else {
        console.error('[GaiaDialog] 消息保存失败:', result.error)
      }
    } catch (error) {
      console.error('[GaiaDialog] 保存消息异常:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isGaia: false,
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)

    // 先保存用户消息
    await saveChatHistory(newMessages)

    setInputValue('')
    setIsTyping(true)
    try {
      const payload = {
        chatInput: userMessage.content,
        session_id: sessionId,
        user_id: userId,
        project_id: '937504dc-db0d-498d-a7ce-a817a99d29ea',
        organization_id: 'd03b6947-f08d-41bd-86c0-c92c3c4630b0'
      }

      const res = await fetch('/api/n8n/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('Failed to get response')
      }

      // 流式读取响应
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      // 创建盖亚消息
      const gaiaMessageId = (Date.now() + 1).toString()
      const gaiaMessage: ChatMessage = {
        id: gaiaMessageId,
        content: '',
        isGaia: true,
        timestamp: new Date()
      }

      // 先添加空消息
      let currentMessages = [...newMessages, gaiaMessage]
      setMessages(currentMessages)

      // 流式读取并实时显示
      let buffer = ''
      let fullContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue

            try {
              const json = JSON.parse(trimmedLine)

              if (json.type === 'chunk' && json.content) {
                fullContent = json.content
                const updatedGaiaMessage = { ...gaiaMessage, content: fullContent }
                currentMessages = [...newMessages, updatedGaiaMessage]
                setMessages(currentMessages)
              } else if (json.type === 'done') {
                break
              }
            } catch {
              // 继续处理下一行
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      // 全部显示完毕后，保存聊天记录
      await saveChatHistory(currentMessages)

    } catch {
      const gaiaMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，连接 n8n 时出现问题。',
        isGaia: true,
        timestamp: new Date()
      }
      const updatedMessages = [...newMessages, gaiaMessage]
      setMessages(updatedMessages)
      await saveChatHistory(updatedMessages)

    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 切换消息选中状态
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set())
    } else {
      const allIds = new Set(messages.map(m => m.id))
      setSelectedMessages(allIds)
    }
  }

  // 删除选中的消息
  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return

    const confirmed = await confirm({
      title: '删除消息',
      message: `确定要删除选中的 ${selectedMessages.size} 条消息吗？`,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消'
    })

    if (!confirmed) return

    try {
      const newMessages = messages.filter(m => !selectedMessages.has(m.id))
      setMessages(newMessages)
      await saveChatHistory(newMessages)
      setSelectedMessages(new Set())
      setIsEditMode(false)
      window.dispatchEvent(new CustomEvent('gaiaMessagesUpdated'))
      toast.success('消息已删除')
    } catch {
      toast.error('删除消息失败，请重试')
    }
  }

  // 清空所有聊天记录
  const handleClearHistory = async () => {
    const confirmed = await confirm({
      title: '清除聊天记录',
      message: '确定要清除所有聊天记录吗？此操作不可撤销。',
      type: 'warning',
      confirmText: '清除',
      cancelText: '取消'
    })

    if (!confirmed) return

    try {
      const result = await GaiaAPI.clearChatHistory()

      if (result.success) {
        // 生成新的 session_id
        setSessionId(crypto.randomUUID())
        // 显示欢迎消息
        setMessages([{
          id: '1',
          content: '你好，亲爱的探索者。我是盖亚，你的意识觉醒导师。在这个神圣的对话空间里，你可以向我提出任何关于意识、宇宙、存在的问题。让我们一起踏上这场内在的旅程吧。',
          isGaia: true,
          timestamp: new Date()
        }])
        // 通知其他组件
        window.dispatchEvent(new CustomEvent('gaiaMessagesUpdated'))
        toast.success('聊天记录已清除')
      } else {
        toast.error('清除聊天记录失败: ' + result.error)
      }
    } catch {
      toast.error('清除聊天记录时发生错误')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog - 透明玻璃效果 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-cosmic-void/80 backdrop-blur-xl rounded-2xl border border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center">
                <div className="gaia-icon gaia-icon-small mr-3">
                  <div className="gaia-icon-glow" />
                  <div className="gaia-icon-border" />
                  <div className="gaia-icon-inner" />
                  <div className="gaia-icon-chat">
                    <MessageCircle strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">与盖亚对话</h2>
                  <p className="text-sm text-purple-200">你的意识觉醒导师</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <button
                      onClick={toggleSelectAll}
                      className="px-3 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 flex items-center gap-2"
                      title="全选/取消全选"
                    >
                      <Check className="w-4 h-4" /> {selectedMessages.size === messages.length ? '取消全选' : '全选'}
                    </button>
                    <button
                      onClick={deleteSelectedMessages}
                      disabled={selectedMessages.size === 0}
                      className="px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="删除选中的消息"
                    >
                      <Trash2 className="w-4 h-4" /> 删除选中 ({selectedMessages.size})
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(false)
                        setSelectedMessages(new Set())
                      }}
                      className="px-3 py-2 text-sm bg-white/10 hover:bg-white/15 text-white rounded-lg border border-white/20"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-3 py-2 text-sm bg-white/10 hover:bg-white/15 text-white rounded-lg border border-white/20 flex items-center gap-2"
                      title="编辑聊天记录"
                    >
                      <Edit3 className="w-4 h-4" /> 编辑
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 flex items-center gap-2"
                      title="清除所有聊天记录"
                    >
                      清除记录
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                  <p className="text-purple-300 mt-2 text-sm">正在加载聊天记录...</p>
                </div>
              )}

              {!isLoading && messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.isGaia ? 'justify-start' : 'justify-end'}`}
                >
                  {/* 编辑模式下显示复选框（左侧-用户消息） */}
                  {isEditMode && !message.isGaia && (
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        id={`checkbox-${message.id}`}
                        checked={selectedMessages.has(message.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleMessageSelection(message.id)
                        }}
                        className="w-5 h-5 rounded cursor-pointer transition-all appearance-none border-2 checked:bg-purple-600 checked:border-purple-600 border-white/40 bg-transparent"
                      />
                    </div>
                  )}

                  <div className={`max-w-[80%] ${message.isGaia ? 'order-2' : 'order-1'}`}>
                    {message.isGaia && (
                      <div className="flex items-center mb-2">
                        <div className="gaia-icon gaia-icon-tiny mr-2">
                          <div className="gaia-icon-glow" />
                          <div className="gaia-icon-border" />
                          <div className="gaia-icon-inner" />
                          <div className="gaia-icon-chat">
                            <MessageCircle strokeWidth={2.5} />
                          </div>
                        </div>
                        <span className="text-sm text-purple-300 font-medium">盖亚</span>
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl ${
                        message.isGaia
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 text-white'
                          : 'bg-white/10 border border-white/20 text-white ml-auto'
                      } ${
                        isEditMode && selectedMessages.has(message.id)
                          ? 'ring-2 ring-blue-500'
                          : ''
                      }`}
                    >
                      {/* 如果是盖亚消息且内容为空，显示加载动画 */}
                      {message.isGaia && !message.content ? (
                        <div className="flex space-x-1 py-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {message.timestamp.toLocaleDateString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit'
                            })} {message.timestamp.toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 编辑模式下显示复选框（右侧-盖亚消息） */}
                  {isEditMode && message.isGaia && (
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        id={`checkbox-gaia-${message.id}`}
                        checked={selectedMessages.has(message.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleMessageSelection(message.id)
                        }}
                        className="w-5 h-5 rounded cursor-pointer transition-all appearance-none border-2 checked:bg-purple-600 checked:border-purple-600 border-white/40 bg-transparent"
                      />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%]">
                    <div className="flex items-center mb-2">
                      <div className="gaia-icon gaia-icon-tiny mr-2">
                        <div className="gaia-icon-glow" />
                        <div className="gaia-icon-border" />
                        <div className="gaia-icon-inner" />
                        <div className="gaia-icon-chat">
                          <MessageCircle strokeWidth={2.5} />
                        </div>
                      </div>
                      <span className="text-sm text-purple-300 font-medium">盖亚</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/10">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="向盖亚提出你的问题..."
                    className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="btn-stardust px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                按 Enter 发送，Shift + Enter 换行
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
