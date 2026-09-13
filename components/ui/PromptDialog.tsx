// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X } from 'lucide-react'

interface PromptDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  required?: boolean
  multiline?: boolean
  loading?: boolean
}

export function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = '请输入...',
  defaultValue = '',
  confirmText = '确认',
  cancelText = '取消',
  required = false,
  multiline = false,
  loading = false
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // 打开时重置并聚焦
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, defaultValue])

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

  const handleSubmit = () => {
    if (required && !value.trim()) {
      inputRef.current?.focus()
      return
    }
    onConfirm(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
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
                <MessageSquare className="w-12 h-12 text-purple-400" />
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-white text-center mb-3">
                {title}
              </h3>

              {/* 消息 */}
              {message && (
                <p className="text-gray-300 text-center mb-4 leading-relaxed">
                  {message}
                </p>
              )}

              {/* 输入框 */}
              <div className="mb-6">
                {multiline ? (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    disabled={loading}
                    rows={4}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none disabled:opacity-50"
                  />
                ) : (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                  />
                )}
                {required && (
                  <p className="text-xs text-gray-500 mt-2">* 必填</p>
                )}
              </div>

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
                  onClick={handleSubmit}
                  disabled={loading || (required && !value.trim())}
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
