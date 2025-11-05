'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Microscope, ChevronDown, ChevronUp, Lightbulb, Target, Package, List, Star } from 'lucide-react'
import type { ExplorerProject } from '@/lib/supabase/database.types'

interface ExplorerProjectCardProps {
  project: ExplorerProject
  index: number
  source: 'earth' | 'user' // 来源：地球课程 或 用户创建
  stageTitle?: string // 如果来自地球课程，显示所属阶段
}

export function ExplorerProjectCard({
  project,
  index,
  source,
  stageTitle
}: ExplorerProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-amber-500/50 transition-all"
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Microscope className="w-6 h-6 text-white" />
          </div>

          {/* Title and Source */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {source === 'earth' && stageTitle && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
                  🌍 {stageTitle}
                </span>
              )}
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                小探险家项目
              </span>
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Goal (Always Visible) */}
        {project.goal && (
          <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-3">
            <Target className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-purple-400 font-medium mb-1">项目目标</p>
              <p className="text-sm text-gray-300">{project.goal}</p>
            </div>
          </div>
        )}

        {/* Collapsed View - Quick Info */}
        {!isExpanded && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {project.materials && project.materials.length > 0 && (
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {project.materials.length}种材料
              </span>
            )}
            {project.steps && project.steps.length > 0 && (
              <span className="flex items-center gap-1">
                <List className="w-3 h-3" />
                {project.steps.length}个步骤
              </span>
            )}
            {project.tips && project.tips.length > 0 && (
              <span className="flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                {project.tips.length}条提示
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4"
        >
          {/* Materials */}
          {project.materials && project.materials.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4" />
                所需材料
              </h4>
              <ul className="space-y-1.5">
                {project.materials.map((material, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="text-cyan-400 mt-1">•</span>
                    <span className="flex-1">{material}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps */}
          {project.steps && project.steps.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-green-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <List className="w-4 h-4" />
                操作步骤
              </h4>
              <ol className="space-y-2">
                {project.steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-300 flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Expected Outcome */}
          {project.expectedOutcome && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <h4 className="text-sm font-bold text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4" />
                预期成果
              </h4>
              <p className="text-sm text-gray-300">{project.expectedOutcome}</p>
            </div>
          )}

          {/* Tips */}
          {project.tips && project.tips.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <h4 className="text-sm font-bold text-amber-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                小贴士
              </h4>
              <ul className="space-y-1.5">
                {project.tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="text-amber-400">💡</span>
                    <span className="flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
