/**
 * 消息提示音工具
 * 使用 Web Audio API 生成简洁的提示音
 */

let audioContext: AudioContext | null = null

// 获取或创建 AudioContext
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
      console.warn('Web Audio API not supported')
      return null
    }
  }
  return audioContext
}

/**
 * 播放消息提示音
 * @param type 提示音类型: 'message' (收到消息), 'notification' (新通知)
 */
export function playNotificationSound(type: 'message' | 'notification' = 'notification') {
  const ctx = getAudioContext()
  if (!ctx) return

  // 恢复被暂停的 AudioContext（浏览器策略要求用户交互后才能播放）
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  const now = ctx.currentTime

  if (type === 'notification') {
    // 通知提示音：两个短音调（叮咚）
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now) // A5
    oscillator.frequency.setValueAtTime(1047, now + 0.1) // C6

    gainNode.gain.setValueAtTime(0.3, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    oscillator.start(now)
    oscillator.stop(now + 0.2)
  } else {
    // 消息提示音：单个柔和音调
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(659, now) // E5

    gainNode.gain.setValueAtTime(0.2, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    oscillator.start(now)
    oscillator.stop(now + 0.15)
  }
}

/**
 * 检查是否启用了消息提示音
 */
export function isNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const setting = localStorage.getItem('notificationSoundEnabled')
  return setting !== 'false' // 默认启用
}

/**
 * 设置消息提示音开关
 */
export function setNotificationSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem('notificationSoundEnabled', String(enabled))
}
