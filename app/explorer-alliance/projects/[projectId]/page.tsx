'use client'

import { use } from 'react'
import { useProject, useProjectTasks } from '@/lib/aip/hooks'
import { TaskList } from '@/components/aip/TaskList'
import { CreateTaskModal } from '@/components/aip/CreateTaskModal'
import { useState } from 'react'
import Link from 'next/link'

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { project, loading: projectLoading } = useProject(projectId)
  const { tasks, loading: tasksLoading, reload: reloadTasks } = useProjectTasks(projectId)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'members'>('overview')

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-400">项目不存在</h1>
          <Link href="/explorer-alliance" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  const statusColors = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    archived: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  }

  const statusLabels = {
    active: '进行中',
    completed: '已完成',
    archived: '已归档',
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/explorer-alliance" className="hover:text-white transition-colors">
              探索者联盟
            </Link>
            <span>/</span>
            <span className="text-white">{project.name}</span>
          </div>

          {/* Project Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <span className={`text-xs px-3 py-1 rounded border ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
                {project.is_public && (
                  <span className="text-xs px-3 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    公开
                  </span>
                )}
                {project.is_recruiting && (
                  <span className="text-xs px-3 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                    招募中
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-gray-400 mt-2">{project.description}</p>
              )}
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                {project.creator && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>创建者: {project.creator.full_name || project.creator.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>{project.members?.length || 0} 成员</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-6 border-b border-white/10">
            {[
              { key: 'overview', label: '概览' },
              { key: 'tasks', label: '任务' },
              { key: 'documents', label: '文档' },
              { key: 'members', label: '成员' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Project Info */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">项目信息</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">状态</span>
                    <span>{statusLabels[project.status]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">创建时间</span>
                    <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">更新时间</span>
                    <span>{new Date(project.updated_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">统计</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{tasks.length}</div>
                    <div className="text-sm text-gray-400">总任务数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {tasks.filter(t => t.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-400">已完成</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{project.members?.length || 0}</div>
                    <div className="text-sm text-gray-400">团队成员</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">任务列表</h2>
              <button
                onClick={() => setShowCreateTask(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity duration-200"
              >
                + 创建任务
              </button>
            </div>
            <TaskList tasks={tasks} loading={tasksLoading} projectId={projectId} onUpdate={reloadTasks} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="text-center text-gray-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>文档功能开发中...</p>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">团队成员</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members?.map((member) => (
                <div key={member.user_id} className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {member.user?.full_name?.[0] || member.user?.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{member.user?.full_name || member.user?.email}</div>
                      <div className="text-sm text-gray-400">
                        {member.role_in_project === 'owner' ? '所有者' :
                         member.role_in_project === 'manager' ? '管理员' : '成员'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateTask(false)}
          onSuccess={() => {
            setShowCreateTask(false)
            reloadTasks()
          }}
        />
      )}
    </div>
  )
}
