'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Home, TreePine, Target, Users, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMobileGestures, useHapticFeedback } from '@/hooks/useMobileGestures'

interface MobileSwipeNavigationProps {
  currentPage: string
  onPageChange?: (page: string) => void
}

const navigationPages = [
  { id: 'home', path: '/', icon: Home, label: '首页' },
  { id: 'dashboard', path: '/dashboard', icon: Target, label: '仪表板' },
  { id: 'consciousness-tree', path: '/consciousness-tree', icon: TreePine, label: '意识进化树' },
  { id: 'courses', path: '/courses', icon: Target, label: '课程中心' },
  { id: 'projects', path: '/projects', icon: Users, label: '项目协作' }
]

export default function MobileSwipeNavigation({ currentPage, onPageChange }: MobileSwipeNavigationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const router = useRouter()
  const haptic = useHapticFeedback()

  useEffect(() => {
    const index = navigationPages.findIndex(page => page.path === currentPage)
    if (index !== -1) {
      setCurrentIndex(index)
    }
  }, [currentPage])

  useEffect(() => {
    // 5秒后隐藏提示
    const timer = setTimeout(() => {
      setShowHint(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const navigateToPage = (direction: 'prev' | 'next') => {
    let newIndex = currentIndex
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === 'next' && currentIndex < navigationPages.length - 1) {
      newIndex = currentIndex + 1
    }

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
      haptic.medium()
      
      const targetPage = navigationPages[newIndex]
      if (onPageChange) {
        onPageChange(targetPage.id)
      } else {
        router.push(targetPage.path)
      }
    }
  }

  const gestureRef = useMobileGestures({
    onSwipeLeft: () => navigateToPage('next'),
    onSwipeRight: () => navigateToPage('prev')
  })

  const currentPageData = navigationPages[currentIndex]
  const prevPage = currentIndex > 0 ? navigationPages[currentIndex - 1] : null
  const nextPage = currentIndex < navigationPages.length - 1 ? navigationPages[currentIndex + 1] : null

  return (
    <div ref={gestureRef} className="fixed top-0 left-0 right-0 z-30">
      {/* 滑动提示 */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 z-40"
          >
            <div className="flex items-center gap-2 text-white text-xs">
              <ChevronLeft className="w-3 h-3" />
              <span>左右滑动切换页面</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 页面指示器 */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
        {navigationPages.map((page, index) => {
          const Icon = page.icon
          const isActive = index === currentIndex
          
          return (
            <button
              key={page.id}
              onClick={() => {
                setCurrentIndex(index)
                haptic.light()
                if (onPageChange) {
                  onPageChange(page.id)
                } else {
                  router.push(page.path)
                }
              }}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                isActive 
                  ? 'bg-purple-500 text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3 h-3" />
            </button>
          )
        })}
      </div>

      {/* 侧边导航提示 */}
      <AnimatePresence>
        {prevPage && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 0.6, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-2"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </motion.div>
        )}
        
        {nextPage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.6, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-2"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 当前页面信息 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
        <div className="flex items-center gap-2 text-white text-sm">
          <currentPageData.icon className="w-4 h-4" />
          <span>{currentPageData.label}</span>
        </div>
      </div>
    </div>
  )
}
