// @ts-nocheck
'use client'

import { FileText, CheckCircle } from 'lucide-react'

interface AssignmentSectionProps {
  courseContentId: string
  courseTitle: string
  isCompleted: boolean
}

export function AssignmentSection({
  courseContentId,
  courseTitle,
  isCompleted
}: AssignmentSectionProps) {
  // TODO: Implement assignment submission and AI evaluation
  // This feature will allow students to submit reflections and get AI feedback

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
        <div className="flex items-start gap-4 mb-6">
          <FileText className="w-8 h-8 text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">课程作业</h3>
            <p className="text-gray-400">
              完成本阶段的学习后，请提交你的思考和感想，AI导师将为你提供个性化反馈
            </p>
          </div>
        </div>

        {isCompleted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-green-400 mb-2">已完成本阶段</h4>
            <p className="text-gray-400 text-sm">
              你可以继续复习内容或进入下一阶段
            </p>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
            <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">作业提交功能开发中</h4>
            <p className="text-gray-400 text-sm mb-4">
              即将上线：作业提交、AI智能评价、个性化反馈等功能
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
              <span className="animate-pulse">●</span>
              功能开发中...
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <p className="text-amber-400 text-sm">
          💡 <strong>提示：</strong>作业提交后，AI导师会根据你的回答提供深入的反馈，帮助你更好地理解课程内容。
        </p>
      </div>
    </div>
  )
}
