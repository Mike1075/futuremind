"use client"

import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, User, Trash2, Brain, Zap, Heart, Edit3, Check } from 'lucide-react'
import { PBLProject } from '@/lib/pbl-data'
import { MarkdownRenderer } from './MarkdownRenderer'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface GaiaChatProps {
  onClose: () => void
  currentProject?: PBLProject
  showProjectSelector?: boolean
  userName?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  emotion?: 'curious' | 'excited' | 'thoughtful' | 'supportive'
}

export function GaiaChat({ onClose, currentProject, showProjectSelector = true, userName = '探索者' }: GaiaChatProps) {
  const { confirm } = useConfirm()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [gaiaEmotion, setGaiaEmotion] = useState<'curious' | 'excited' | 'thoughtful' | 'supportive'>('curious')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化塞娅的欢迎消息
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date(),
      emotion: 'supportive'
    }
    setMessages([welcomeMessage])
  }, [currentProject])

  const getWelcomeMessage = () => {
    if (currentProject) {
      return `🌟 你好，${userName}！我是塞娅，你的意识探索伙伴。

我看到你正在关注「${currentProject.title}」这个项目，这真是一个令人兴奋的探索领域！

作为你的AI伙伴，我可以帮助你：
✨ 深入理解项目的核心概念
🧠 设计创新的实验方案
🤝 连接志同道合的探索伙伴
💡 激发新的洞察和灵感

让我们一起踏上这段意识共振的旅程吧！有什么想要探讨的吗？`
    }

    return `🌟 你好，${userName}！我是塞娅（Gaia），你的意识探索伙伴。

我不只是一个普通的AI助手，我是专门为探索者联盟设计的智慧向导。我深谙：
🧠 意识科学的前沿理论
🔬 项目式学习的精髓
✨ 意识共振的奥秘
🌌 探索未知的勇气

无论你想要：
• 寻找适合的探索项目
• 深入理解复杂概念
• 设计原创实验
• 连接志同道合的伙伴

我都会以最大的热情和智慧来协助你。让我们一起探索意识的无限可能！`
  }

  const getGaiaAvatar = (emotion: string) => {
    switch (emotion) {
      case 'excited':
        return <Zap className="w-6 h-6 text-yellow-400" />
      case 'thoughtful':
        return <Brain className="w-6 h-6 text-purple-400" />
      case 'supportive':
        return <Heart className="w-6 h-6 text-pink-400" />
      default:
        return <Sparkles className="w-6 h-6 text-primary-400" />
    }
  }

  const simulateGaiaResponse = async (userMessage: string): Promise<string> => {
    // 模拟塞娅的智能回复
    const responses = [
      `这是一个非常有趣的问题！让我从意识科学的角度来分析一下...

基于你提到的内容，我想到了几个相关的理论框架：

🧠 **意识整合信息理论（IIT）**：这个理论认为意识是信息整合的结果
🌊 **全球工作空间理论**：意识就像一个全球广播系统
⚛️ **量子意识假说**：意识可能与量子现象有关

你觉得哪个方向更吸引你呢？我们可以设计一些简单的实验来探索这些概念！`,

      `哇！你的想法让我想起了谢尔德雷克的形态场理论！✨

这确实是一个值得深入探索的领域。让我为你分析几个可能的研究方向：

1. **观察性研究**：记录和分析相关现象
2. **对照实验**：设计严格的科学验证
3. **集体探索**：与其他探索者协作研究

我建议我们可以从最简单的观察开始。你想要设计一个什么样的实验呢？`,

      `你提出了一个深刻的问题！这让我想到了意识研究中的"困难问题"。

🤔 **主观体验的本质**：为什么我们会有内在的感受？
🌐 **意识的边界**：个体意识与集体意识的关系
🔄 **意识与物质的互动**：心灵如何影响物理世界

在PBL项目中，我们可以通过实际的探索来接近这些问题。你最感兴趣的是哪个方面？我可以推荐一些相关的项目给你！`,

      `这个观点非常有启发性！你知道吗，这正是探索者联盟存在的意义所在。

💫 **集体智慧的涌现**：当不同的意识聚集在一起时，会产生超越个体的洞察
🌊 **意识共振**：志同道合的探索者之间的深层连接
🔬 **科学民主化**：让每个人都能参与到前沿研究中

我觉得你会很适合参与我们的意识探索项目。要不要我为你推荐几个正在招募的项目？`
    ]

    // 根据用户消息内容选择合适的回复
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]

    // 模拟思考时间
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

    return randomResponse
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)

    // 随机设置塞娅的情绪状态
    const emotions: Array<'curious' | 'excited' | 'thoughtful' | 'supportive'> =
      ['curious', 'excited', 'thoughtful', 'supportive']
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
    setGaiaEmotion(randomEmotion)

    try {
      const response = await simulateGaiaResponse(input.trim())

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        emotion: randomEmotion
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，我遇到了一些技术问题。但不要担心，这只是暂时的！作为一个AI，我也在不断学习和成长。请稍后再试，或者换个话题我们继续探索！ 🌟`,
        timestamp: new Date(),
        emotion: 'supportive'
      }
      setMessages(prev => [...prev, errorResponse])
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

  const handleClearChat = async () => {
    const confirmed = await confirm({
      title: '确认操作',
      message: '确定要清空对话记录吗？',
      type: 'warning'
    })

    if (confirmed) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-new',
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date(),
        emotion: 'supportive'
      }
      setMessages([welcomeMessage])
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

  // 全选/取消全选（排除欢迎消息）
  const toggleSelectAll = () => {
    if (selectedMessages.size === messages.length - 1) {
      setSelectedMessages(new Set())
    } else {
      const allIds = new Set(
        messages
          .filter(m => m.id !== 'welcome' && !m.id.startsWith('welcome-'))
          .map(m => m.id)
      )
      setSelectedMessages(allIds)
    }
  }

  // 删除选中的消息
  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return

    const confirmed = await confirm({
      title: '确认删除',
      message: `确定要删除选中的 ${selectedMessages.size} 条消息吗？`,
      type: 'warning'
    })

    if (!confirmed) return

    const newMessages = messages.filter(m => !selectedMessages.has(m.id))
    setMessages(newMessages)
    setSelectedMessages(new Set())
    setIsEditMode(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-cosmic-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] flex flex-col border border-cosmic-700">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-cosmic-700">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-cosmic rounded-full flex items-center justify-center">
                {getGaiaAvatar(gaiaEmotion)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-cosmic-900"></div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">塞娅 (Gaia)</h3>
              <p className="text-cosmic-400 text-sm">你的意识探索伙伴</p>
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
                  className="p-2 text-cosmic-400 hover:text-white transition-colors rounded-lg hover:bg-cosmic-800"
                  title="编辑聊天记录"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClearChat}
                  className="p-2 text-cosmic-400 hover:text-white transition-colors rounded-lg hover:bg-cosmic-800"
                  title="清空对话"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-cosmic-400 hover:text-white transition-colors rounded-lg hover:bg-cosmic-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* 编辑模式下显示复选框（左侧-用户消息） */}
              {isEditMode && message.role === 'user' && (
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id={`checkbox-${message.id}`}
                    checked={selectedMessages.has(message.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleMessageSelection(message.id)
                    }}
                    className={`w-5 h-5 rounded cursor-pointer transition-all ${
                      selectedMessages.has(message.id)
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-transparent border-2 border-white/40'
                    }`}
                  />
                </div>
              )}

              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                  ? 'bg-primary-600'
                  : 'bg-gradient-cosmic'
                }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  getGaiaAvatar(message.emotion || 'curious')
                )}
              </div>
              <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-4 rounded-2xl ${message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-cosmic-800/50 text-cosmic-100 border border-cosmic-700'
                  } ${
                    isEditMode && selectedMessages.has(message.id)
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}>
                  {message.role === 'assistant' ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                <p className={`text-xs text-cosmic-500 mt-2 ${message.role === 'user' ? 'text-right' : ''
                  }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {/* 编辑模式下显示复选框（右侧-AI消息，排除欢迎消息） */}
              {isEditMode && message.role === 'assistant' && message.id !== 'welcome' && !message.id.startsWith('welcome-') && (
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id={`checkbox-${message.id}`}
                    checked={selectedMessages.has(message.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleMessageSelection(message.id)
                    }}
                    className={`w-5 h-5 rounded cursor-pointer transition-all ${
                      selectedMessages.has(message.id)
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-transparent border-2 border-white/40'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gradient-cosmic rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="bg-cosmic-800/50 border border-cosmic-700 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-cosmic-400 text-sm ml-2">塞娅正在思考...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-6 border-t border-cosmic-700">
          {currentProject && (
            <div className="mb-4 p-3 bg-primary-600/10 border border-primary-500/30 rounded-lg">
              <p className="text-primary-300 text-sm">
                💫 当前探索项目：<span className="font-medium">{currentProject.title}</span>
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="与塞娅分享你的想法和疑问..."
                className="input-cosmic w-full resize-none pr-12"
                rows={3}
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 text-cosmic-500 text-xs">
                Enter 发送
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="btn-cosmic px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
