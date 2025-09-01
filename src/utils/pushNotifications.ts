// 推送通知管理器

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported')
      return false
    }

    try {
      // 注册Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered for push notifications')
      
      // 等待Service Worker激活
      await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return 'denied'
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return permission
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker not registered')
      return null
    }

    try {
      // 检查现有订阅
      this.subscription = await this.registration.pushManager.getSubscription()
      
      if (!this.subscription) {
        // 创建新订阅
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
          )
        })
      }

      return this.subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) return true

    try {
      await this.subscription.unsubscribe()
      this.subscription = null
      return true
    } catch (error) {
      console.error('Unsubscribe failed:', error)
      return false
    }
  }

  async sendLocalNotification(options: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/icon-72x72.png',
      tag: options.tag,
      data: options.data,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    })

    // 自动关闭通知
    setTimeout(() => {
      notification.close()
    }, 5000)

    // 点击处理
    notification.onclick = () => {
      window.focus()
      if (options.data?.url) {
        window.location.href = options.data.url
      }
      notification.close()
    }
  }

  // 预定义的通知类型
  async sendWelcomeNotification(): Promise<void> {
    await this.sendLocalNotification({
      title: '欢迎来到未来心灵学院！',
      body: '开始您的意识觉醒之旅，探索无限可能。',
      tag: 'welcome',
      data: { url: '/dashboard' }
    })
  }

  async sendDailyReminder(): Promise<void> {
    await this.sendLocalNotification({
      title: '每日意识觉醒提醒',
      body: '今天是探索内在智慧的好时机，来看看您的意识进化树吧！',
      tag: 'daily-reminder',
      data: { url: '/consciousness-tree' }
    })
  }

  async sendProjectUpdate(projectName: string): Promise<void> {
    await this.sendLocalNotification({
      title: '项目更新通知',
      body: `${projectName} 有新的进展，快来查看吧！`,
      tag: 'project-update',
      data: { url: '/projects' }
    })
  }

  async sendGaiaMessage(): Promise<void> {
    await this.sendLocalNotification({
      title: '盖亚有话对您说',
      body: '您的AI导师盖亚想要与您分享一些智慧洞察。',
      tag: 'gaia-message',
      data: { url: '/?gaia=true' }
    })
  }

  // 工具函数：将VAPID公钥转换为Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // 获取订阅状态
  isSubscribed(): boolean {
    return this.subscription !== null
  }

  // 获取订阅信息
  getSubscription(): PushSubscription | null {
    return this.subscription
  }
}

// 创建全局实例
export const pushManager = new PushNotificationManager()

// React Hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const initializePush = async () => {
      const supported = await pushManager.initialize()
      setIsSupported(supported)
      
      if (supported) {
        setPermission(Notification.permission)
        setIsSubscribed(pushManager.isSubscribed())
      }
    }

    initializePush()
  }, [])

  const subscribe = async (): Promise<boolean> => {
    const permission = await pushManager.requestPermission()
    setPermission(permission)
    
    if (permission === 'granted') {
      const subscription = await pushManager.subscribe()
      setIsSubscribed(!!subscription)
      return !!subscription
    }
    
    return false
  }

  const unsubscribe = async (): Promise<boolean> => {
    const success = await pushManager.unsubscribe()
    if (success) {
      setIsSubscribed(false)
    }
    return success
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    sendWelcomeNotification: pushManager.sendWelcomeNotification.bind(pushManager),
    sendDailyReminder: pushManager.sendDailyReminder.bind(pushManager),
    sendProjectUpdate: pushManager.sendProjectUpdate.bind(pushManager),
    sendGaiaMessage: pushManager.sendGaiaMessage.bind(pushManager)
  }
}
