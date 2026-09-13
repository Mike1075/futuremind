// @ts-nocheck
'use client'

import { memo } from 'react'
import { MessageCircle, X, History, Edit3, Check, Trash2 } from 'lucide-react'

interface GaiaHeaderProps {
  isEditMode: boolean
  selectedCount: number
  totalCount: number
  onToggleEditMode: () => void
  onToggleSelectAll: () => void
  onDeleteSelected: () => void
  onCancelEdit: () => void
  onLoadHistory: () => void
  onClose: () => void
}

/**
 * 盖亚对话框头部组件
 * 包含标题、编辑模式控制、历史记录按钮
 */
export const GaiaHeader = memo(function GaiaHeader({
  isEditMode,
  selectedCount,
  totalCount,
  onToggleEditMode,
  onToggleSelectAll,
  onDeleteSelected,
  onCancelEdit,
  onLoadHistory,
  onClose
}: GaiaHeaderProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-cosmic-void/50">
      <div className="flex items-center gap-3">
        <div className="gaia-icon gaia-icon-small">
          <div className="gaia-icon-glow" />
          <div className="gaia-icon-border" />
          <div className="gaia-icon-inner" />
          <div className="gaia-icon-chat">
            <MessageCircle strokeWidth={2.5} />
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-white">盖亚 Gaia</h2>
          <p className="text-xs text-gray-400">你的AI学习伙伴</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isEditMode ? (
          <>
            <button
              onClick={onToggleSelectAll}
              className="px-3 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 flex items-center gap-2"
              title="全选/取消全选"
            >
              <Check className="w-4 h-4" /> {isAllSelected ? '取消全选' : '全选'}
            </button>
            <button
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className="px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="删除选中的消息"
            >
              <Trash2 className="w-4 h-4" /> 删除选中 ({selectedCount})
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-2 text-sm bg-white/10 hover:bg-white/15 text-white rounded-lg border border-white/20"
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onToggleEditMode}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="编辑聊天记录"
            >
              <Edit3 className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={onLoadHistory}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="加载历史记录"
            >
              <History className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </>
        )}
      </div>
    </div>
  )
})
