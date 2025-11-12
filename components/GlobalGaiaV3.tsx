"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, History, Plus } from 'lucide-react'
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

interface Conversation {
  id: string
  title: string
  updated_at: string
  message_count: number
}

export function GlobalGaiaV3() {
  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 监听来自知识点的打开请求
  useEffect(() => {
    const handleOpenWithQuestion = (event: CustomEvent) => {
      const { question } = event.detail
      setIsOpen(true)
      setInput(question)
      // 清空当前会话，开始新对话
      setMessages([])
      setCurrentConversationId(null)
    }

    window.addEventListener('openGaiaWithQuestion', handleOpenWithQuestion as EventListener)
    return () => {
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

  // 打开盖亚时，显示欢迎消息（新会话）
  useEffect(() => {
    if (isOpen && messages.length === 0 && !currentConversationId) {
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
  }, [isOpen])

  // 加载聊天记录列表
  const loadConversationHistory = async () => {
    try {
      const response = await fetch('/api/gaia/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  // 打开特定历史对话
  const openConversation = async (conversationId: string) => {
    try {
      const response = await fetch('/api/gaia/conversation-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setCurrentConversationId(conversationId)
        setShowHistory(false)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  // 开始新对话
  const startNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setShowHistory(false)
    setInput('')
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
              {/* 聊天记录按钮 */}
              <button
                onClick={() => {
                  setShowHistory(!showHistory)
                  if (!showHistory) loadConversationHistory()
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="聊天记录"
              >
                <History className="w-5 h-5 text-gray-400" />
              </button>

              {/* 新对话按钮 */}
              <button
                onClick={startNewConversation}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="新对话"
              >
                <Plus className="w-5 h-5 text-gray-400" />
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

          {/* 聊天记录面板 */}
          {showHistory && (
            <div className="absolute top-16 left-0 right-0 bottom-0 bg-gray-900 z-10 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">聊天记录</h3>
                {conversations.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    还没有聊天记录
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv.id)}
                        className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <div className="font-medium text-white mb-1">{conv.title}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(conv.updated_at).toLocaleString('zh-CN')} · {conv.message_count} 条消息
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 消息列表 */}
          {!showHistory && (
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
          )}
        </div>
      )}
    </>
  )
}
