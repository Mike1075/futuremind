'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'success'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  loading = false
}: ConfirmDialogProps) {
  // ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, loading, onClose])

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-400" />
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-400" />
      default:
        return <Info className="w-12 h-12 text-blue-400" />
    }
  }

  const getButtonColors = () => {
    switch (type) {
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
      default:
        return 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* 对话框 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="card-glass border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              {/* 关闭按钮 */}
              {!loading && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* 图标 */}
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-white text-center mb-3">
                {title}
              </h3>

              {/* 消息 */}
              <p className="text-gray-300 text-center mb-6 leading-relaxed">
                {message}
              </p>

              {/* 按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 btn-stardust disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-3 btn-stardust disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>处理中...</span>
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
