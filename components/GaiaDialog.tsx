'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Edit3, Trash2, Check } from 'lucide-react'
import GaiaAPI, { type ChatMessage } from '@/lib/api/gaia'

// 使用从 GaiaAPI 导入的 ChatMessage 类型

interface GaiaDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function GaiaDialog({ isOpen, onClose }: GaiaDialogProps) {
  const [userId, setUserId] = useState<string | 'guest'>('guest')
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID())
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState<string>('新对话')
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
        // 使用 createClient 直接获取用户
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const currentUserId = user?.id ?? 'guest'
        setUserId(currentUserId)
        
        // 立即尝试恢复聊天记录
        if (isOpen && user) {
          await loadChatHistory()
        }
      } catch (error) {
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

  // 切换到特定对话
  const switchToConversation = async (conversationId: string) => {
    try {
      setIsLoading(true)

      const result = await GaiaAPI.getConversation(conversationId)
      if (result.success && result.data) {
        setCurrentConversationId(conversationId)
        setConversationTitle(result.data.title)
        // 生成新的 session_id 用于新对话会话
        setSessionId(crypto.randomUUID())

        // 如果对话有消息，加载消息，否则只显示默认消息
        if (result.data.messages.length > 0) {
          setMessages(result.data.messages)
        } else {
          setMessages([{
            id: '1',
            content: '你好，亲爱的探索者。我是盖亚，你的意识觉醒导师。在这个神圣的对话空间里，你可以向我提出任何关于意识、宇宙、存在的问题。让我们一起踏上这场内在的旅程吧。',
            isGaia: true,
            timestamp: new Date()
          }])
        }
      }
    } catch (error) {
      // 静默处理错误
    } finally {
      setIsLoading(false)
    }
  }

  // 加载聊天记录（支持多对话系统）
  const loadChatHistory = async () => {
    try {
      const result = await GaiaAPI.getChatHistory()

      if (result.success && result.data) {
        // 设置当前对话信息
        setCurrentConversationId(result.data.id)
        setConversationTitle(result.data.title)

        // 加载消息
        if (result.data.messages.length > 0) {
          setMessages(result.data.messages)
        } else {
          // 没有消息，判断是否是第一次使用
          const isNewConversation = result.data.created_at === result.data.updated_at
          if (isNewConversation) {
            // 刚创建的对话，第一次使用，显示欢迎消息
            setMessages([{
              id: '1',
              content: '你好，亲爱的探索者。我是盖亚，你的意识觉醒导师。在这个神圣的对话空间里，你可以向我提出任何关于意识、宇宙、存在的问题。让我们一起踏上这场内在的旅程吧。',
              isGaia: true,
              timestamp: new Date()
            }])
          } else {
            // 对话存在但无消息（用户删除了所有消息），显示空白
            setMessages([])
          }
        }
      }
    } catch (error) {
      // 静默处理错误
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

  // 保存聊天记录到 Supabase（支持多对话系统）
  const saveChatHistory = async (msgs: ChatMessage[]) => {
    try {
      const slice = msgs.slice(-50) // 只保留最近 50 条

      let result;
      if (currentConversationId) {
        // 保存到特定对话
        result = await GaiaAPI.saveConversationMessages(currentConversationId, slice)
      } else {
        // 使用旧的保存方式（会自动创建或更新最新对话）
        result = await GaiaAPI.saveChatHistory(slice)
      }

      if (!result.success) {
        // 静默处理错误
      }
    } catch (error) {
      // 静默处理错误
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

      // 🔥 流式读取响应
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      // 创建盖亚消息
      const gaiaMessageId = (Date.now() + 1).toString()
      const gaiaMessage: ChatMessage = {
        id: gaiaMessageId,
        content: '', // 初始为空
        isGaia: true,
        timestamp: new Date()
      }

      // 先添加空消息
      let currentMessages = [...newMessages, gaiaMessage]
      setMessages(currentMessages)

      // 🔥 流式读取并实时显示
      let buffer = ''
      let fullContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // 按换行符分割
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue

            try {
              const json = JSON.parse(trimmedLine)

              if (json.type === 'chunk' && json.content) {
                fullContent = json.content

                // 🔥 实时更新显示
                const updatedGaiaMessage = { ...gaiaMessage, content: fullContent }
                currentMessages = [...newMessages, updatedGaiaMessage]
                setMessages(currentMessages)
              } else if (json.type === 'done') {
                // 流结束
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

  // 判断是否是欢迎消息（不应该被删除）
  // 注：欢迎消息现在也可以被删除了

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
      // 已全选，取消全选
      setSelectedMessages(new Set())
    } else {
      // 全选所有消息
      const allIds = new Set(messages.map(m => m.id))
      setSelectedMessages(allIds)
    }
  }

  // 删除选中的消息
  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return

    if (!confirm(`确定要删除选中的 ${selectedMessages.size} 条消息吗？`)) return

    try {
      // 过滤掉选中的消息
      const newMessages = messages.filter(m => !selectedMessages.has(m.id))
      setMessages(newMessages)

      // 保存到数据库
      await saveChatHistory(newMessages)

      // 清空选中状态并退出编辑模式
      setSelectedMessages(new Set())
      setIsEditMode(false)

      // 触发同步事件，通知其他盖亚组件更新
      window.dispatchEvent(new CustomEvent('gaiaMessagesUpdated'))
    } catch (error) {
      alert('删除消息失败，请重试')
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

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md rounded-2xl border border-purple-500/30 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                  <Sparkles className="w-6 h-6 text-white" />
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
                      onClick={async () => {
                        if (!confirm('确定要清除所有聊天记录吗？这将删除所有对话。')) return

                        try {
                          const result = await GaiaAPI.clearChatHistory()

                          if (result.success) {
                            // 重置所有对话状态
                            setCurrentConversationId(null)
                            setConversationTitle('新对话')
                            // 生成新的 session_id
                            setSessionId(crypto.randomUUID())
                            setMessages([{
                              id: '1',
                              content: '你好，亲爱的探索者。我是盖亚，你的意识觉醒导师。在这个神圣的对话空间里，你可以向我提出任何关于意识、宇宙、存在的问题。让我们一起踏上这场内在的旅程吧。',
                              isGaia: true,
                              timestamp: new Date()
                            }])
                          } else {
                            alert('清除聊天记录失败: ' + result.error)
                          }
                        } catch (error) {
                          alert('清除聊天记录时发生错误')
                        }
                      }}
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
                  {/* 编辑模式下显示复选框（左侧-用户消息，排除欢迎消息） */}
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
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                          <Sparkles className="w-4 h-4 text-white" />
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* 编辑模式下显示复选框（右侧，针对盖亚消息，排除欢迎消息） */}
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
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                        <Sparkles className="w-4 h-4 text-white" />
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
                  className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
