"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, History, Edit3, Check, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id?: string
  role?: 'user' | 'assistant'
  isGaia?: boolean  // 旧格式兼容
  content: string
  timestamp: string
  metadata?: {
    source?: string
    content_id?: string
  }
}

export function GlobalGaiaV3() {
  console.log('[GlobalGaia] 🚀 组件初始化/重新渲染')

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<(HTMLDivElement | null)[]>([])

  const [isFromKnowledgePoint, setIsFromKnowledgePoint] = useState(false)
  const [highlightedMessageIndex, setHighlightedMessageIndex] = useState<number | null>(null)
  const [collapsedAfterIndex, setCollapsedAfterIndex] = useState<number | null>(null)
  const [showCollapsed, setShowCollapsed] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set())

  console.log('[GlobalGaia] 当前状态:', {
    isOpen,
    messagesCount: messages.length,
    hasInput: !!input,
    isLoading,
    currentConversationId,
    isFromKnowledgePoint
  })

  // 监听来自知识点的打开请求
  useEffect(() => {
    console.log('[GlobalGaia] 🎯 useEffect执行：注册事件监听器')
    console.log('[GlobalGaia] window对象:', typeof window !== 'undefined' ? '存在' : '不存在')

    const handleOpenWithQuestion = (event: CustomEvent) => {
      console.log('[GlobalGaia] 🔔 收到事件 openGaiaWithQuestion')
      console.log('[GlobalGaia] Event对象:', event)
      console.log('[GlobalGaia] Event detail:', event.detail)

      const { question } = event.detail
      console.log('[GlobalGaia] 提取的问题:', question)

      console.log('[GlobalGaia] 新的处理逻辑:')
      console.log('  - 保留历史记录（不清空messages）')
      console.log('  - 将问题作为assistant消息添加到对话')
      console.log('  - 不预填输入框')
      console.log('  - 打开盖亚对话框')

      setIsFromKnowledgePoint(true)
      setIsOpen(true)

      // 将知识点问题作为盖亚的消息添加到对话中
      const knowledgePointMessage: Message = {
        role: 'assistant',
        content: question,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'knowledge_point' // 标记这是知识点问题
        }
      }

      setMessages(prev => {
        console.log('[GlobalGaia] 当前消息数:', prev.length)
        console.log('[GlobalGaia] 添加知识点问题到对话')
        return [...prev, knowledgePointMessage]
      })

      console.log('[GlobalGaia] ✅ 状态设置完成')
    }

    console.log('[GlobalGaia] 添加事件监听器...')
    window.addEventListener('openGaiaWithQuestion', handleOpenWithQuestion as EventListener)
    console.log('[GlobalGaia] ✅ 事件监听器已注册')

    return () => {
      console.log('[GlobalGaia] 🧹 清理事件监听器')
      window.removeEventListener('openGaiaWithQuestion', handleOpenWithQuestion as EventListener)
    }
  }, [])

  // 监听滚动到历史讨论的请求
  useEffect(() => {
    const handleScrollToDiscussion = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('[GlobalGaia] 📜 收到滚动到讨论事件')
      const { conversationId, messageIndex, totalMessages } = customEvent.detail
      console.log('  - conversationId:', conversationId)
      console.log('  - messageIndex:', messageIndex)
      console.log('  - totalMessages:', totalMessages)

      setIsOpen(true)

      // 异步加载对话
      const loadConversation = async () => {
        try {
          // 加载指定对话的所有消息
          const response = await fetch('/api/gaia/conversation-detail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId })
          })

          if (response.ok) {
            const data = await response.json()
            setMessages(data.messages || [])
            setCurrentConversationId(conversationId)

            // 设置高亮的消息
            setHighlightedMessageIndex(messageIndex)

            // 设置折叠点：如果messageIndex之后超过10条消息，则折叠
            const remainingMessages = totalMessages - messageIndex - 1
            if (remainingMessages > 10) {
              console.log('[GlobalGaia] 📦 设置折叠点:', messageIndex + 10)
              setCollapsedAfterIndex(messageIndex + 10)
              setShowCollapsed(false)
            } else {
              setCollapsedAfterIndex(null)
            }

            // 等待DOM更新后滚动到指定消息
            setTimeout(() => {
              const targetRef = messageRefs.current[messageIndex]
              if (targetRef) {
                console.log('[GlobalGaia] ✅ 滚动到消息', messageIndex)
                targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' })

                // 3秒后移除高亮
                setTimeout(() => {
                  setHighlightedMessageIndex(null)
                }, 3000)
              }
            }, 100)
          }
        } catch (error) {
          console.error('[GlobalGaia] ❌ 加载对话失败:', error)
        }
      }

      loadConversation()
    }

    window.addEventListener('scrollToDiscussion', handleScrollToDiscussion)
    return () => {
      window.removeEventListener('scrollToDiscussion', handleScrollToDiscussion)
    }
  }, [])

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 打开盖亚时，加载最近10条消息或显示欢迎语
  useEffect(() => {
    console.log('[GlobalGaia] 💬 打开盖亚useEffect触发')
    console.log('[GlobalGaia] 状态检查:')
    console.log('  - isOpen:', isOpen)
    console.log('  - messages.length:', messages.length)
    console.log('  - currentConversationId:', currentConversationId)
    console.log('  - isFromKnowledgePoint:', isFromKnowledgePoint)

    if (isOpen && messages.length === 0 && !isFromKnowledgePoint) {
      console.log('[GlobalGaia] 📥 加载最近的聊天记录...')

      // 加载最近的10条消息
      fetch('/api/gaia/recent-messages')
        .then(res => res.json())
        .then(data => {
          console.log('[GlobalGaia] 收到历史消息:', data)

          if (data.messages && data.messages.length > 0) {
            console.log('[GlobalGaia] ✅ 显示历史消息:', data.messages.length, '条')
            setMessages(data.messages)
            setCurrentConversationId(data.conversationId)
          } else {
            console.log('[GlobalGaia] ✅ 没有历史记录，显示欢迎消息')
            const welcomeMessage: Message = {
              role: 'assistant',
              content: `🌟 你好！我是盖亚（Gaia），你的AI学习伙伴。

我可以帮助你：
✨ 探索课程知识
🧠 深入理解概念
💡 激发新的思考
🤝 陪伴你的学习之旅

有什么想要探讨的吗？`,
              timestamp: new Date().toISOString()
            }
            setMessages([welcomeMessage])
          }
        })
        .catch(error => {
          console.error('[GlobalGaia] ❌ 加载历史消息失败:', error)
          // 失败时显示欢迎消息
          const welcomeMessage: Message = {
            role: 'assistant',
            content: `🌟 你好！我是盖亚（Gaia），你的AI学习伙伴。

我可以帮助你：
✨ 探索课程知识
🧠 深入理解概念
💡 激发新的思考
🤝 陪伴你的学习之旅

有什么想要探讨的吗？`,
            timestamp: new Date().toISOString()
          }
          setMessages([welcomeMessage])
        })
    } else {
      console.log('[GlobalGaia] ⏭️ 跳过加载历史（条件不满足）')
    }
  }, [isOpen, isFromKnowledgePoint])

  // 当用户发送消息后，重置知识点标记（在handleSend中处理）

  // 加载所有历史消息（合并所有对话）
  const loadAllHistoryMessages = async () => {
    try {
      const response = await fetch('/api/gaia/all-messages')
      if (response.ok) {
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          // 设置所有历史消息
          setMessages(data.messages)
          // 清空当前对话ID，因为显示的是所有对话的合并视图
          setCurrentConversationId(null)
        } else {
          // 没有历史记录
          alert('暂无历史记录')
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error)
      alert('加载历史记录失败')
    }
  }


  // 发送消息
  const handleSend = async () => {
    const messageText = input.trim()
    if (!messageText || isLoading) return

    console.log('[GlobalGaia] 📤 发送消息:', messageText)
    console.log('[GlobalGaia] 当前消息数:', messages.length)
    console.log('[GlobalGaia] conversationId:', currentConversationId)

    // 检查最后一条消息是否是知识点问题
    const lastMessage = messages[messages.length - 1]
    const isReplyingToKnowledgePoint = lastMessage?.metadata?.source === 'knowledge_point'

    console.log('[GlobalGaia] 最后一条消息:', lastMessage)
    console.log('[GlobalGaia] 是否回复知识点问题:', isReplyingToKnowledgePoint)

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 需要发送当前所有消息的情况：
      // 1. 第一次发送消息（包含欢迎语）
      // 2. 回复知识点问题（包含知识点问题+用户回答）
      const shouldSendCurrentMessages = messages.length <= 1 || isReplyingToKnowledgePoint

      console.log('[GlobalGaia] shouldSendCurrentMessages:', shouldSendCurrentMessages)
      if (isReplyingToKnowledgePoint) {
        console.log('[GlobalGaia] 💡 检测到回复知识点问题，将问题和回答一起发送')
      }

      const response = await fetch('/api/gaia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: currentConversationId,
          // 发送当前的所有消息（包括欢迎语或知识点问题），让API保存
          currentMessages: shouldSendCurrentMessages ? messages : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()

        if (data.conversationId && !currentConversationId) {
          setCurrentConversationId(data.conversationId)
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.reply || '抱歉，我现在无法回应。',
          timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // 重置知识点标记
      if (isFromKnowledgePoint) {
        console.log('[GlobalGaia] 🔄 重置知识点标记')
        setIsFromKnowledgePoint(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 判断消息是否是用户消息（兼容新旧格式）
  const isUserMessage = (message: Message) => {
    // 新格式：role === 'user'
    if (message.role === 'user') return true
    // 旧格式：isGaia === false
    if (message.isGaia === false) return true
    return false
  }

  // 判断消息是否是AI消息（兼容新旧格式）
  const isAssistantMessage = (message: Message) => {
    // 新格式：role === 'assistant'
    if (message.role === 'assistant') return true
    // 旧格式：isGaia === true
    if (message.isGaia === true) return true
    return false
  }

  // 切换消息选中状态
  const toggleMessageSelection = (index: number) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // 全选/取消全选（排除第一条欢迎消息）
  const toggleSelectAll = () => {
    // 找出第一条消息的索引（通常是0）
    const firstMessageIndex = 0
    const selectableCount = messages.length - 1 // 排除第一条

    if (selectedMessages.size === selectableCount) {
      // 已全选，取消全选
      setSelectedMessages(new Set())
    } else {
      // 全选（排除第一条欢迎消息）
      const allIndices = new Set<number>()
      messages.forEach((_, index) => {
        if (index !== firstMessageIndex) {
          allIndices.add(index)
        }
      })
      setSelectedMessages(allIndices)
    }
  }

  // 删除选中的消息
  const deleteSelectedMessages = () => {
    if (selectedMessages.size === 0) return

    if (!confirm(`确定要删除选中的 ${selectedMessages.size} 条消息吗？`)) return

    // 过滤掉选中的消息
    const newMessages = messages.filter((_, index) => !selectedMessages.has(index))
    setMessages(newMessages)
    setSelectedMessages(new Set())
    setIsEditMode(false)
  }

  return (
    <>
      {/* 浮动按钮 - 仅在对话框关闭时显示 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          aria-label="打开盖亚对话"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse"></div>
          <div className="relative z-10">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
        </button>
      )}

      {/* 侧边栏对话界面 */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[440px] bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-800">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl">
                🌌
              </div>
              <div>
                <h2 className="font-semibold text-white">盖亚 Gaia</h2>
                <p className="text-xs text-gray-400">你的AI学习伙伴</p>
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
                    <Check className="w-4 h-4" /> {selectedMessages.size === messages.length - 1 ? '取消全选' : '全选'}
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
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="编辑聊天记录"
                  >
                    <Edit3 className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={loadAllHistoryMessages}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="加载历史记录"
                  >
                    <History className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 消息列表 */}
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-black">
                {messages.map((message, index) => {
                  // 检查是否应该显示这条消息（折叠机制）
                  if (collapsedAfterIndex !== null && !showCollapsed) {
                    if (index > collapsedAfterIndex && index < messages.length - 1) {
                      // 这条消息被折叠了，跳过
                      return null
                    }
                  }

                  // 检查是否是高亮消息
                  const isHighlighted = highlightedMessageIndex === index

                  return (
                    <div
                      key={index}
                      ref={(el) => { messageRefs.current[index] = el }}
                      className={`flex gap-3 ${isUserMessage(message) ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* 编辑模式下显示复选框（左侧-用户消息，排除第一条） */}
                      {isEditMode && isUserMessage(message) && index !== 0 && (
                        <div className="flex items-center pt-2">
                          <input
                            type="checkbox"
                            id={`checkbox-user-${index}`}
                            checked={selectedMessages.has(index)}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleMessageSelection(index)
                            }}
                            className="w-5 h-5 rounded cursor-pointer transition-all appearance-none border-2 checked:bg-purple-600 checked:border-purple-600 border-white/40 bg-transparent"
                          />
                        </div>
                      )}

                      <div className={`max-w-[85%] ${
                        isUserMessage(message)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gray-800 text-gray-100 border border-gray-700'
                      } rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 ${
                        isHighlighted
                          ? 'ring-4 ring-yellow-400 ring-opacity-75 scale-105 animate-pulse'
                          : ''
                      } ${
                        isEditMode && selectedMessages.has(index)
                          ? 'ring-2 ring-blue-500'
                          : ''
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          isUserMessage(message) ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* 编辑模式下显示复选框（右侧-AI消息，排除第一条欢迎消息） */}
                      {isEditMode && isAssistantMessage(message) && index !== 0 && (
                        <div className="flex items-center pt-2">
                          <input
                            type="checkbox"
                            id={`checkbox-assistant-${index}`}
                            checked={selectedMessages.has(index)}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleMessageSelection(index)
                            }}
                            className="w-5 h-5 rounded cursor-pointer transition-all appearance-none border-2 checked:bg-purple-600 checked:border-purple-600 border-white/40 bg-transparent"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* 折叠按钮 */}
                {collapsedAfterIndex !== null && !showCollapsed && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={() => setShowCollapsed(true)}
                      className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm border border-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span>展开更多聊天记录</span>
                      <span className="text-xs text-gray-500">
                        ({messages.length - collapsedAfterIndex - 2} 条)
                      </span>
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 输入框 */}
              <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入你的问题..."
                    rows={3}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">按 Enter 发送，Shift + Enter 换行</p>
              </div>
            </>
        </div>
      )}
    </>
  )
}
