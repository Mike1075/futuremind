'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 检测移动端
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // 检测PWA安装状态
    const checkInstallStatus = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }
    checkInstallStatus()

    // 监听PWA安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // 延迟显示安装提示，避免打扰用户初次体验
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true)
        }
      }, 30000) // 30秒后显示
    }

    // 监听PWA安装完成事件
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // 注册Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration)
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Install prompt failed:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // 24小时后再次提示
    setTimeout(() => {
      if (!isInstalled && deferredPrompt) {
        setShowInstallPrompt(true)
      }
    }, 24 * 60 * 60 * 1000)
  }

  // 如果已安装或不是移动端，不显示安装提示
  if (isInstalled || !isMobile || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 shadow-2xl border border-white/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center flex-1">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">
                  安装到主屏幕
                </h3>
                <p className="text-white/80 text-xs leading-relaxed">
                  获得更好的移动端体验，支持离线使用
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 px-4 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              稍后提醒
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-4 bg-white text-purple-600 text-sm font-medium rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-1"
            >
              <Download className="w-4 h-4" />
              安装
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
