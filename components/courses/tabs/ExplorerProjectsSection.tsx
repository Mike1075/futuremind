// @ts-nocheck
'use client'

import { useState } from 'react'
import { Microscope, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import type { ExplorerProject } from '@/lib/supabase/database.types'

interface ExplorerProjectsSectionProps {
  explorerProjects: any // JSONB field from database
  courseContentId: string
}

export function ExplorerProjectsSection({
  explorerProjects,
  courseContentId
}: ExplorerProjectsSectionProps) {
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null)

  // Parse explorer_projects from JSONB
  const projects: ExplorerProject[] = Array.isArray(explorerProjects)
    ? explorerProjects
    : []

  if (projects.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
        <Microscope className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">本阶段暂无小探险家项目</p>
        <p className="text-gray-600 text-sm mt-2">
          小探险家项目是动手实践活动，帮助你将学到的知识应用到实际中
        </p>
      </div>
    )
  }

  const toggleProject = (index: number) => {
    setExpandedProjectId(expandedProjectId === index ? null : index)
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Microscope className="w-5 h-5 text-amber-400" />
          小探险家项目
        </h3>
        <p className="text-gray-400 text-sm">
          动手实践项目，将课程知识应用到真实场景中
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project, index) => {
          const isExpanded = expandedProjectId === index

          return (
            <div
              key={index}
              className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-amber-500/50 transition-all"
            >
              {/* Project Header */}
              <button
                onClick={() => toggleProject(index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="text-left">
                    <h4 className="text-lg font-bold text-white">{project.title}</h4>
                    {project.goal && (
                      <p className="text-sm text-gray-400 mt-1">{project.goal}</p>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Project Details */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-white/10 pt-6">
                  {/* Materials */}
                  {project.materials && project.materials.length > 0 && (
                    <div>
                      <h5 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
                        📦 所需材料
                      </h5>
                      <ul className="space-y-2">
                        {project.materials.map((material: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-gray-300"
                          >
                            <span className="text-cyan-400 mt-1">•</span>
                            <span>{material}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Steps */}
                  {project.steps && project.steps.length > 0 && (
                    <div>
                      <h5 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wider">
                        📋 操作步骤
                      </h5>
                      <ol className="space-y-3">
                        {project.steps.map((step: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3"
                          >
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-gray-300 flex-1">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Expected Outcome */}
                  {project.expectedOutcome && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-purple-400 mb-2 uppercase tracking-wider">
                        🎯 预期成果
                      </h5>
                      <p className="text-gray-300">{project.expectedOutcome}</p>
                    </div>
                  )}

                  {/* Tips */}
                  {project.tips && project.tips.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        小贴士
                      </h5>
                      <ul className="space-y-2">
                        {project.tips.map((tip: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-gray-300 text-sm"
                          >
                            <span className="text-amber-400 mt-1">💡</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
