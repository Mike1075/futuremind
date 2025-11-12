'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Send, MessageSquare, X, Trash2 } from 'lucide-react'
import { useOrganizations } from '@/lib/aip/hooks'
import { useUserProjects } from '@/lib/aip/useUserProjects'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { organizations } = useOrganizations()
  const { projects, loading: projectsLoading } = useUserProjects()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '您好！我是AIP AI助手\n\n我可以帮您管理项目、分配任务、搜索文档等。您可以选择特定项目进行更精准的查询。',
        timestamp: new Date()
      }])
    }
  }, [isOpen])

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

      console.log('[ChatBot] 组织ID获取:', {
        从项目获取: selectedProjects.length > 0 ? projects.find(p => p.id === (Array.isArray(projectIdValue) ? projectIdValue[0] : projectIdValue))?.organization_id : null,
        从用户组织获取: organizations?.[0]?.organization_id,
        最终使用: currentOrgId
      })

      console.log('[ChatBot] 发送消息到API:', {
        chatInput: input.trim(),
        project_id: projectIdValue,
        organization_id: currentOrgId,
        selectedProjectsCount: selectedProjects.length
      })

      const response = await fetch('/api/aip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: input.trim(),
          project_id: projectIdValue,  // 单个项目传字符串，多个传数组
          organization_id: currentOrgId
        })
      })

      console.log('[ChatBot] API响应状态:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[ChatBot] API返回错误:', errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        throw new Error(errorData.details || errorData.error || `服务器错误 (${response.status})`)
      }

      const data = await response.json()
      console.log('[ChatBot] API返回数据:', data)

      const aiResponse = data.response || data.output || data.message

      if (!aiResponse) {
        console.warn('[ChatBot] API未返回有效的响应内容:', data)
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse || '抱歉，我没有理解您的问题',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      console.log('[ChatBot] 消息添加成功')
    } catch (error: any) {
      console.error('[ChatBot] ❌ 发送消息失败:', error)
      console.error('[ChatBot] 错误详情:', {
        message: error.message,
        stack: error.stack
      })

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
  const handleClearConversation = () => {
    setMessages([{
      role: 'assistant',
      content: '您好！我是AIP AI助手\n\n我可以帮您管理项目、分配任务、搜索文档等。您可以选择特定项目进行更精准的查询。',
      timestamp: new Date()
    }])
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg hover:opacity-90 transition-opacity duration-200 flex items-center justify-center z-50"
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
            <div className="bg-zinc-900 border border-white/20 rounded-xl shadow-2xl w-full max-w-[960px] h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">AIP AI 助手</h3>
                  <p className="text-sm text-gray-400 mt-1">智能项目管理助手</p>
                </div>
                <button
                  onClick={handleClearConversation}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                  title="清空聊天记录"
                >
                  <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Project Selector Panel */}
            <div className="bg-zinc-900 border border-white/20 rounded-xl shadow-2xl w-[360px] min-w-[360px] h-[600px] p-4 flex flex-col flex-shrink-0">
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
