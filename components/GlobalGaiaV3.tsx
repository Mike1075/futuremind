"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
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

  const [isFromKnowledgePoint, setIsFromKnowledgePoint] = useState(false)

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

      console.log('[GlobalGaia] 设置状态:')
      console.log('  - isFromKnowledgePoint: true')
      console.log('  - isOpen: true')
      console.log('  - input:', question)
      console.log('  - messages: []')
      console.log('  - currentConversationId: null')

      setIsFromKnowledgePoint(true)
      setIsOpen(true)
      setInput(question)
      // 清空当前会话，开始新对话
      setMessages([])
      setCurrentConversationId(null)

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

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 打开盖亚时，显示欢迎消息（新会话）- 但不包括从知识点触发的情况
  useEffect(() => {
    console.log('[GlobalGaia] 💬 欢迎消息useEffect触发')
    console.log('[GlobalGaia] 状态检查:')
    console.log('  - isOpen:', isOpen)
    console.log('  - messages.length:', messages.length)
    console.log('  - currentConversationId:', currentConversationId)
    console.log('  - isFromKnowledgePoint:', isFromKnowledgePoint)

    if (isOpen && messages.length === 0 && !currentConversationId && !isFromKnowledgePoint) {
      console.log('[GlobalGaia] ✅ 显示欢迎消息')
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
    } else {
      console.log('[GlobalGaia] ⏭️ 跳过欢迎消息（条件不满足）')
    }
  }, [isOpen, isFromKnowledgePoint, messages.length, currentConversationId])

  // 当用户开始输入或发送消息后，重置知识点标记
  useEffect(() => {
    if (messages.length > 0 && isFromKnowledgePoint) {
      setIsFromKnowledgePoint(false)
    }
  }, [messages, isFromKnowledgePoint])

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

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/gaia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: currentConversationId
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
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
              {/* 聊天记录按钮 - 加载所有历史消息 */}
              <button
                onClick={loadAllHistoryMessages}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="加载历史记录"
              >
                <History className="w-5 h-5 text-gray-400" />
              </button>

              {/* 关闭按钮 */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* 消息列表 */}
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-black">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                    } rounded-2xl px-4 py-3 shadow-sm`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}

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
