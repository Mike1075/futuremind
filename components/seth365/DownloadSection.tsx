'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone,
  Monitor,
  Apple,
  Laptop,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  CloudDownload,
  QrCode
} from 'lucide-react'
import Image from 'next/image'

// 检测是否在微信浏览器中
const isWeChatBrowser = () => {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

type Platform = 'android' | 'windows' | 'ios' | 'macos'

interface DownloadData {
  platform: string
  version: string
  download_url: string | null
  release_notes: string | null
  updated_at: string
}

interface PlatformConfig {
  platform: Platform
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  features: string[]
  comingSoonText?: string
}

const platformConfigs: PlatformConfig[] = [
  {
    platform: 'android',
    title: 'Android 版',
    icon: Smartphone,
    description: '支持自动切换壁纸和锁屏，每日灵感触手可及',
    features: [
      '自动切换桌面壁纸',
      '自动切换锁屏壁纸',
      '多种切换触发方式（定时/解锁/Home键）',
      '支持中英文壁纸筛选',
      '支持竖版/横版壁纸筛选',
      '海报编辑器（替换二维码）',
      '完全离线使用，无需网络',
      '点击应用内"检查更新"获取最新版本'
    ]
  },
  {
    platform: 'windows',
    title: 'Windows 版',
    icon: Monitor,
    description: 'Windows 桌面客户端，让每日灵感装点你的电脑',
    features: [
      '自动切换桌面壁纸',
      '6种显示模式（模糊背景、裁切填充等）',
      '定时自动切换',
      '系统托盘常驻',
      '支持中英文壁纸筛选',
      '完全离线使用，无需网络',
      '点击应用内"检查更新"获取最新版本'
    ]
  },
  {
    platform: 'macos',
    title: 'macOS 版',
    icon: Laptop,
    description: 'Mac 桌面客户端，让每日灵感装点你的 Mac',
    features: [
      '自动切换桌面壁纸',
      '6种显示模式（模糊背景、裁切填充等）',
      '定时自动切换 + 后台切换',
      '菜单栏常驻',
      '支持中英文壁纸筛选',
      '完全离线使用，无需网络'
    ]
  },
  {
    platform: 'ios',
    title: 'iOS 版',
    icon: Apple,
    description: '在 App Store 搜索"Seth365"下载',
    features: [
      '打开 App Store，搜索"Seth365"',
      '找到应用后点击下载安装',
      '支持自动切换壁纸和锁屏'
    ]
  }
]

const androidInstructions = {
  title: 'Android 安装使用说明',
  sections: [
    {
      title: '1. 下载安装',
      steps: [
        '点击上方"下载"按钮下载 APK 文件',
        '下载完成后，点击通知栏中的下载完成提示',
        '如果提示"不允许安装未知应用"，请点击"设置"并开启权限',
        '返回后继续安装即可'
      ]
    },
    {
      title: '2. 授予权限',
      steps: [
        '首次打开应用时，需要授予"设置壁纸"权限',
        '如果开启自动切换，可能需要授予"后台运行"权限',
        '部分手机需要在设置中关闭"省电模式"以保证后台运行'
      ]
    },
    {
      title: '3. 检查更新',
      steps: [
        '打开应用后，点击右上角菜单',
        '选择"检查更新"',
        '如有新版本会提示下载更新'
      ]
    },
    {
      title: '4. 不同手机品牌特殊设置',
      brands: [
        {
          name: '小米/Redmi (MIUI)',
          steps: [
            '设置 → 应用设置 → 应用管理 → 找到 Seth365',
            '开启"自启动"权限',
            '省电策略选择"无限制"',
            '锁定后台：在多任务界面下拉应用卡片锁定'
          ]
        },
        {
          name: '华为/荣耀 (EMUI/HarmonyOS)',
          steps: [
            '设置 → 应用和服务 → 应用启动管理',
            '找到 Seth365，关闭"自动管理"，手动开启全部权限',
            '设置 → 电池 → 启动管理，允许后台运行'
          ]
        },
        {
          name: 'OPPO/realme (ColorOS)',
          steps: [
            '设置 → 应用管理 → 找到 Seth365',
            '开启"允许自启动"和"允许后台运行"',
            '电池 → 更多设置 → 优化电池使用，取消 Seth365'
          ]
        },
        {
          name: 'vivo (OriginOS/FuntouchOS)',
          steps: [
            '设置 → 电池 → 后台耗电管理',
            '找到 Seth365，选择"允许后台运行"',
            '设置 → 应用与权限 → 权限管理 → 自启动，开启 Seth365'
          ]
        },
        {
          name: '三星 (One UI)',
          steps: [
            '设置 → 应用程序 → 找到 Seth365',
            '电池 → 选择"不受限制"',
            '一般无需额外设置'
          ]
        }
      ]
    }
  ]
}

const windowsInstructions = {
  title: 'Windows 安装使用说明',
  sections: [
    {
      title: '1. 下载与解压',
      steps: [
        '点击上方"下载"按钮，下载 ZIP 压缩包',
        '右键点击 ZIP 文件 → 选择"解压到当前文件夹"（或"全部解压缩"）',
        '解压后会有 3 个文件：Seth365.exe（主程序）、Seth365_switch.exe（后台切换，无需手动运行）、使用说明.txt',
        '如果浏览器提示"不常见的下载"，点击保留即可'
      ]
    },
    {
      title: '2. 运行程序',
      steps: [
        '双击 Seth365.exe 即可启动',
        '如果 Windows 提示"已阻止"，点击"更多信息"→"仍要运行"',
        '运行后，应用会在系统托盘显示图标',
        '点击托盘图标打开主界面'
      ]
    },
    {
      title: '3. 基本使用',
      steps: [
        '选择日期查看壁纸，点击壁纸可设置为桌面',
        '开启自动切换后，会按设定间隔自动更换壁纸',
        '更多使用方法请查看解压后的「使用说明.txt」'
      ]
    },
    {
      title: '4. 显示模式说明',
      modes: [
        { name: '模糊背景（推荐）', desc: '完整显示壁纸，空白区域用模糊效果填充' },
        { name: '裁切填充', desc: '放大壁纸填满屏幕，超出部分裁切' },
        { name: '裁切顶部对齐', desc: '裁切填充，但保留顶部内容（适合锁屏）' },
        { name: '拉伸填充', desc: '拉伸壁纸填满屏幕，可能变形' },
        { name: '适配黑边', desc: '完整显示壁纸，空白区域用黑色填充' },
        { name: '适配白边', desc: '完整显示壁纸，空白区域用白色填充' }
      ]
    }
  ]
}

const macosInstructions = {
  title: 'macOS 安装使用说明',
  sections: [
    {
      title: '1. 下载安装',
      steps: [
        '点击上方"下载"按钮下载 DMG 文件',
        '双击 DMG 文件打开',
        '将 Seth365Mac 拖入"应用程序"文件夹'
      ]
    },
    {
      title: '2. 首次打开（重要）',
      steps: [
        '首次打开可能提示"无法打开"，这是正常的安全提示',
        '方法一：右键点击应用 → 选择"打开" → 点击"打开"',
        '方法二：系统设置 → 隐私与安全性 → 找到"已阻止" → 点击"仍要打开"',
        '后续打开无需重复此步骤'
      ]
    },
    {
      title: '3. 使用方法',
      steps: [
        '运行后，应用会在菜单栏显示图标',
        '点击菜单栏图标打开主界面',
        '选择日期查看壁纸，点击壁纸可设置为桌面',
        '开启"后台切换"可在关闭窗口后继续自动切换'
      ]
    },
    {
      title: '4. 显示模式说明',
      modes: [
        { name: '模糊背景（推荐）', desc: '完整显示壁纸，空白区域用模糊效果填充' },
        { name: '裁切填充', desc: '放大壁纸填满屏幕，超出部分裁切' },
        { name: '裁切顶部对齐', desc: '裁切填充，但保留顶部内容' },
        { name: '拉伸填充', desc: '拉伸壁纸填满屏幕，可能变形' },
        { name: '适配黑边', desc: '完整显示壁纸，空白区域用黑色填充' },
        { name: '适配白边', desc: '完整显示壁纸，空白区域用白色填充' }
      ]
    },
    {
      title: '5. 已知限制',
      steps: [
        '使用普通窗口模式时，「显示桌面」状态下壁纸切换会导致其他窗口恢复到桌面',
        '解决方法：点击桌面右上角切换到「台前调度」模式即可避免此问题',
        '或者：将切换间隔设置为 30 分钟或更长，减少打扰'
      ]
    }
  ]
}

export function DownloadSection() {
  const [downloads, setDownloads] = useState<Record<string, DownloadData>>({})
  const [loading, setLoading] = useState(true)
  const [expandedPlatform, setExpandedPlatform] = useState<Platform | null>(null)
  const [showInstructions, setShowInstructions] = useState<'android' | 'windows' | 'macos' | null>(null)
  const [isWeChat, setIsWeChat] = useState(false)
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null)
  const [showWeChatTip, setShowWeChatTip] = useState(false)

  // 检测微信浏览器
  useEffect(() => {
    setIsWeChat(isWeChatBrowser())
  }, [])

  // 复制下载链接
  const copyDownloadUrl = async (platform: Platform, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedPlatform(platform)
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 处理下载点击
  const handleDownloadClick = (e: React.MouseEvent, platform: Platform, url: string) => {
    if (isWeChat) {
      e.preventDefault()
      setShowWeChatTip(true)
      // 同时复制链接
      copyDownloadUrl(platform, url)
    }
  }

  // 从 API 获取下载信息
  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const res = await fetch('/api/seth365/downloads')
        const data = await res.json()

        if (Array.isArray(data)) {
          const downloadsMap: Record<string, DownloadData> = {}
          data.forEach((item: DownloadData) => {
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

    fetchDownloads()
  }, [])

  const toggleExpand = (platform: Platform) => {
    setExpandedPlatform(expandedPlatform === platform ? null : platform)
  }

  const getDownloadUrl = (platform: Platform): string | null => {
    const data = downloads[platform]
    if (!data?.download_url) return null
    // iOS 的 appstore:// 链接需要特殊处理
    if (platform === 'ios' && data.download_url.startsWith('appstore://')) {
      return null // 不提供直接下载，显示说明
    }
    return data.download_url
  }

  const getVersion = (platform: Platform): string | null => {
    return downloads[platform]?.version || null
  }

  const isAvailable = (platform: Platform): boolean => {
    const data = downloads[platform]
    return !!data?.download_url
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6"
    >
      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Download className="w-6 h-6 text-purple-400" />
        多平台客户端下载
      </h3>
      <p className="text-sm text-gray-400 mb-6">
        下载客户端可自动切换壁纸，应用内可检查更新
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {platformConfigs.map((item) => {
            const Icon = item.icon
            const isExpanded = expandedPlatform === item.platform
            const downloadUrl = getDownloadUrl(item.platform)
            const version = getVersion(item.platform)
            const available = isAvailable(item.platform)

            return (
              <div
                key={item.platform}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                {/* 平台头部 */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(item.platform)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        {item.title}
                        {version && (
                          <span className="text-xs text-gray-500 font-normal">
                            v{version}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {available ? (
                      downloadUrl ? (
                        <>
                          {/* 复制链接按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyDownloadUrl(item.platform, downloadUrl)
                            }}
                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-sm flex items-center gap-1.5 transition-colors"
                            title="复制下载链接"
                          >
                            {copiedPlatform === item.platform ? (
                              <>
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-green-400">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">复制链接</span>
                              </>
                            )}
                          </button>
                          {/* 下载按钮 */}
                          <a
                            href={downloadUrl}
                            download
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadClick(e, item.platform, downloadUrl)
                            }}
                            className="btn-stardust px-4 py-2 text-sm flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            下载
                          </a>
                        </>
                      ) : item.platform === 'ios' ? (
                        <span className="text-sm text-purple-400 px-4 py-2">
                          App Store
                        </span>
                      ) : null
                    ) : (
                      <span className="text-sm text-gray-500 px-4 py-2">
                        {item.comingSoonText || '即将推出'}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* 展开内容 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-white/10 pt-4">
                        {/* 功能特性 */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">
                            功能特性
                          </h5>
                          <ul className="space-y-1.5">
                            {item.features.map((feature, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2 text-sm text-gray-400"
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 更新说明 */}
                        {downloads[item.platform]?.release_notes && (
                          <div className="mb-4 bg-purple-500/10 rounded-lg p-3">
                            <h5 className="text-sm font-medium text-purple-300 mb-1">
                              更新说明 (v{version})
                            </h5>
                            <p className="text-sm text-gray-400">
                              {downloads[item.platform].release_notes}
                            </p>
                          </div>
                        )}

                        {/* 使用说明链接 */}
                        {(item.platform === 'android' || item.platform === 'windows' || item.platform === 'macos') && (
                          <button
                            onClick={() => setShowInstructions(item.platform as 'android' | 'windows' | 'macos')}
                            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <Info className="w-4 h-4" />
                            查看详细使用说明
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        {/* iOS 特殊提示 */}
                        {item.platform === 'ios' && (
                          <div className="flex items-start gap-2 text-sm text-purple-300 bg-purple-500/10 rounded-lg p-3">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>
                              💡 支持通过 iOS「快捷指令」实现每天自动换壁纸，详见 App 内「设置 → 自动换壁纸」指南
                            </span>
                          </div>
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* 备用下载通道 - 百度网盘 */}
      <div className="mt-6 bg-amber-500/10 rounded-xl border border-amber-500/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <CloudDownload className="w-5 h-5 text-amber-400" />
          <h4 className="font-semibold text-amber-300">备用下载通道</h4>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          如果上方下载链接无法使用（网络问题、地区限制等），可扫码从百度网盘下载
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          {/* 二维码 */}
          <div className="bg-white p-2 rounded-lg flex-shrink-0">
            <Image
              src="/seth365/baidu-pan-qr.png"
              alt="百度网盘下载二维码"
              width={120}
              height={120}
              className="w-[120px] h-[120px]"
            />
          </div>

          {/* 说明文字 */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-300 font-medium">扫码下载</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              网盘内包含所有平台安装包：
            </p>
            <ul className="text-xs text-gray-400 space-y-2">
              <li className="flex items-center gap-2">
                <Apple className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span>
                  <span className="text-gray-300">Seth365Mac_v1.3.0.dmg</span>
                  <span className="text-gray-500 ml-1">- 苹果电脑 Mac</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span>
                  <span className="text-gray-300">Seth365_v1.5.0.zip</span>
                  <span className="text-gray-500 ml-1">- Windows 电脑</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span>
                  <span className="text-gray-300">Seth365-v1.3.1.apk</span>
                  <span className="text-gray-500 ml-1">- 安卓手机</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 使用说明弹窗 */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowInstructions(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-2xl border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {showInstructions === 'android'
                    ? androidInstructions.title
                    : showInstructions === 'windows'
                      ? windowsInstructions.title
                      : macosInstructions.title}
                </h3>
                <button
                  onClick={() => setShowInstructions(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <span className="text-white">×</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {showInstructions === 'android' ? (
                  // Android 说明
                  androidInstructions.sections.map((section, index) => (
                    <div key={index}>
                      <h4 className="text-lg font-semibold text-purple-300 mb-3">
                        {section.title}
                      </h4>
                      {section.steps && (
                        <ol className="list-decimal list-inside space-y-2 text-gray-300">
                          {section.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      )}
                      {section.brands && (
                        <div className="space-y-4">
                          {section.brands.map((brand, i) => (
                            <div key={i} className="bg-white/5 rounded-lg p-4">
                              <h5 className="font-medium text-white mb-2">
                                {brand.name}
                              </h5>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                                {brand.steps.map((step, j) => (
                                  <li key={j}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : showInstructions === 'windows' ? (
                  // Windows 说明
                  windowsInstructions.sections.map((section, index) => (
                    <div key={index}>
                      <h4 className="text-lg font-semibold text-purple-300 mb-3">
                        {section.title}
                      </h4>
                      {section.steps && (
                        <ol className="list-decimal list-inside space-y-2 text-gray-300">
                          {section.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      )}
                      {section.modes && (
                        <div className="space-y-2">
                          {section.modes.map((mode, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className="text-purple-300 font-medium">
                                {mode.name}：
                              </span>
                              <span className="text-gray-400">{mode.desc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  // macOS 说明
                  macosInstructions.sections.map((section, index) => (
                    <div key={index}>
                      <h4 className="text-lg font-semibold text-purple-300 mb-3">
                        {section.title}
                      </h4>
                      {section.steps && (
                        <ol className="list-decimal list-inside space-y-2 text-gray-300">
                          {section.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      )}
                      {section.modes && (
                        <div className="space-y-2">
                          {section.modes.map((mode, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className="text-purple-300 font-medium">
                                {mode.name}：
                              </span>
                              <span className="text-gray-400">{mode.desc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 微信浏览器提示弹窗 */}
      <AnimatePresence>
        {showWeChatTip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowWeChatTip(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-2xl border border-white/20 p-6 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                请在浏览器中打开
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                微信内无法直接下载文件，下载链接已复制到剪贴板
              </p>

              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-300">
                  请点击右上角 <span className="text-purple-400">···</span> 按钮
                  <br />
                  选择 <span className="text-purple-400">"在浏览器中打开"</span>
                </p>
              </div>

              <button
                onClick={() => setShowWeChatTip(false)}
                className="w-full btn-stardust py-3"
              >
                我知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
