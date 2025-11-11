'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, X, Send, Trash2, Check, FolderOpen, Building2, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import type { Organization, Project } from '@/lib/aip/types'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化时预选当前项目
  useEffect(() => {
    if (currentProject) {
      setSelectedProjects([currentProject.id])
    }
  }, [currentProject])

  // 加载用户项目
  useEffect(() => {
    if (!isOpen) return

    const loadProjects = async () => {
      setIsLoadingProjects(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: projectMembers } = await supabase
          .from('project_members')
          .select('*, project:projects(*)')
          .eq('user_id', user.id)

        const projects = projectMembers?.map(pm => pm.project).filter(Boolean) || []

        // 如果有组织上下文，只显示该组织的项目
        const filtered = organization?.id
          ? projects.filter(p => p.organization_id === organization.id)
          : projects

        setUserProjects(filtered as Project[])
      } catch (err) {
        console.error('加载项目失败:', err)
      } finally {
        setIsLoadingProjects(false)
      }
    }

    loadProjects()
  }, [isOpen, organization])

  // 初始化欢迎消息
  useEffect(() => {
    if (!isOpen) return

    let welcomeContent = '您好！我是您的AI项目管理助手。'

    if (currentProject && organization) {
      welcomeContent = `您好！当前已为您选择了项目「${currentProject.name}」（${organization.name}组织）。您可以直接询问该项目的相关问题。`
    } else if (organization) {
      welcomeContent = `您好！当前已为您选择了「${organization.name}」组织。您可以询问组织相关问题或选择特定项目。`
    } else {
      welcomeContent = '您好！我是您的AI项目管理助手。我可以帮您回答问题、分析项目进度、分配任务等。'
    }

    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date()
    }])
  }, [isOpen, currentProject, organization])

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

      // 调用N8N ChatBot API
      const response = await fetch('/api/aip/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: userMessage.content,
          project_id: selectedProjects,
          organization_id: organization?.id || ''
        })
      })

      if (!response.ok) {
        throw new Error('AI响应失败')
      }

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || '抱歉，我无法回答这个问题。',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
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

  const handleClearChat = () => {
    if (confirm('确定要清空聊天记录吗？')) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-new',
        role: 'assistant',
        content: '聊天记录已清空。这是一个全新的对话会话。',
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
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
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border-0 outline-none"
          title="AI智能助手"
          style={{
            width: '72px',
            height: '72px',
            minWidth: '72px',
            minHeight: '72px'
          }}
        >
          <Bot className="w-8 h-8 flex-shrink-0 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Bot className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI智能助手</h3>
              <p className="text-xs text-zinc-500">
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
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                title="选择项目"
              >
                <FolderOpen className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="清空聊天"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Project Selector Panel */}
          {showProjectPanel && showProjectSelector && (
            <div className="w-72 border-r border-zinc-800 flex flex-col">
              {/* Panel Header */}
              <div className="p-4 border-b border-zinc-800">
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
                  <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    加载中...
                  </div>
                ) : userProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">暂无可选项目</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {organization ? '该组织下暂无项目' : '您还未加入任何项目'}
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg border border-blue-500/30 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-400" />
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
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg border border-blue-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-sm text-zinc-400">正在思考...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
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
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
