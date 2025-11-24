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

  // 监听GaiaDialog打开事件，自动关闭侧边栏
  useEffect(() => {
    const handleGaiaDialogOpened = () => {
      setIsOpen(false)
    }

    window.addEventListener('gaiaDialogOpened', handleGaiaDialogOpened)
    return () => {
      window.removeEventListener('gaiaDialogOpened', handleGaiaDialogOpened)
    }
  }, [])

  // 当侧边栏打开时，通知其他组件
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('globalGaiaOpened'))
    }
  }, [isOpen])

  // 监听来自知识点的打开请求
  useEffect(() => {

    const handleOpenWithQuestion = (event: CustomEvent) => {

      const { question } = event.detail


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
        return [...prev, knowledgePointMessage]
      })

    }

    window.addEventListener('openGaiaWithQuestion', handleOpenWithQuestion as EventListener)

    return () => {
      window.removeEventListener('openGaiaWithQuestion', handleOpenWithQuestion as EventListener)
    }
  }, [])

  // 监听滚动到历史讨论的请求
  useEffect(() => {
    const handleScrollToDiscussion = (event: Event) => {
      const customEvent = event as CustomEvent
      const { conversationId, messageIndex, totalMessages } = customEvent.detail

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
              setCollapsedAfterIndex(messageIndex + 10)
              setShowCollapsed(false)
            } else {
              setCollapsedAfterIndex(null)
            }

            // 等待DOM更新后滚动到指定消息
            setTimeout(() => {
              const targetRef = messageRefs.current[messageIndex]
              if (targetRef) {
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

    if (isOpen && messages.length === 0 && !isFromKnowledgePoint) {

      // 加载历史消息
      fetch('/api/gaia/recent-messages')
        .then(res => res.json())
        .then(data => {

          if (data.messages && data.messages.length > 0) {
            // 有消息，直接显示
            setMessages(data.messages)
            setCurrentConversationId(data.conversationId)
          } else if (data.conversationId === null) {
            // 完全没有对话记录，第一次使用，显示欢迎消息
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
            // 有对话ID但消息为空（用户删除了所有消息），不显示欢迎语
            setMessages([])
            setCurrentConversationId(data.conversationId)
          }
        })
        .catch(error => {
          console.error('[GlobalGaia] ❌ 加载历史消息失败:', error)
          // 失败时显示空白，不显示欢迎消息
          setMessages([])
        })
    } else {
    }
  }, [isOpen, isFromKnowledgePoint])

  // 当用户发送消息后，重置知识点标记（在handleSend中处理）

  // 重新加载当前对话的消息（用于同步）
  const reloadCurrentConversation = async () => {
    try {
      const response = await fetch('/api/gaia/recent-messages')
      const data = await response.json()

      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages)
        setCurrentConversationId(data.conversationId)
      }
    } catch (error) {
      console.error('[GlobalGaia] ❌ 重新加载消息失败:', error)
    }
  }

  // 监听来自其他组件的消息同步事件
  useEffect(() => {
    const handleMessagesSync = () => {
      reloadCurrentConversation()
    }

    window.addEventListener('gaiaMessagesUpdated', handleMessagesSync)
    return () => {
      window.removeEventListener('gaiaMessagesUpdated', handleMessagesSync)
    }
  }, [])

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


    // 检查最后一条消息是否是知识点问题
    const lastMessage = messages[messages.length - 1]
    const isReplyingToKnowledgePoint = lastMessage?.metadata?.source === 'knowledge_point'


    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 🔥 创建占位AI消息用于流式更新
    const assistantMessageIndex = messages.length + 1
    const placeholderMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, placeholderMessage])

    try {
      // 需要发送当前所有消息的情况：
      // 1. 第一次发送消息（包含欢迎语）
      // 2. 回复知识点问题（包含知识点问题+用户回答）
      const shouldSendCurrentMessages = messages.length <= 1 || isReplyingToKnowledgePoint

      if (isReplyingToKnowledgePoint) {
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

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // 🔥 流式读取响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let buffer = '' // 🔥 缓冲区，用于处理不完整的JSON
      let fullAnswer = ''  // 🔥 从后端接收到的完整内容
      let displayedAnswer = ''  // 🔥 已经显示在界面上的内容
      let lastFullAnswerLength = 0  // 🔥 记录上次接收到的完整内容长度，避免重复

      // 🔥 视觉缓冲队列：用于控制显示速度（复刻Seth项目）
      let pendingChunks: string[] = []
      let displayInterval: NodeJS.Timeout | null = null

      // 🔥 启动显示定时器（复刻Seth：每50ms显示3个字符）
      const startDisplayTimer = () => {
        if (displayInterval) return

        displayInterval = setInterval(() => {
          if (pendingChunks.length === 0) {
            // 没有待显示内容，但检查是否已经全部接收完成
            if (displayedAnswer === fullAnswer && fullAnswer.length > 0) {
              // 全部显示完成，清除定时器
              if (displayInterval) {
                clearInterval(displayInterval)
                displayInterval = null
              }
            }
            return
          }

          // 从队列中取出内容进行显示（每次显示3个字符，平衡速度和流畅度）
          const chunkToDisplay = pendingChunks.shift() || ''
          displayedAnswer += chunkToDisplay

          setMessages(prev => {
            const newMessages = [...prev]
            newMessages[assistantMessageIndex] = {
              role: 'assistant',
              content: displayedAnswer,
              timestamp: new Date().toISOString()
            }
            return newMessages
          })
        }, 50) // 每50ms更新一次显示（复刻Seth标准）
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // 🔥 简化处理：按换行符分割
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue

            // 🔥 尝试解析JSON，失败则跳过
            try {
              const json = JSON.parse(trimmedLine)

              if (json.type === 'chunk') {
                // 🔥 收到增量内容，添加到完整答案和待显示队列
                fullAnswer = json.content

                // 🔥 将新内容按字符分割加入队列（控制显示粒度）
                // 计算新增的部分（使用lastFullAnswerLength避免重复）
                const newContent = fullAnswer.slice(lastFullAnswerLength)
                lastFullAnswerLength = fullAnswer.length

                // 🔥 每次显示3个字符（复刻Seth标准，平衡速度和流畅度）
                for (let i = 0; i < newContent.length; i += 3) {
                  pendingChunks.push(newContent.slice(i, i + 3))
                }

                // 🔥 启动显示定时器
                startDisplayTimer()
              } else if (json.type === 'done') {
                if (json.conversationId && !currentConversationId) {
                  setCurrentConversationId(json.conversationId)
                }
              }
            } catch (parseError) {
              // 🔥 如果单行解析失败，尝试分离连接的JSON对象
              const jsonObjects: string[] = []
              let currentObj = ''
              let braceCount = 0
              let inString = false
              let escapeNext = false

              for (let i = 0; i < trimmedLine.length; i++) {
                const char = trimmedLine[i]
                if (escapeNext) {
                  currentObj += char
                  escapeNext = false
                  continue
                }
                if (char === '\\') {
                  currentObj += char
                  escapeNext = true
                  continue
                }
                if (char === '"') {
                  inString = !inString
                  currentObj += char
                  continue
                }
                if (!inString) {
                  if (char === '{') braceCount++
                  else if (char === '}') braceCount--
                }
                currentObj += char
                if (!inString && braceCount === 0 && currentObj.trim()) {
                  jsonObjects.push(currentObj.trim())
                  currentObj = ''
                }
              }

              for (const jsonStr of jsonObjects) {
                try {
                  const json = JSON.parse(jsonStr)
                  if (json.type === 'chunk') {
                    fullAnswer = json.content
                    const newContent = fullAnswer.slice(lastFullAnswerLength)
                    lastFullAnswerLength = fullAnswer.length

                    for (let i = 0; i < newContent.length; i += 3) {
                      pendingChunks.push(newContent.slice(i, i + 3))
                    }
                    startDisplayTimer()
                  } else if (json.type === 'done') {
                    if (json.conversationId && !currentConversationId) {
                      setCurrentConversationId(json.conversationId)
                    }
                  }
                } catch {
                  // 忽略无效JSON
                }
              }
            }
          }
        }

        // 🔥 处理缓冲区中剩余的数据
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer.trim())
            if (json.type === 'chunk') {
              fullAnswer = json.content
              const newContent = fullAnswer.slice(lastFullAnswerLength)
              lastFullAnswerLength = fullAnswer.length

              for (let i = 0; i < newContent.length; i += 3) {
                pendingChunks.push(newContent.slice(i, i + 3))
              }
              startDisplayTimer()
            } else if (json.type === 'done') {
              if (json.conversationId && !currentConversationId) {
                setCurrentConversationId(json.conversationId)
              }
            }
          } catch {
            // 忽略缓冲区中的无效JSON
          }
        }

        // 🔥 等待所有内容显示完成（复刻Seth项目）
        while (displayedAnswer !== fullAnswer) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } finally {
        if (displayInterval) {
          clearInterval(displayInterval)
        }
        reader.releaseLock()
      }

      // 🔥 如果没有收到任何内容，显示默认消息
      if (!fullAnswer) {
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: '抱歉，我现在无法回应。',
            timestamp: new Date().toISOString()
          }
          return newMessages
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      // 🔥 出错时更新占位消息为错误消息
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[assistantMessageIndex] = {
          role: 'assistant',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
          timestamp: new Date().toISOString()
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
      // 重置知识点标记
      if (isFromKnowledgePoint) {
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

  // 注：欢迎消息现在也可以被删除了

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

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedMessages.size === messages.length) {
      // 已全选，取消全选
      setSelectedMessages(new Set())
    } else {
      // 全选所有消息
      const allIndices = new Set<number>()
      messages.forEach((message, index) => {
        allIndices.add(index)
      })
      setSelectedMessages(allIndices)
    }
  }

  // 删除选中的消息
  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return

    if (!confirm(`确定要删除选中的 ${selectedMessages.size} 条消息吗？`)) return

    try {
      // 过滤掉选中的消息
      const newMessages = messages.filter((_, index) => !selectedMessages.has(index))
      setMessages(newMessages)
      setSelectedMessages(new Set())
      setIsEditMode(false)

      // 保存到数据库
      if (currentConversationId) {
        const supabase = createClient()

        // 将消息转换为可序列化的JSON格式
        const serializableMessages = newMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          isGaia: msg.isGaia,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        }))

        const { error } = await supabase
          .from('gaia_conversations')
          .update({
            messages: serializableMessages as any,
            message_count: newMessages.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentConversationId)

        if (error) {
          console.error('[GlobalGaia] 保存删除后的消息失败:', error)
        } else {
          // 触发同步事件，通知其他盖亚组件更新
          window.dispatchEvent(new CustomEvent('gaiaMessagesUpdated'))
        }
      }
    } catch (error) {
      console.error('[GlobalGaia] 删除消息失败:', error)
      alert('删除消息失败，请重试')
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
                      {/* 编辑模式下显示复选框（左侧-用户消息） */}
                      {isEditMode && isUserMessage(message) && (
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

                      {/* 编辑模式下显示复选框（右侧-AI消息） */}
                      {isEditMode && isAssistantMessage(message) && (
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
