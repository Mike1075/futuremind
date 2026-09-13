// @ts-nocheck
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, Send, MessageSquare, X, Trash2, History, ChevronUp, Loader2 } from 'lucide-react'
import { useOrganizations } from '@/lib/aip/hooks'
import { useUserProjects } from '@/lib/aip/useUserProjects'
import aipChatAPI from '@/lib/api/aip-chat'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 分页配置
const INITIAL_LOAD = 5      // 初始加载5条
const LOAD_MORE = 10        // 点击加载更多加载10条
const HISTORY_LOAD = 20     // 点击历史记录按钮加载20条

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [loadedRecords, setLoadedRecords] = useState(0)  // 已加载的记录数
  const [hasMore, setHasMore] = useState(false)          // 是否还有更多
  const [isLoadingMore, setIsLoadingMore] = useState(false)  // 加载更多中
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)  // 加载历史中
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const { organizations } = useOrganizations()
  const { projects, loading: projectsLoading } = useUserProjects()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 加载聊天历史
  const loadHistory = useCallback(async (limit: number, prepend: boolean = false) => {
    const offset = prepend ? loadedRecords : 0
    const result = await aipChatAPI.loadChatHistory(limit, offset)

    if (result.success && result.data) {
      const historyMessages = result.data.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))

      if (prepend && historyMessages.length > 0) {
        // 加载更多：prepend到现有消息前面
        setMessages(prev => {
          // 过滤掉欢迎消息
          const existingWithoutWelcome = prev.filter(m => m.id !== 'welcome')
          return [...historyMessages, ...existingWithoutWelcome]
        })
        setLoadedRecords(prev => prev + limit)
      } else if (!prepend) {
        // 初始加载
        if (historyMessages.length > 0) {
          setMessages(historyMessages)
          setLoadedRecords(limit)
        } else {
          // 没有历史记录，显示欢迎消息
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: '您好！我是AIP AI助手\n\n我可以帮您管理项目、分配任务、搜索文档等。您可以选择特定项目进行更精准的查询。',
            timestamp: new Date()
          }])
          setLoadedRecords(0)
        }
      }

      setHasMore(result.data.hasMore)
    }
  }, [loadedRecords])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 打开时加载最近5条历史记录
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory(INITIAL_LOAD, false)
    }
  }, [isOpen])

  // 加载更多（10条）
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    // 保存当前滚动位置
    const container = messagesContainerRef.current
    const scrollHeightBefore = container?.scrollHeight || 0

    await loadHistory(LOAD_MORE, true)

    // 恢复滚动位置
    if (container) {
      const scrollHeightAfter = container.scrollHeight
      container.scrollTop = scrollHeightAfter - scrollHeightBefore
    }

    setIsLoadingMore(false)
  }

  // 加载历史记录（20条）
  const handleLoadHistory = async () => {
    if (isLoadingHistory || !hasMore) return
    setIsLoadingHistory(true)

    const container = messagesContainerRef.current
    const scrollHeightBefore = container?.scrollHeight || 0

    await loadHistory(HISTORY_LOAD, true)

    if (container) {
      const scrollHeightAfter = container.scrollHeight
      container.scrollTop = scrollHeightAfter - scrollHeightBefore
    }

    setIsLoadingHistory(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // 处理project_id：单个项目传字符串，多个项目传数组
      let projectIdValue: string | string[] | undefined = undefined
      if (selectedProjects.length > 0) {
        projectIdValue = selectedProjects.length === 1 ? selectedProjects[0] : selectedProjects
      }

      // 获取organization_id：从选中的项目中提取
      let currentOrgId: string = ''
      if (selectedProjects.length > 0) {
        // 如果选择了项目，使用第一个项目的organization_id
        const firstProjectId = Array.isArray(projectIdValue) ? projectIdValue[0] : projectIdValue
        const firstProject = projects.find(p => p.id === firstProjectId)
        if (firstProject?.organization_id) {
          currentOrgId = firstProject.organization_id
        }
      }

      // 如果没有从项目中获取到，使用用户的第一个组织ID
      if (!currentOrgId && organizations && organizations.length > 0) {
        currentOrgId = organizations[0].organization_id
      }

      // 最终兜底：使用默认组织ID
      if (!currentOrgId) {
        currentOrgId = 'd03b6947-f08d-41bd-86c0-c92c3c4630b0'
      }

      const response = await fetch('/api/aip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: input.trim(),
          project_id: projectIdValue,  // 单个项目传字符串，多个传数组
          organization_id: currentOrgId
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        throw new Error(errorData.details || errorData.error || `服务器错误 (${response.status})`)
      }

      const data = await response.json()
      const aiResponse = data.response || data.output || data.message

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse || '抱歉，我没有理解您的问题',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ 抱歉，发生了错误：\n\n${error.message || '未知错误'}\n\n请检查：\n1. 网络连接是否正常\n2. N8N服务是否可用\n3. 查看浏览器控制台获取详细日志`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 删除单个消息
  const handleDeleteMessage = (index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index))
  }

  // 清空对话
  const handleClearConversation = async () => {
    // 清除数据库中的历史记录
    await aipChatAPI.clearChatHistory()

    // 重置状态
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是AIP AI助手\n\n我可以帮您管理项目、分配任务、搜索文档等。您可以选择特定项目进行更精准的查询。',
      timestamp: new Date()
    }])
    setLoadedRecords(0)
    setHasMore(false)
  }

  // 切换项目选择
  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projects.map(p => p.id))
    }
  }

  // 按组织分组项目
  const groupedProjects = projects.reduce((acc, project) => {
    const orgId = project.organization_id || 'unknown'
    const orgName = project.organization_name || '未归属组织'

    if (!acc[orgId]) {
      acc[orgId] = {
        name: orgName,
        projects: []
      }
    }

    acc[orgId].projects.push(project)
    return acc
  }, {} as Record<string, { name: string; projects: typeof projects }>)

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 btn-stardust rounded-full shadow-lg flex items-center justify-center z-50"
        title="AIP AI 助手"
      >
        {isOpen ? (
          <X className="w-8 h-8 text-white" />
        ) : (
          <MessageSquare className="w-8 h-8 text-white" />
        )}
      </button>

      {/* Chat Window with Project Selector */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-start gap-4 mx-4 max-w-[1320px] w-full">
            {/* Main Chat Window */}
            <div className="card-glass border border-white/10 rounded-xl shadow-2xl w-full max-w-[960px] h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">AIP AI 助手</h3>
                  <p className="text-sm text-gray-400 mt-1">智能项目管理助手</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasMore && (
                    <button
                      onClick={handleLoadHistory}
                      disabled={isLoadingHistory}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                      title="加载更多历史记录"
                    >
                      {isLoadingHistory ? (
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                      ) : (
                        <History className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleClearConversation}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                    title="清空聊天记录"
                  >
                    <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                    title="关闭对话窗口"
                  >
                    <X className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 加载更多按钮 - 显示在消息列表顶部 */}
                {hasMore && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all disabled:opacity-50"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          加载中...
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          加载更多
                        </>
                      )}
                    </button>
                  </div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`group flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' && index > 0 && (
                      <div className="relative">
                        <button
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteMessage(index)
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 peer cursor-pointer"
                          title="双击删除此消息"
                        >
                          <X className="h-3 w-3 text-red-500 hover:text-red-400" />
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity duration-0 pointer-events-none z-10">
                          双击删除
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white'
                          : 'bg-white/10 text-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                        {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === 'assistant' && index > 0 && (
                      <div className="relative">
                        <button
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteMessage(index)
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 peer cursor-pointer"
                          title="双击删除此消息"
                        >
                          <X className="h-3 w-3 text-red-500 hover:text-red-400" />
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity duration-0 pointer-events-none z-10">
                          双击删除
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="px-4 py-2 btn-stardust text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Project Selector Panel */}
            <div className="card-glass border border-white/10 rounded-xl shadow-2xl w-[360px] min-w-[360px] h-[600px] p-4 flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">我的项目</h4>
                <label className="inline-flex items-center cursor-pointer select-none text-xs text-gray-400">
                  <span className="mr-2">全选</span>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={selectedProjects.length === projects.length && projects.length > 0}
                    onChange={toggleSelectAll}
                    disabled={projects.length === 0}
                  />
                  <span className="w-10 h-5 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-500 relative transition-colors peer-disabled:opacity-50">
                    <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all peer-checked:left-5" />
                  </span>
                </label>
              </div>

              <div className="flex-1 overflow-y-auto rounded-md border border-white/10">
                {projectsLoading ? (
                  <div className="p-3 text-sm text-gray-400">加载项目中...</div>
                ) : projects.length === 0 ? (
                  <div className="p-3 text-sm text-gray-400">暂无项目</div>
                ) : (
                  <div>
                    {Object.entries(groupedProjects).map(([orgId, group]) => (
                      <div key={orgId} className="border-b border-white/10 last:border-0">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-black/30 sticky top-0 z-10">
                          {group.name}
                        </div>
                        <ul>
                          {group.projects.map(project => {
                            const checked = selectedProjects.includes(project.id)
                            return (
                              <li
                                key={project.id}
                                className="px-3 py-2 flex items-center gap-2 hover:bg-white/5 cursor-pointer transition-colors"
                                onClick={() => toggleProject(project.id)}
                                title={project.name}
                              >
                                <span
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                    checked
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent'
                                      : 'border-gray-600'
                                  }`}
                                >
                                  {checked && <Check className="h-3 w-3 text-white" />}
                                </span>
                                <span className="text-sm text-gray-300 truncate">{project.name}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-400">
                已选 {selectedProjects.length} / {projects.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
