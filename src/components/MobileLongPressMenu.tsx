'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Share, Bookmark, Info, X } from 'lucide-react'
import { useHapticFeedback } from '@/hooks/useMobileGestures'

interface MenuItem {
  id: string
  icon: React.ComponentType<any>
  label: string
  action: () => void
  color?: string
}

interface MobileLongPressMenuProps {
  isOpen: boolean
  onClose: () => void
  position: { x: number; y: number }
  items?: MenuItem[]
}

export default function MobileLongPressMenu({ 
  isOpen, 
  onClose, 
  position, 
  items = [] 
}: MobileLongPressMenuProps) {
  const [mounted, setMounted] = useState(false)
  const haptic = useHapticFeedback()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      haptic.medium()
      
      // 3秒后自动关闭
      const timer = setTimeout(() => {
        onClose()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose, haptic])

  const defaultItems: MenuItem[] = [
    {
      id: 'settings',
      icon: Settings,
      label: '设置',
      action: () => {
        haptic.light()
        console.log('打开设置')
        onClose()
      },
      color: 'text-blue-400'
    },
    {
      id: 'share',
      icon: Share,
      label: '分享',
      action: () => {
        haptic.light()
        if (navigator.share) {
          navigator.share({
            title: '未来心灵学院',
            text: '一个面向后AGI时代的全球意识觉醒生态系统',
            url: window.location.href
          })
        }
        onClose()
      },
      color: 'text-green-400'
    },
    {
      id: 'bookmark',
      icon: Bookmark,
      label: '收藏',
      action: () => {
        haptic.light()
        console.log('添加收藏')
        onClose()
      },
      color: 'text-yellow-400'
    },
    {
      id: 'info',
      icon: Info,
      label: '信息',
      action: () => {
        haptic.light()
        console.log('显示信息')
        onClose()
      },
      color: 'text-purple-400'
    }
  ]

  const menuItems = items.length > 0 ? items : defaultItems

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* 菜单容器 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 bg-black/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl"
            style={{
              left: Math.min(position.x - 80, window.innerWidth - 180),
              top: Math.min(position.y - 60, window.innerHeight - 200),
              minWidth: '160px'
            }}
          >
            {/* 关闭按钮 */}
            <div className="flex justify-end p-2">
              <button
                onClick={() => {
                  haptic.light()
                  onClose()
                }}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 菜单项 */}
            <div className="px-2 pb-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      item.action()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/10 rounded-lg transition-colors group"
                  >
                    <Icon className={`w-4 h-4 ${item.color || 'text-white'} group-hover:scale-110 transition-transform`} />
                    <span className="text-white text-sm font-medium">{item.label}</span>
                  </motion.button>
                )
              })}
            </div>

            {/* 底部提示 */}
            <div className="px-3 py-2 border-t border-white/10">
              <p className="text-white/60 text-xs text-center">
                长按任意位置显示菜单
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// 全局长按菜单Hook
export function useGlobalLongPressMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const showMenu = (x: number, y: number) => {
    setMenuPosition({ x, y })
    setIsMenuOpen(true)
  }

  const hideMenu = () => {
    setIsMenuOpen(false)
  }

  return {
    isMenuOpen,
    menuPosition,
    showMenu,
    hideMenu
  }
}
