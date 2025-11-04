'use client'

import { Lightbulb, MessageSquare } from 'lucide-react'

interface KnowledgeSectionProps {
  knowledgePoints: string[]
  onDiscussWithGaia: (context: string, contextType: 'knowledge_point' | 'question') => void
}

export function KnowledgeSection({
  knowledgePoints,
  onDiscussWithGaia
}: KnowledgeSectionProps) {
  if (knowledgePoints.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
        <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">本阶段暂无知识点</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-green-400" />
          核心知识点
        </h3>
        <p className="text-gray-400 text-sm">
          点击任意知识点可与盖亚进行深入探讨
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {knowledgePoints.map((point, index) => (
          <div
            key={index}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-green-500/50 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                    Knowledge Point
                  </span>
                </div>
                <p className="text-gray-200 leading-relaxed text-lg">
                  {point}
                </p>
              </div>
              <button
                onClick={() => onDiscussWithGaia(point, 'knowledge_point')}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MessageSquare className="w-4 h-4" />
                与盖亚探讨
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
