// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react'
import { Sparkles, MessageCircle } from 'lucide-react'
import { PBLProject } from '@/lib/pbl-data'
import { GaiaChat } from './GaiaChat'

interface FloatingGaiaProps {
  currentProject?: PBLProject
  showProjectSelector?: boolean
  userName?: string
}

export function FloatingGaia({ currentProject, showProjectSelector = false, userName }: FloatingGaiaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState<'curious' | 'excited' | 'thoughtful' | 'supportive'>('curious')
  const [isBreathing, setIsBreathing] = useState(true)

  // 定期改变塞娅的情绪状态
  useEffect(() => {
    const emotionInterval = setInterval(() => {
      const emotions: Array<'curious' | 'excited' | 'thoughtful' | 'supportive'> = [
        'curious',
        'excited',
        'thoughtful',
        'supportive'
      ]
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
      setCurrentEmotion(randomEmotion)
    }, 8000)

    return () => clearInterval(emotionInterval)
  }, [])

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'excited':
        return 'from-yellow-400 to-orange-500'
      case 'thoughtful':
        return 'from-purple-400 to-indigo-500'
      case 'supportive':
        return 'from-pink-400 to-rose-500'
      default:
        return 'from-primary-400 to-resonance-500'
    }
  }

  const getEmotionText = (emotion: string) => {
    switch (emotion) {
      case 'excited':
        return '兴奋中'
      case 'thoughtful':
        return '思考中'
      case 'supportive':
        return '支持你'
      default:
        return '好奇中'
    }
  }

  return (
    <>
      {/* 浮动按钮 */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className={`relative group ${isBreathing ? 'animate-pulse' : ''}`}
          aria-label="打开塞娅对话"
        >
          {/* 外圈光晕 */}
          <div className={`absolute inset-0 bg-gradient-to-r ${getEmotionColor(currentEmotion)} rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity`}></div>

          {/* 主按钮 */}
          <div className={`relative w-16 h-16 bg-gradient-to-r ${getEmotionColor(currentEmotion)} rounded-full flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-all duration-300`}>
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          {/* 状态指示器 */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-cosmic-900 animate-pulse"></div>

          {/* 提示文本 */}
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-cosmic-800 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap border border-cosmic-700">
              <p className="text-sm font-medium">塞娅（Gaia）</p>
              <p className="text-xs text-cosmic-400">{getEmotionText(currentEmotion)}</p>
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-cosmic-800"></div>
          </div>
        </button>

        {/* 小提示气泡 (首次访问时显示) */}
        {!isOpen && (
          <div className="absolute bottom-20 right-0 max-w-xs">
            <div className="bg-gradient-to-r from-primary-600 to-resonance-600 text-white p-4 rounded-2xl shadow-2xl border border-white/20 animate-bounce">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">👋 你好！</p>
                  <p className="text-xs opacity-90">我是塞娅，随时准备帮助你探索意识的奥秘</p>
                </div>
              </div>
              <div className="absolute bottom-0 right-8 transform translate-y-1/2 rotate-45 w-3 h-3 bg-resonance-600"></div>
            </div>
          </div>
        )}
      </div>

      {/* 对话窗口 */}
      {isOpen && (
        <GaiaChat
          onClose={() => setIsOpen(false)}
          currentProject={currentProject}
          showProjectSelector={showProjectSelector}
          userName={userName}
        />
      )}
    </>
  )
}
