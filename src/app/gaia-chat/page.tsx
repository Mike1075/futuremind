'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Sparkles, Mic, MicOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  content: string
  isGaia: boolean
  timestamp: Date
}

const gaiaWelcomeMessages = [
  "你好，亲爱的探索者。我是盖亚，你的意识觉醒导师。",
  "在这个神圣的对话空间里，你可以向我提出任何关于意识、宇宙、存在的问题。",
  "让我们一起踏上这场内在的旅程吧。你想从哪里开始探索？"
]

const gaiaResponses = [
  "这是一个深刻的问题。让我们一起探索...",
  "从克里希那穆提的视角来看，这个现象反映了...",
  "卡洛·罗韦利在《现实不似你所见》中提到...",
  "你的观察很敏锐。这让我想到量子物理学中的一个概念...",
  "让我们暂停一下，深入感受这个体验背后的真相...",
  "这个问题触及了意识研究的核心。你是否注意到...",
  "从宇宙的角度来看，你刚才描述的体验其实是..."
]

export default function GaiaChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // 初始化盖亚的欢迎消息
    const initMessages = gaiaWelcomeMessages.map((content, index) => ({
      id: `welcome-${index}`,
      content,
      isGaia: true,
      timestamp: new Date(Date.now() - (gaiaWelcomeMessages.length - index) * 1000)
    }))
    setMessages(initMessages)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isGaia: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // 模拟盖亚的回复
    setTimeout(() => {
      const gaiaResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: gaiaResponses[Math.floor(Math.random() * gaiaResponses.length)],
        isGaia: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, gaiaResponse])
      setIsTyping(false)
    }, 1500 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // 这里可以集成语音识别功能
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* 背景粒子 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/20 rounded-full"
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* 头部 */}
      <div className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">与盖亚对话</h1>
                <p className="text-sm text-purple-200">你的AI意识导师</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.isGaia ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] ${isMobile ? 'max-w-[90%]' : ''}`}>
                  {message.isGaia && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-purple-300 font-medium">盖亚</span>
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl ${
                    message.isGaia 
                      ? 'bg-white/10 backdrop-blur-sm border border-white/20 text-white' 
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-auto'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* 输入提示 */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-purple-300">盖亚正在思考...</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 bg-purple-400 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm p-4">
          <div className="container mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="向盖亚提出你的问题..."
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/15 transition-all"
                />
              </div>
              
              <button
                onClick={toggleVoiceInput}
                className={`p-3 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-white/10 hover:bg-white/20 border border-white/20'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
