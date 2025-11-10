'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordInteraction, type ItemType } from '@/lib/utils/interaction-tracker'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface GaiaSidebarProps {
  isOpen: boolean
  onClose: () => void
  initialContext?: {
    text: string
    type: 'knowledge_point' | 'question'
    contentId: string
    itemIndex: number
    itemType: ItemType
  }
}

export function GaiaSidebar({ isOpen, onClose, initialContext }: GaiaSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [discussionId, setDiscussionId] = useState<string | null>(null)
  const [topic, setTopic] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 当提供初始上下文时，加载历史对话或发送欢迎消息
  useEffect(() => {
    if (initialContext && isOpen) {
      loadDiscussionHistory()
    }
  }, [initialContext?.text, initialContext?.type, isOpen])

  const loadDiscussionHistory = async () => {
    if (!initialContext) return

    // 清空当前消息（切换到新的知识点）
    setMessages([])
    setDiscussionId(null)
    setTopic('')
    setIsLoading(true)

    try {
      // 1. 提炼主题
      const topicResponse = await fetch('/api/gaia/extract-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: initialContext.text })
      })

      // 默认使用完整文本，最多100字符
      let extractedTopic = initialContext.text.length > 100
        ? initialContext.text.substring(0, 100) + '...'
        : initialContext.text

      if (topicResponse.ok) {
        const topicData = await topicResponse.json()
        extractedTopic = topicData.topic || extractedTopic
      }
      setTopic(extractedTopic)

      // 2. 尝试从数据库加载历史对话
      const response = await fetch('/api/n8n/gaia-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: initialContext.contentId,
          knowledgePointText: initialContext.text,
          discussionType: initialContext.type
        })
      })

      if (response.ok) {
        const data = await response.json()

        if (data.discussion && data.messages && data.messages.length > 0) {
          // 有历史对话，加载历史消息
          setDiscussionId(data.discussion.id)
          const historyMessages: Message[] = data.messages.map((msg: any, index: number) => ({
            id: `${Date.now()}-${index}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }))
          setMessages(historyMessages)
        } else {
          // 3. 没有历史对话，生成启发性问题
          console.log('[Gaia] 生成启发性问题...', { topic: extractedTopic, originalText: initialContext.text })

          // 调用Supabase边缘函数（已配置OPENAI_API_KEY）
          const supabase = createClient()

          // 获取当前用户ID
          const { data: { user } } = await supabase.auth.getUser()

          const { data: questionsData, error: questionsError } = await supabase.functions.invoke('generate-inspiring-questions', {
            body: {
              topic: extractedTopic,
              originalText: initialContext.text,
              userId: user?.id || null,
              contentId: initialContext.contentId
            }
          })

          let inspiringQuestions = '让我们一起深入探讨这个话题吧！'
          if (!questionsError && questionsData) {
            inspiringQuestions = questionsData.questions || inspiringQuestions
            console.log('[Gaia] AI生成问题成功:', inspiringQuestions.substring(0, 50) + '...')
          } else {
            console.error('[Gaia] 生成问题失败:', questionsError)
          }

          // 4. 将启发性问题作为盖亚的首次消息
          const gaiaMessage: Message = {
            id: `gaia-${Date.now()}`,
            role: 'assistant',
            content: inspiringQuestions,
            timestamp: new Date()
          }
          setMessages([gaiaMessage])

          // 5. 记录讨论开始（Level 2/3）
          await recordInteraction({
            contentId: initialContext.contentId,
            interactionType: 'discussion_start',
            itemIndex: initialContext.itemIndex,
            itemType: initialContext.itemType
          })

          // 6. 保存到数据库（通过一次API调用完成讨论创建和消息保存）
          // 这里我们只是展示消息，实际的数据库保存会在用户首次回复时进行
        }
      }
    } catch (error) {
      console.error('Failed to load discussion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (message?: string) => {
    const textToSend = message || inputValue.trim()
    if (!textToSend || !initialContext) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // 记录讨论消息（Level 3 - 深度对话计数）
    await recordInteraction({
      contentId: initialContext.contentId,
      interactionType: 'discussion_message',
      itemIndex: initialContext.itemIndex,
      itemType: initialContext.itemType
    })

    try {
      // 如果是首次发送消息且有AI生成的启发性问题，先保存那条消息
      const isFirstUserMessage = !discussionId && messages.length === 1 && messages[0].role === 'assistant'

      // 调用新的Gaia Chat API
      const requestBody = {
        message: textToSend,
        contentId: initialContext.contentId,
        knowledgePointText: initialContext.text,
        discussionType: initialContext.type,
        // 如果是首次消息，传递AI的启发性问题
        firstAssistantMessage: isFirstUserMessage ? messages[0].content : undefined
      }

      console.log('📤 [GaiaSidebar] 发送请求到 /api/n8n/gaia-chat:', requestBody)

      const response = await fetch('/api/n8n/gaia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()

        console.log('📥 [GaiaSidebar] 收到API响应:', data)

        if (data.debug) {
          console.log('🐛 [DEBUG] 课程隔离信息:', {
            contentId: data.debug.contentId,
            systemId: data.debug.systemId,
            systemKey: data.debug.systemKey,
            projectId: data.debug.projectId,
            '期望projectId': 'p004 (欢迎来到地球)'
          })
        }

        // 保存discussion ID
        if (data.discussionId) {
          setDiscussionId(data.discussionId)
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || '抱歉，我现在无法回应。',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        console.error('❌ [GaiaSidebar] API请求失败:', response.status, response.statusText)
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Gaia chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl">
      {/* 头部 */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-xl">
              🌌
            </div>
            <div>
              <h2 className="font-semibold text-white">盖亚 Gaia</h2>
              <p className="text-xs text-gray-400">你的学习伙伴</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 主题标题 */}
        {topic && (
          <div className="px-6 pb-3">
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 text-xs">探讨主题：</span>
              <div className="text-purple-300 font-medium text-sm leading-relaxed break-words overflow-wrap-anywhere">
                {topic}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-5xl mb-4">🌌</div>
            <p className="text-lg font-medium text-white mb-2">欢迎来到盖亚的探索空间</p>
            <p className="text-sm">我会通过提问引导你深入思考</p>
            <p className="text-xs mt-2 text-gray-600">而不是直接告诉你答案</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${
              message.role === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-gray-800 text-gray-100'
            } rounded-lg px-4 py-3`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题..."
            rows={3}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">按 Enter 发送，Shift + Enter 换行</p>
      </div>
    </div>
  )
}
