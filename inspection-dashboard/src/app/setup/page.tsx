'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Play,
  Settings,
  Users,
  BarChart3,
  ArrowLeft
} from 'lucide-react'

export default function SetupPage() {
  const [setupStatus, setSetupStatus] = useState({
    database: 'pending', // pending, loading, success, error
    tables: 'pending',
    data: 'pending',
    policies: 'pending'
  })
  const [setupLog, setSetupLog] = useState<Array<{message: string, type: 'info' | 'success' | 'error', timestamp: string}>>([])
  const [isSetupRunning, setIsSetupRunning] = useState(false)

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setSetupLog(prev => [...prev, { 
      message, 
      type, 
      timestamp: new Date().toLocaleTimeString() 
    }])
  }

  const initializeDatabase = async () => {
    setIsSetupRunning(true)
    setSetupLog([])
    
    try {
      // 步骤1: 连接数据库
      setSetupStatus(prev => ({ ...prev, database: 'loading' }))
      addLog('正在连接Supabase数据库...', 'info')
      
      const response = await fetch('/api/init-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setSetupStatus(prev => ({ 
          ...prev, 
          database: 'success',
          tables: 'success',
          data: 'success',
          policies: 'success'
        }))
        addLog('数据库连接成功！', 'success')
        addLog('数据表创建完成', 'success')
        addLog('初始数据插入完成', 'success')
        addLog('安全策略配置完成', 'success')
        addLog('数据库初始化完成！', 'success')
      } else {
        throw new Error(result.error || '数据库初始化失败')
      }
      
    } catch (error) {
      console.error('Setup error:', error)
      setSetupStatus(prev => ({ ...prev, database: 'error' }))
      addLog(`错误: ${error.message}`, 'error')
    } finally {
      setIsSetupRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading':
        return 'border-blue-500/50 bg-blue-500/10'
      case 'success':
        return 'border-green-500/50 bg-green-500/10'
      case 'error':
        return 'border-red-500/50 bg-red-500/10'
      default:
        return 'border-gray-500/50 bg-gray-500/10'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">系统初始化</h1>
              <p className="text-purple-300 text-sm">配置Supabase数据库和初始数据</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">欢迎使用检验管理系统</h2>
            <p className="text-gray-300 mb-6">
              首次使用需要初始化数据库，这将创建必要的数据表和初始数据
            </p>
            
            {!isSetupRunning && setupStatus.database === 'pending' && (
              <button
                onClick={initializeDatabase}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto"
              >
                <Play className="w-5 h-5" />
                <span>开始初始化</span>
              </button>
            )}

            {setupStatus.database === 'success' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">初始化完成！</span>
                </div>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                >
                  进入系统
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Setup Progress */}
        {(isSetupRunning || setupStatus.database !== 'pending') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-6">初始化进度</h3>
            
            <div className="space-y-4">
              {/* Database Connection */}
              <div className={`p-4 rounded-lg border ${getStatusColor(setupStatus.database)}`}>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(setupStatus.database)}
                  <div className="flex-1">
                    <h4 className="font-medium text-white">数据库连接</h4>
                    <p className="text-sm text-gray-400">连接到Supabase数据库</p>
                  </div>
                </div>
              </div>

              {/* Tables Creation */}
              <div className={`p-4 rounded-lg border ${getStatusColor(setupStatus.tables)}`}>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(setupStatus.tables)}
                  <div className="flex-1">
                    <h4 className="font-medium text-white">创建数据表</h4>
                    <p className="text-sm text-gray-400">创建功能分支、检验标准等数据表</p>
                  </div>
                </div>
              </div>

              {/* Initial Data */}
              <div className={`p-4 rounded-lg border ${getStatusColor(setupStatus.data)}`}>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(setupStatus.data)}
                  <div className="flex-1">
                    <h4 className="font-medium text-white">插入初始数据</h4>
                    <p className="text-sm text-gray-400">插入六大功能分支的基础数据</p>
                  </div>
                </div>
              </div>

              {/* Security Policies */}
              <div className={`p-4 rounded-lg border ${getStatusColor(setupStatus.policies)}`}>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(setupStatus.policies)}
                  <div className="flex-1">
                    <h4 className="font-medium text-white">配置安全策略</h4>
                    <p className="text-sm text-gray-400">设置行级安全策略和权限控制</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Setup Log */}
        {setupLog.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4">初始化日志</h3>
            <div className="bg-black/30 rounded-lg p-4 max-h-64 overflow-y-auto">
              {setupLog.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 mb-2 last:mb-0">
                  <span className="text-xs text-gray-500 mt-0.5 w-16 flex-shrink-0">
                    {log.timestamp}
                  </span>
                  <span className={`text-sm ${
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    'text-gray-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mt-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">系统信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                <strong className="text-white">Supabase URL:</strong><br />
                {process.env.NEXT_PUBLIC_SUPABASE_URL || '未配置'}
              </p>
              <p className="text-sm text-gray-400">
                <strong className="text-white">项目名称:</strong><br />
                FutureMindInstitute
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                <strong className="text-white">系统版本:</strong><br />
                v1.0.0
              </p>
              <p className="text-sm text-gray-400">
                <strong className="text-white">环境:</strong><br />
                {process.env.NODE_ENV || 'development'}
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}