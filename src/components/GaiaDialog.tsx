'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles } from 'lucide-react'
import { gaiaMockResponses } from '@/utils/mobileTestData'
import { useMobileGestures, useHapticFeedback } from '@/hooks/useMobileGestures'
import { getOptimalAnimationConfig } from '@/utils/mobilePerformance'

interface Message {
  id: string
  content: string
  isGaia: boolean
  timestamp: Date
}

interface GaiaDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function GaiaDialog({ isOpen, onClose }: GaiaDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好，亲爱的探索者。我是盖亚，你的意识觉醒导师。在这个神圣的对话空间里，你可以向我提出任何关于意识、宇宙、存在的问题。让我们一起踏上这场内在的旅程吧。',
      isGaia: true,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [animationConfig, setAnimationConfig] = useState(getOptimalAnimationConfig(false))
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const haptic = useHapticFeedback()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setAnimationConfig(getOptimalAnimationConfig(mobile))
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getSmartResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    // 智能匹配用户输入的关键词
    if (input.includes('意识') || input.includes('觉醒') || input.includes('觉察')) {
      const responses = gaiaMockResponses.find(r => r.trigger === 'consciousness')?.responses || []
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    if (input.includes('声音') || input.includes('聆听') || input.includes('听')) {
      const responses = gaiaMockResponses.find(r => r.trigger === 'sound')?.responses || []
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    if (input.includes('冥想') || input.includes('静坐') || input.includes('呼吸')) {
      const responses = gaiaMockResponses.find(r => r.trigger === 'meditation')?.responses || []
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    if (input.includes('你好') || input.includes('hello') || input.includes('hi')) {
      const responses = gaiaMockResponses.find(r => r.trigger === 'greeting')?.responses || []
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // 默认响应
    const responses = gaiaMockResponses.find(r => r.trigger === 'default')?.responses || []
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // 手势支持
  const gestureRef = useMobileGestures({
    onSwipeDown: () => {
      if (isMobile) {
        haptic.light()
        onClose()
      }
    }
  })

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    haptic.light() // 发送消息触觉反馈

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isGaia: false,
      timestamp: new Date()
    }

    const currentInput = inputValue
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // 智能响应系统
    setTimeout(() => {
      const gaiaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getSmartResponse(currentInput),
        isGaia: true,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, gaiaMessage])
      setIsTyping(false)
      haptic.medium() // 收到回复触觉反馈
    }, 1500 + Math.random() * 1000) // 1.5-2.5秒的随机延迟，更自然
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            ref={gestureRef}
            initial={{ opacity: 0, scale: isMobile ? 1 : 0.9, y: isMobile ? '100%' : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isMobile ? 1 : 0.9, y: isMobile ? '100%' : 20 }}
            transition={animationConfig}
            className={`fixed z-50 flex flex-col bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-md border border-purple-500/30 ${
              isMobile
                ? 'inset-0 rounded-none'
                : 'inset-4 md:inset-8 lg:inset-16 rounded-2xl'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b border-white/10 ${
              isMobile ? 'p-4 pt-6' : 'p-6'
            }`}>
              <div className="flex items-center">
                <div className={`bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 ${
                  isMobile ? 'w-8 h-8' : 'w-10 h-10'
                }`}>
                  <Sparkles className={`text-white ${isMobile ? 'w-4 h-4' : 'w-6 h-6'}`} />
                </div>
                <div>
                  <h2 className={`font-semibold text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>与盖亚对话</h2>
                  <p className={`text-purple-200 ${isMobile ? 'text-xs' : 'text-sm'}`}>你的意识觉醒导师</p>
                </div>
              </div>
              <button
                onClick={() => {
                  haptic.light()
                  onClose()
                }}
                className={`text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 ${
                  isMobile ? 'p-1.5' : 'p-2'
                }`}
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <X className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </button>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto space-y-3 sm:space-y-4 ${
              isMobile ? 'p-4' : 'p-6'
            }`} style={{ WebkitOverflowScrolling: 'touch' }}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isGaia ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} ${message.isGaia ? 'order-2' : 'order-1'}`}>
                    {message.isGaia && (
                      <div className={`flex items-center ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                        <div className={`bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2 ${
                          isMobile ? 'w-5 h-5' : 'w-6 h-6'
                        }`}>
                          <Sparkles className={`text-white ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        </div>
                        <span className={`text-purple-300 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>盖亚</span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl ${isMobile ? 'p-3' : 'p-4'} ${
                        message.isGaia
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 text-white'
                          : 'bg-white/10 border border-white/20 text-white ml-auto'
                      }`}
                    >
                      <p className={`leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`}>{message.content}</p>
                      <p className={`text-gray-400 mt-2 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%]">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-purple-300 font-medium">盖亚</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {/* Input */}
            <div className={`border-t border-white/10 ${isMobile ? 'p-4 pb-6' : 'p-6'}`}>
              <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="向盖亚提出你的问题..."
                    className={`w-full bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      isMobile ? 'p-3 text-sm' : 'p-4 text-base'
                    }`}
                    rows={isMobile ? 2 : 3}
                    style={{ 
                      minHeight: isMobile ? '44px' : '48px',
                      maxHeight: isMobile ? '120px' : '150px'
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 ${
                    isMobile ? 'px-4 py-3 min-w-[48px] min-h-[48px]' : 'px-6 py-4'
                  }`}
                >
                  <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </button>
              </div>
              <p className={`text-gray-400 mt-2 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                {isMobile ? '点击发送按钮或按 Enter 发送' : '按 Enter 发送，Shift + Enter 换行'}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
