// @ts-nocheck
'use client'

import { useState } from 'react'
import {
  Play,
  Lightbulb,
  MessageCircleQuestion,
  Microscope,
  MessageSquare,
  FileText
} from 'lucide-react'
import type { CourseContent } from '@/lib/supabase/database.types'
import { VideoSection } from './tabs/VideoSection'
import { KnowledgeSection } from './tabs/KnowledgeSection'
import { SocraticSection } from './tabs/SocraticSection'
import { ExplorerProjectsSection } from './tabs/ExplorerProjectsSection'
import { DiscussionSection } from './tabs/DiscussionSection'
import { AssignmentSection } from './tabs/AssignmentSection'

interface SocraticQuestions {
  pre_watch?: string[]
  during_watch?: string[]
  post_watch?: string[]
}

interface EarthContentTabsProps {
  content: CourseContent
  systemKey: string
  isCompleted: boolean
  onDiscussWithGaia: (context: string, contextType: 'knowledge_point' | 'question') => void
}

type TabId = 'video' | 'knowledge' | 'socratic' | 'projects' | 'discussion' | 'assignment'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export function EarthContentTabs({
  content,
  systemKey,
  isCompleted,
  onDiscussWithGaia
}: EarthContentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('video')

  const tabs: Tab[] = [
    { id: 'video', label: '视频观看', icon: Play },
    { id: 'knowledge', label: '知识探索', icon: Lightbulb },
    { id: 'socratic', label: '苏格拉底问答', icon: MessageCircleQuestion },
    { id: 'projects', label: '小探险家项目', icon: Microscope },
    { id: 'discussion', label: '讨论区', icon: MessageSquare },
    { id: 'assignment', label: '作业提交', icon: FileText },
  ]

  const knowledgePoints = (content.knowledge_points as string[]) || []
  const socraticQuestions = (content.socratic_questions as SocraticQuestions) || {}
  const postReflection = (content.post_reflection as string[]) || []

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 mb-6">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-6 py-3 font-medium text-sm whitespace-nowrap
                  transition-all duration-200
                  ${isActive
                    ? 'text-white bg-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'video' && (
          <VideoSection
            documentaryUrl={content.documentary_url || ''}
            courseContentId={content.id}
            preWatchGuide={content.pre_watch_guide || ''}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeSection
            knowledgePoints={knowledgePoints}
            onDiscussWithGaia={onDiscussWithGaia}
          />
        )}

        {activeTab === 'socratic' && (
          <SocraticSection
            socraticQuestions={socraticQuestions}
            postReflection={postReflection}
            onDiscussWithGaia={onDiscussWithGaia}
          />
        )}

        {activeTab === 'projects' && (
          <ExplorerProjectsSection
            explorerProjects={content.explorer_projects || []}
            courseContentId={content.id}
          />
        )}

        {activeTab === 'discussion' && (
          <DiscussionSection
            courseContentId={content.id}
          />
        )}

        {activeTab === 'assignment' && (
          <AssignmentSection
            courseContentId={content.id}
            courseTitle={content.title || ''}
            isCompleted={isCompleted}
          />
        )}
      </div>
    </div>
  )
}
