// 赛斯365 壁纸数据模型
// 复用自 Android/Windows 项目的跨平台设计

export type Language = 'C' | 'E' // Chinese / English
export type Orientation = 'S' | 'H' // Standing (竖版) / Horizontal (横版)

export interface Wallpaper {
  date: Date
  language: Language
  orientation: Orientation
  index: 1 | 2
}

// 项目启动日期（使用本地时间避免时区问题）
export const LAUNCH_DATE = new Date(2025, 11, 21) // 月份从0开始，11表示12月

// 生成文件名：25.12.21.CS1.webp
export function getFileName(wallpaper: Wallpaper): string {
  const year = wallpaper.date.getFullYear() % 100 // 25, 26...
  const month = wallpaper.date.getMonth() + 1
  const day = wallpaper.date.getDate()
  return `${year}.${month}.${day}.${wallpaper.language}${wallpaper.orientation}${wallpaper.index}.webp`
}

// 获取图片URL路径
export function getWallpaperUrl(wallpaper: Wallpaper): string {
  const year = wallpaper.date.getFullYear() % 100
  const month = String(wallpaper.date.getMonth() + 1).padStart(2, '0')
  const fileName = getFileName(wallpaper)
  return `/seth365/wallpapers/${year}/${month}/${fileName}`
}

// 获取显示名称
export function getDisplayName(wallpaper: Wallpaper): string {
  const langName = wallpaper.language === 'C' ? '中文' : '英文'
  const orientName = wallpaper.orientation === 'S' ? '竖版' : '横版'
  return `${langName}${orientName} ${wallpaper.index}`
}

// 获取某一天的8张壁纸
export function getWallpapersForDate(date: Date): Wallpaper[] {
  const wallpapers: Wallpaper[] = []
  const languages: Language[] = ['C', 'E']
  const orientations: Orientation[] = ['S', 'H']
  const indexes: (1 | 2)[] = [1, 2]

  for (const language of languages) {
    for (const orientation of orientations) {
      for (const index of indexes) {
        wallpapers.push({ date, language, orientation, index })
      }
    }
  }

  return wallpapers
}

// 筛选壁纸
export function filterWallpapers(
  wallpapers: Wallpaper[],
  language?: Language,
  orientation?: Orientation
): Wallpaper[] {
  return wallpapers.filter((w) => {
    if (language && w.language !== language) return false
    if (orientation && w.orientation !== orientation) return false
    return true
  })
}

// 检查日期是否已解锁
export function isDateUnlocked(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)

  // 必须 >= 启动日期 且 <= 今天
  return checkDate >= LAUNCH_DATE && checkDate <= today
}

// 获取最新已解锁的日期（今天或启动日期，取较小者）
export function getLatestUnlockedDate(): Date | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 如果还没到启动日期，返回 null
  if (today < LAUNCH_DATE) {
    return null
  }

  // 返回今天
  return today
}

// 检查是否已启动
export function isLaunched(): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today >= LAUNCH_DATE
}

// 计算距离启动的天数
export function getDaysUntilLaunch(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = LAUNCH_DATE.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// 获取某月的日期列表
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  return days
}

// 格式化日期显示
export function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 加载图片为 HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`图片加载失败: ${src}`))
    img.src = src
  })
}

// 触发浏览器下载一个 Blob
function triggerBlobDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // 释放对象 URL（延迟以确保下载已开始）
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

// 下载壁纸为标准 JPEG 格式
// 部分浏览器/系统对 .webp 兼容性不佳，统一转换为 JPEG 后下载，
// 同时使用 Blob URL 确保自定义文件名生效
export async function downloadWallpaperAsJpeg(
  wallpaper: Wallpaper,
  baseFileName: string
): Promise<void> {
  const url = getWallpaperUrl(wallpaper)
  const jpegFileName = `${baseFileName}.jpg`

  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建画布上下文')

    // JPEG 不支持透明通道，先填充白色背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.95)
    )
    if (!blob) throw new Error('图片转换失败')

    triggerBlobDownload(blob, jpegFileName)
  } catch {
    // 回退：直接下载原始 webp 文件
    const link = document.createElement('a')
    link.href = url
    link.download = `${baseFileName}.webp`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
