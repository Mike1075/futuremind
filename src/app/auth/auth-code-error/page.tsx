'use client'

import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AuthCodeErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md mx-4 border border-red-500/30 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          邮箱验证失败
        </h1>

        <p className="text-gray-300 mb-6 leading-relaxed">
          抱歉，邮箱验证链接无效或已过期。请重新注册或联系支持团队获取帮助。
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
          >
            返回登录页面
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 border-2 border-gray-400 text-gray-300 font-semibold rounded-lg hover:bg-gray-400 hover:text-white transition-all duration-300 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}
