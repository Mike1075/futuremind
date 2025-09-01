'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Monitor, 
  TreePine, 
  MessageCircle, 
  Database, 
  Zap,
  Shield,
  Save,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Module {
  id: string
  name: string
  module_id: string
  description: string
  preview_url: string | null
  status: string
  icon: any
  color: string
}

export default function ModulesPage() {
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const moduleIcons = {
    ui: { icon: Monitor, color: 'blue' },
    consciousness_tree: { icon: TreePine, color: 'green' },
    ai_dialogue: { icon: MessageCircle, color: 'purple' },
    auth: { icon: Shield, color: 'red' },
    database: { icon: Database, color: 'yellow' },
    performance: { icon: Zap, color: 'pink' }
  }

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '获取模块数据失败')
      }

      const modulesData = result.modules || []
      const modulesWithIcons = modulesData.map((module: any) => ({
        ...module,
        ...moduleIcons[module.module_id as keyof typeof moduleIcons]
      }))

      setModules(modulesWithIcons)
    } catch (error) {
      console.error('Error fetching modules:', error)
      setMessage({ type: 'error', text: '获取模块数据失败' })
      
      // 如果获取失败，使用默认数据
      const defaultModules = [
        { id: 1, module_id: 'ui', name: '主应用界面', preview_url: '', repository_url: '', description: '用户界面和交互设计' },
        { id: 2, module_id: 'consciousness_tree', name: '意识进化树', preview_url: '', repository_url: '', description: '意识发展可视化系统' },
        { id: 3, module_id: 'ai_dialogue', name: 'Gaia AI对话', preview_url: '', repository_url: '', description: 'AI智能对话系统' },
        { id: 4, module_id: 'auth', name: '用户认证系统', preview_url: '', repository_url: '', description: '登录注册和权限管理' },
        { id: 5, module_id: 'database', name: '数据库架构', preview_url: '', repository_url: '', description: '数据存储和管理系统' },
        { id: 6, module_id: 'performance', name: '整体性能', preview_url: '', repository_url: '', description: '系统性能和优化' }
      ]
      
      const modulesWithIcons = defaultModules.map(module => ({
        ...module,
        ...moduleIcons[module.module_id as keyof typeof moduleIcons]
      }))
      
      setModules(modulesWithIcons)
    } finally {
      setLoading(false)
    }
  }

  const updateModuleUrl = async (moduleId: string, url: string) => {
    setSaving(moduleId)
    try {
      const { error } = await supabase
        .from('project_modules')
        .update({ 
          preview_url: url,
          status: url ? 'configured' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('module_id', moduleId)

      if (error) throw error

      setModules(prev => prev.map(module => 
        module.module_id === moduleId 
          ? { ...module, preview_url: url, status: url ? 'configured' : 'pending' }
          : module
      ))

      setMessage({ type: 'success', text: '保存成功！' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error updating module:', error)
      setMessage({ type: 'error', text: '保存失败，请重试' })
    } finally {
      setSaving(null)
    }
  }

  const handleUrlChange = (moduleId: string, url: string) => {
    setModules(prev => prev.map(module => 
      module.module_id === moduleId 
        ? { ...module, preview_url: url }
        : module
    ))
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-400',
      green: 'from-green-500 to-green-400',
      purple: 'from-purple-500 to-purple-400',
      red: 'from-red-500 to-red-400',
      yellow: 'from-yellow-500 to-yellow-400',
      pink: 'from-pink-500 to-pink-400'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/inspection')}
                className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <Shield className="w-8 h-8 text-purple-400 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                模块配置管理
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 消息提示 */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* 说明卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">📋 配置说明</h2>
          <div className="text-gray-300 space-y-2">
            <p>• <strong>预览链接：</strong>请输入开发团队提供的各模块预览地址（如：https://example.com/ui-demo）</p>
            <p>• <strong>链接要求：</strong>必须是可访问的HTTP/HTTPS地址，用于iframe嵌入检测</p>
            <p>• <strong>保存提示：</strong>输入链接后点击"保存"按钮，系统会自动验证并保存配置</p>
            <p>• <strong>检测准备：</strong>配置完成后即可在检测中心进行详细的质量检测</p>
          </div>
        </motion.div>

        {/* 模块配置卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((module, index) => {
            const IconComponent = module.icon
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
              >
                <div className="flex items-center mb-4">
                  <IconComponent className={`w-8 h-8 text-${module.color}-400 mr-3`} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                    <p className="text-gray-400 text-sm">{module.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 状态指示 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">配置状态：</span>
                    <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      module.status === 'configured' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {module.status === 'configured' ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          已配置
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          待配置
                        </>
                      )}
                    </div>
                  </div>

                  {/* URL输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      预览链接
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={module.preview_url || ''}
                        onChange={(e) => handleUrlChange(module.module_id, e.target.value)}
                        placeholder="https://example.com/module-preview"
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => updateModuleUrl(module.module_id, module.preview_url || '')}
                        disabled={saving === module.module_id}
                        className={`px-4 py-2 bg-gradient-to-r ${getColorClasses(module.color)} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                      >
                        {saving === module.module_id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        保存
                      </button>
                    </div>
                  </div>

                  {/* 预览链接 */}
                  {module.preview_url && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-gray-300 truncate mr-2">
                        {module.preview_url}
                      </span>
                      <a
                        href={module.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 操作提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">🚀 下一步操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">1. 配置完成后</h4>
              <ul className="space-y-1">
                <li>• 返回检测中心查看配置状态</li>
                <li>• 点击"详细检测"开始专业评估</li>
                <li>• 使用提供的检测标准和提示词</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">2. 检测建议</h4>
              <ul className="space-y-1">
                <li>• 确保预览链接可正常访问</li>
                <li>• 建议在不同浏览器中测试</li>
                <li>• 记录检测过程中的问题和建议</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}