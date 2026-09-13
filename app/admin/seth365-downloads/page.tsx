'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Apple,
  Laptop,
  Plus,
  Save,
  Trash2,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DownloadInfo {
  platform: string
  version: string
  download_url: string | null
  release_notes: string | null
  updated_at: string
}

const platformConfig = {
  android: {
    title: 'Android',
    icon: Smartphone,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    placeholder: 'https://example.com/app.apk',
    hint: '直接下载链接，如 R2 存储的 APK 文件'
  },
  windows: {
    title: 'Windows',
    icon: Monitor,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    placeholder: 'https://example.com/app.exe',
    hint: '直接下载链接，如 R2 存储的 EXE 文件'
  },
  macos: {
    title: 'macOS',
    icon: Laptop,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    placeholder: 'https://example.com/app.dmg',
    hint: '直接下载链接，如 R2 存储的 DMG 文件'
  },
  ios: {
    title: 'iOS',
    icon: Apple,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    placeholder: 'appstore://seth365',
    hint: 'App Store 链接或 appstore://appname'
  }
}

const platforms = ['android', 'windows', 'macos', 'ios'] as const

export default function Seth365DownloadsAdmin() {
  const router = useRouter()
  const [downloads, setDownloads] = useState<Record<string, DownloadInfo>>({})
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    version: '',
    download_url: '',
    release_notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 加载下载数据
  const fetchDownloads = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seth365/downloads')
      const data = await res.json()

      if (Array.isArray(data)) {
        const downloadsMap: Record<string, DownloadInfo> = {}
        data.forEach((item: DownloadInfo) => {
          downloadsMap[item.platform] = item
        })
        setDownloads(downloadsMap)
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDownloads()
  }, [])

  // 开始编辑
  const startEdit = (platform: string) => {
    const existing = downloads[platform]
    setFormData({
      version: existing?.version || '1.0.0',
      download_url: existing?.download_url || '',
      release_notes: existing?.release_notes || ''
    })
    setEditingPlatform(platform)
  }

  // 保存
  const handleSave = async () => {
    if (!editingPlatform) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/seth365/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: editingPlatform,
          ...formData
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '保存失败')
      }

      setMessage({ type: 'success', text: '保存成功！' })
      setEditingPlatform(null)
      fetchDownloads()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '保存失败' })
    } finally {
      setSaving(false)
    }
  }

  // 删除（停用）
  const handleDelete = async (platform: string) => {
    if (!confirm(`确定要停用 ${platformConfig[platform as keyof typeof platformConfig].title} 的下载吗？`)) {
      return
    }

    try {
      const res = await fetch(`/api/seth365/downloads?platform=${platform}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '删除失败')
      }

      setMessage({ type: 'success', text: '已停用' })
      fetchDownloads()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '删除失败' })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">赛斯365 下载管理</h1>
              <p className="text-gray-400 text-sm">管理各平台客户端的下载链接</p>
            </div>
          </div>
          <button
            onClick={fetchDownloads}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* 使用说明 */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-blue-300 font-medium mb-2">使用说明</h3>
          <ul className="text-sm text-blue-200/70 space-y-1">
            <li>• 下载链接更新后，用户刷新页面即可看到最新版本</li>
            <li>• Android/Windows/macOS 填写直接下载链接（如 R2 存储链接）</li>
            <li>• iOS 填写 App Store 链接或 appstore://appname</li>
            <li>• 留空下载链接会显示"即将推出"</li>
            <li>• 用户可在客户端内点击"检查更新"下载最新版本</li>
          </ul>
        </div>

        {/* 平台列表 */}
        <div className="space-y-4">
          {platforms.map((platform) => {
            const config = platformConfig[platform]
            const info = downloads[platform]
            const Icon = config.icon
            const isEditing = editingPlatform === platform

            return (
              <motion.div
                key={platform}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
              >
                {/* 平台头部 */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{config.title}</h3>
                      {info ? (
                        <p className="text-sm text-gray-400">
                          v{info.version} · 更新于 {new Date(info.updated_at).toLocaleDateString('zh-CN')}
                        </p>
                      ) : (
                        <p className="text-sm text-amber-400">未配置</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {info?.download_url && (
                      <a
                        href={info.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        title="测试下载"
                      >
                        <ExternalLink className="w-4 h-4 text-white" />
                      </a>
                    )}
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => startEdit(platform)}
                          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 transition-colors"
                        >
                          {info ? '编辑' : <><Plus className="w-4 h-4" />添加</>}
                        </button>
                        {info && (
                          <button
                            onClick={() => handleDelete(platform)}
                            className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                            title="停用"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 编辑表单 */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 space-y-4"
                  >
                    {/* 版本号 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        版本号 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="1.0.0"
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    {/* 下载链接 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        下载链接
                      </label>
                      <input
                        type="url"
                        value={formData.download_url}
                        onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                        placeholder={config.placeholder}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">{config.hint}</p>
                    </div>

                    {/* 更新说明 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        更新说明
                      </label>
                      <textarea
                        value={formData.release_notes}
                        onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                        placeholder="本次更新内容..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                      />
                    </div>

                    {/* 按钮 */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditingPlatform(null)}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || !formData.version}
                        className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        保存
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 当前链接显示 */}
                {!isEditing && info?.download_url && (
                  <div className="px-4 py-3 bg-white/5 text-sm">
                    <span className="text-gray-500">链接：</span>
                    <span className="text-gray-300 break-all">{info.download_url}</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
