// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bot, X, Send, Trash2, Check, FolderOpen, Building2, Loader2, History, Edit3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import type { Organization, Project } from '@/lib/aip/types'
import aipChatAPI from '@/lib/api/aip-chat'
import { playNotificationSound, isNotificationSoundEnabled } from '@/lib/utils/notificationSound'

interface FloatingChatBotProps {
  organization?: Organization
  currentProject?: Project
  showProjectSelector?: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function FloatingChatBot({
  organization,
  currentProject,
  showProjectSelector = true
}: FloatingChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [showProjectPanel, setShowProjectPanel] = useState(true) // 默认显示项目面板
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastOpenTime = useRef<number>(0) // 🔥 记录上次打开时间，用于判断是否需要重新加载

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 初始化时预选当前项目
  useEffect(() => {
    if (currentProject) {
      console.log('[FloatingChatBot] 自动勾选项目:', currentProject.id, currentProject.name)
      setSelectedProjects([currentProject.id])
    }
  }, [currentProject])

  // 生成欢迎消息
  const getWelcomeMessage = useCallback(() => {
    if (currentProject && organization) {
      return `🚀 探索者你好！我看到你正在探索「${currentProject.name}」项目（${organization.name}组织）。

让我们一起：
✨ 深入挖掘项目的创新潜力
🧠 设计独特的研究方案
🤝 连接志同道合的探索伙伴
💡 突破思维边界，做真正创新的事情

有什么想探讨的吗？`
    } else if (organization) {
      return `🚀 探索者你好！当前已为您选择了「${organization.name}」组织。

在探索者联盟，我们鼓励你：
🌟 创建属于自己的原创PBL项目
🔬 探索未知的边界
🤝 与伙伴协作，共同突破

选择一个项目开始探索，或告诉我你想创建什么样的项目！`
    }
    return `🚀 欢迎来到探索者联盟！我是您的AI探索伙伴。

这里是属于你的创新天地：
🌟 **创建原创项目** - 把你的奇思妙想变成真实的探索
🔬 **探索未知边界** - 突破常规，做真正创新的事情
🤝 **协作共创** - 与志同道合的伙伴一起成长
💡 **项目式学习** - 在实践中获得真知

告诉我，你想创建什么样的项目？或者需要我帮你找到合适的探索方向？`
  }, [currentProject, organization])

  // 合并：加载用户项目和聊天历史（每次打开时执行）
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const now = Date.now()

    const initializeChatBot = async () => {
      // 并行加载项目列表和聊天历史
      setIsLoadingProjects(true)

      // 🔥 修复：每次打开对话框时都重新加载历史（如果距离上次打开超过 30 秒）
      const timeSinceLastOpen = now - lastOpenTime.current
      const shouldLoadHistory = lastOpenTime.current === 0 || timeSinceLastOpen > 30000 // 首次打开或超过30秒

      if (shouldLoadHistory) {
        setIsLoadingHistory(true)
        lastOpenTime.current = now
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !isMounted) return

        // 加载项目列表
        const projectsResult = await supabase
          .from('project_members')
          .select('*, project:projects(*)')
          .eq('user_id', user.id)

        if (!isMounted) return

        // 处理项目数据
        const projects = projectsResult.data?.map(pm => pm.project).filter(Boolean) || []
        setUserProjects(projects as Project[])

        // 只在需要时加载聊天历史（避免覆盖当前会话）
        if (shouldLoadHistory) {
          const historyResult = await aipChatAPI.loadChatHistory()

          if (!isMounted) return

          // 处理聊天历史
          if (historyResult.success && historyResult.data) {
            if (historyResult.data.messages.length > 0) {
              setMessages(historyResult.data.messages)
            } else {
              setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: getWelcomeMessage(),
                timestamp: new Date()
              }])
            }
          }
        }
      } catch (error) {
        console.error('初始化聊天机器人失败:', error)
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false)
          setIsLoadingHistory(false)
        }
      }
    }

    initializeChatBot()

    // Cleanup防止内存泄漏
    return () => {
      isMounted = false
    }
  }, [isOpen, getWelcomeMessage]) // 🔥 移除 messages.length 依赖，避免不必要的重新加载

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      // 构建project_id参数（完全尊重用户的勾选选择）
      console.log('[FloatingChatBot] 发送消息时 selectedProjects:', selectedProjects, 'currentProject:', currentProject?.id)
      const projectIdValue = selectedProjects.length === 1 ? selectedProjects[0] : selectedProjects

      // 获取organization_id：多层兜底逻辑
      let organizationId = ''

      // 1. 优先使用传入的organization参数
      if (organization?.id) {
        organizationId = organization.id
      }

      // 2. 如果选择了项目，从项目中提取organization_id
      if (!organizationId && selectedProjects.length > 0) {
        const firstSelectedProject = userProjects.find(p => p.id === selectedProjects[0])
        organizationId = firstSelectedProject?.organization_id || ''
      }

      // 3. 如果还是没有，使用用户的第一个项目所属的组织
      if (!organizationId && userProjects.length > 0) {
        organizationId = userProjects[0].organization_id || ''
      }

      // 4. 最终兜底：使用默认组织ID（确保不选项目时也能聊天）
      if (!organizationId) {
        organizationId = 'd03b6947-f08d-41bd-86c0-c92c3c4630b0'
      }

      // 构建请求参数
      const requestBody: Record<string, any> = {
        chatInput: userMessage.content,
        organization_id: organizationId
      }

      // 🔥 只有当用户勾选了项目时才传 project_id
      if (selectedProjects.length > 0) {
        requestBody.project_id = projectIdValue
      }

      // 调用流式API
      console.log('[FloatingChatBot] 🚀 发送请求:', JSON.stringify(requestBody, null, 2))

      const response = await fetch('/api/aip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      // 🔥 详细日志：打印响应信息
      console.log('[FloatingChatBot] 📥 响应状态:', response.status, response.statusText)
      console.log('[FloatingChatBot] 📥 响应头:', Object.fromEntries(response.headers.entries()))
      console.log('[FloatingChatBot] 📥 响应类型:', response.type)
      console.log('[FloatingChatBot] 📥 响应URL:', response.url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[FloatingChatBot] ❌ 错误响应体:', errorText)
        throw new Error('AI响应失败')
      }

      // 🔥 流式读取响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      // 创建一个AI消息占位符
      const assistantMessageId = (Date.now() + 1).toString()
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }])

      let buffer = ''
      let fullAnswer = ''
      let displayedAnswer = ''
      let lastFullAnswerLength = 0

      // 🔥 视觉缓冲队列：用于控制显示速度（复刻Seth项目）
      let pendingChunks: string[] = []
      let displayInterval: ReturnType<typeof setInterval> | null = null

      // 🔥 启动显示定时器（每50ms显示3个字符，实现打字机效果）
      const startDisplayTimer = () => {
        if (displayInterval) return

        displayInterval = setInterval(() => {
          if (pendingChunks.length === 0) {
            if (displayedAnswer === fullAnswer && fullAnswer.length > 0) {
              if (displayInterval) {
                clearInterval(displayInterval)
                displayInterval = null
              }
            }
            return
          }

          // 从队列中取出内容进行显示（每次显示3个字符）
          const chunkToDisplay = pendingChunks.shift() || ''
          displayedAnswer += chunkToDisplay

          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            if (lastIndex >= 0 && newMessages[lastIndex].id === assistantMessageId) {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: displayedAnswer
              }
            }
            return newMessages
          })
        }, 50) // 每50ms更新一次显示
      }

      let chunkCount = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          chunkCount++

          console.log(`[FloatingChatBot] 📦 Chunk #${chunkCount}: done=${done}, valueLength=${value?.length || 0}`)

          if (done) {
            console.log('[FloatingChatBot] ✅ Stream done, buffer remaining:', buffer, 'Total chunks:', chunkCount)
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // 🔥 调试日志：显示收到的原始数据（完整显示）
          console.log(`[FloatingChatBot] 📦 Chunk #${chunkCount} 原始数据:`, chunk)

          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          console.log('[FloatingChatBot] Lines to process:', lines.length, 'Buffer remaining:', buffer.length)

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue

            // 🔥 调试日志：显示解析的每一行
            console.log('[FloatingChatBot] Parsing line:', trimmedLine.substring(0, 100))

            try {
              const json = JSON.parse(trimmedLine)
              console.log('[FloatingChatBot] Parsed JSON:', json.type, json.content?.substring(0, 50))

              if (json.type === 'chunk') {
                fullAnswer = json.content

                // 🔥 将新增内容按字符分割加入队列
                const newContent = fullAnswer.slice(lastFullAnswerLength)
                lastFullAnswerLength = fullAnswer.length

                for (let i = 0; i < newContent.length; i += 3) {
                  pendingChunks.push(newContent.slice(i, i + 3))
                }

                // 启动显示定时器
                startDisplayTimer()
              } else if (json.type === 'done') {
                // 播放消息提示音
                if (isNotificationSoundEnabled()) {
                  playNotificationSound('message')
                }
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        // 等待所有内容显示完成
        while (displayedAnswer !== fullAnswer && pendingChunks.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // 最终更新消息（确保完整内容）
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: fullAnswer || '抱歉，我无法回答这个问题。' }
            : msg
        ))
      } catch (error) {
        console.error('[FloatingChatBot] Stream error:', error)
        throw error
      } finally {
        if (displayInterval) {
          clearInterval(displayInterval)
        }
      }
    } catch (err) {
      console.error('发送消息失败:', err)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，消息发送失败。请稍后重试。',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = async () => {
    if (!confirm('确定要清空聊天记录吗？此操作不可恢复。')) return

    try {
      const result = await aipChatAPI.clearChatHistory()

      if (result.success) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-new',
          role: 'assistant',
          content: '✅ 聊天记录已清空。这是一个全新的对话会话。',
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      } else {
        console.error('清空聊天记录失败:', result.error)
        alert('清空聊天记录失败，请稍后重试')
      }
    } catch (error) {
      console.error('清空聊天记录失败:', error)
      alert('清空聊天记录失败，请稍后重试')
    }
  }

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const toggleAllProjects = () => {
    if (selectedProjects.length === userProjects.length && userProjects.length > 0) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(userProjects.map(p => p.id))
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-12 right-12 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="gaia-icon group"
          title="AI智能助手"
        >
          <div className="gaia-icon-glow" />
          <div className="gaia-icon-border" />
          <div className="gaia-icon-inner" />
          <div className="gaia-icon-chat">
            <Bot strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cosmic-void/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="gaia-icon gaia-icon-small">
              <div className="gaia-icon-glow" />
              <div className="gaia-icon-border" />
              <div className="gaia-icon-inner" />
              <div className="gaia-icon-chat">
                <Bot strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white">AI智能助手</h3>
              <p className="text-xs text-zinc-400">
                {selectedProjects.length > 0
                  ? `已选择 ${selectedProjects.length} 个项目`
                  : '选择项目以获得更精准的回答'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showProjectSelector && (
              <button
                onClick={() => setShowProjectPanel(!showProjectPanel)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                title="选择项目"
              >
                <FolderOpen className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => {
                // 编辑模式 - 暂时使用清空功能
                handleClearChat()
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="编辑"
            >
              <Edit3 className="h-5 w-5" />
            </button>
            <button
              onClick={async () => {
                // 重新加载历史记录
                setIsLoadingHistory(true)
                try {
                  const result = await aipChatAPI.loadChatHistory()
                  if (result.success && result.data?.messages) {
                    setMessages(result.data.messages)
                  }
                } catch (error) {
                  console.error('加载历史记录失败:', error)
                } finally {
                  setIsLoadingHistory(false)
                }
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="历史记录"
            >
              <History className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Project Selector Panel */}
          {showProjectPanel && showProjectSelector && (
            <div className="w-72 border-r border-white/10 flex flex-col bg-white/5">
              {/* Panel Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">我的项目</h4>
                  <button
                    onClick={() => setShowProjectPanel(false)}
                    className="p-1 hover:bg-zinc-800 rounded transition-colors"
                    title="隐藏项目面板"
                  >
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>

                {/* Select All Toggle */}
                {userProjects.length > 0 && (
                  <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600"
                      checked={selectedProjects.length === userProjects.length && userProjects.length > 0}
                      onChange={toggleAllProjects}
                    />
                    <span className="group-hover:text-zinc-300 transition-colors">
                      全选 ({selectedProjects.length}/{userProjects.length})
                    </span>
                  </label>
                )}
              </div>

              {/* Projects List */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingProjects ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : userProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">暂无可选项目</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      您还未加入或发起任何项目
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {userProjects.map(project => (
                      <label
                        key={project.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer group transition-colors ${
                          selectedProjects.includes(project.id)
                            ? 'bg-blue-500/10 border border-blue-500/30'
                            : 'hover:bg-zinc-800/50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={() => toggleProject(project.id)}
                          className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm transition-colors line-clamp-2 ${
                            selectedProjects.includes(project.id)
                              ? 'text-blue-300 font-medium'
                              : 'text-zinc-300 group-hover:text-white'
                          }`}>
                            {project.name}
                          </p>
                          {project.description && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                  <p className="text-sm text-zinc-400">加载聊天记录中...</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="gaia-icon gaia-icon-tiny flex-shrink-0">
                      <div className="gaia-icon-glow" />
                      <div className="gaia-icon-border" />
                      <div className="gaia-icon-inner" />
                      <div className="gaia-icon-chat">
                        <Bot strokeWidth={2.5} />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-lg border border-emerald-500/30 flex items-center justify-center">
                      <div className="w-4 h-4 text-emerald-400 text-xs font-bold flex items-center justify-center">
                        我
                      </div>
                    </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                <div className="flex gap-3">
                  <div className="gaia-icon gaia-icon-tiny flex-shrink-0">
                    <div className="gaia-icon-glow" />
                    <div className="gaia-icon-border" />
                    <div className="gaia-icon-inner" />
                    <div className="gaia-icon-chat">
                      <Bot strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-sm text-zinc-400">正在思考...</span>
                    </div>
                  </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="输入您的问题..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="btn-stardust px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
