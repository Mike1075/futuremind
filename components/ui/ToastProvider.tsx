'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

// 全局 toast 事件名称
const TOAST_EVENT = 'global-toast-event'

// 全局 toast 函数（可在任何地方使用，包括非组件代码）
export const globalToast = {
  success: (message: string, duration?: number) => {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type: 'success', duration } }))
  },
  error: (message: string, duration?: number) => {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type: 'error', duration } }))
  },
  info: (message: string, duration?: number) => {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type: 'info', duration } }))
  },
  warning: (message: string, duration?: number) => {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type: 'warning', duration } }))
  }
}

interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextType {
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-400" />
    case 'error':
      return <XCircle className="w-5 h-5 text-red-400" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />
    default:
      return <Info className="w-5 h-5 text-cyan-400" />
  }
}

const getStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'border-green-500/50 shadow-green-500/20'
    case 'error':
      return 'border-red-500/50 shadow-red-500/20'
    case 'warning':
      return 'border-yellow-500/50 shadow-yellow-500/20'
    default:
      return 'border-cyan-500/50 shadow-cyan-500/20'
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType, duration: number = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  // 监听全局 toast 事件
  useEffect(() => {
    const handleGlobalToast = (event: CustomEvent) => {
      const { message, type, duration } = event.detail
      addToast(message, type, duration)
    }

    window.addEventListener(TOAST_EVENT, handleGlobalToast as EventListener)
    return () => {
      window.removeEventListener(TOAST_EVENT, handleGlobalToast as EventListener)
    }
  }, [addToast])

  const toast = {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container - 屏幕正中间显示 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="pointer-events-auto"
            >
              <div
                className={`
                  bg-cosmic-void/95 backdrop-blur-xl border rounded-xl
                  px-4 py-3 shadow-xl flex items-start gap-3 min-w-[320px] max-w-[420px]
                  ${getStyles(t.type)}
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(t.type)}
                </div>
                <p className="text-starlight text-sm flex-1 whitespace-pre-wrap">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 text-starlight-muted hover:text-starlight transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
