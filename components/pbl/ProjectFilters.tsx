// @ts-nocheck
"use client"

import React from 'react'
import { X } from 'lucide-react'

interface ProjectFiltersProps {
  selectedDifficulty: string
  selectedStatus: string
  onDifficultyChange: (difficulty: string) => void
  onStatusChange: (status: string) => void
  onClose: () => void
}

export function ProjectFilters({
  selectedDifficulty,
  selectedStatus,
  onDifficultyChange,
  onStatusChange,
  onClose
}: ProjectFiltersProps) {
  return (
    <div className="card-glass border-b border-cosmic-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 font-semibold text-starlight">筛选条件</h3>
        <button
          onClick={onClose}
          className="text-starlight-muted hover:text-starlight transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 难度筛选 */}
        <div>
          <label className="block text-small font-medium text-starlight-muted mb-3">
            难度等级
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: '全部难度' },
              { value: 'beginner', label: '初学者' },
              { value: 'intermediate', label: '中级' },
              { value: 'advanced', label: '高级' },
              { value: 'expert', label: '专家' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="difficulty"
                  value={option.value}
                  checked={selectedDifficulty === option.value}
                  onChange={(e) => onDifficultyChange(e.target.value)}
                  className="w-4 h-4 text-primary-600 bg-cosmic-800 border-cosmic-600 focus:ring-primary-500 focus:ring-2"
                />
                <span className="ml-2 text-small text-starlight-muted">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 状态筛选 */}
        <div>
          <label className="block text-small font-medium text-starlight-muted mb-3">
            项目状态
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: '全部状态' },
              { value: 'recruiting', label: '招募中' },
              { value: 'active', label: '进行中' },
              { value: 'completed', label: '已完成' },
              { value: 'paused', label: '暂停' }
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="w-4 h-4 text-primary-600 bg-cosmic-800 border-cosmic-600 focus:ring-primary-500 focus:ring-2"
                />
                <span className="ml-2 text-small text-starlight-muted">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end mt-6 space-x-4">
        <button
          onClick={() => {
            onDifficultyChange('all')
            onStatusChange('all')
          }}
          className="px-4 py-2 text-starlight-muted hover:text-starlight transition-colors"
        >
          重置筛选
        </button>
        <button
          onClick={onClose}
          className="btn-stardust"
        >
          应用筛选
        </button>
      </div>
    </div>
  )
}
