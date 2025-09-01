// Service Worker for Future Mind Institute
// 移动端PWA支持和性能优化

const CACHE_NAME = 'futuremind-v1.0.0'
const STATIC_CACHE = 'futuremind-static-v1'
const DYNAMIC_CACHE = 'futuremind-dynamic-v1'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/consciousness-tree',
  '/courses',
  '/projects',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch(err => {
        console.error('Service Worker: Cache failed', err)
      })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// 网络请求拦截 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非GET请求和外部资源
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return
  }

  // 静态资源：缓存优先策略
  if (STATIC_ASSETS.includes(url.pathname) || 
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request)
            .then(fetchResponse => {
              const responseClone = fetchResponse.clone()
              caches.open(STATIC_CACHE)
                .then(cache => cache.put(request, responseClone))
              return fetchResponse
            })
        })
        .catch(() => {
          // 离线时的回退页面
          if (url.pathname === '/') {
            return caches.match('/offline.html')
          }
        })
    )
    return
  }

  // API请求：网络优先，缓存备用
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 只缓存成功的响应
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // 网络失败时使用缓存
          return caches.match(request)
        })
    )
    return
  }

  // 其他请求：网络优先策略
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  )
})

// 推送通知支持
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || '您有新的意识觉醒提醒',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: '查看详情',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: '稍后提醒'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '未来心灵学院', options)
  )
})

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})

// 后台同步支持
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 执行后台同步任务
      syncUserProgress()
    )
  }
})

// 同步用户进度数据
async function syncUserProgress() {
  try {
    // 获取离线时存储的数据
    const cache = await caches.open(DYNAMIC_CACHE)
    const requests = await cache.keys()
    
    // 同步用户进度数据
    for (const request of requests) {
      if (request.url.includes('/api/user-progress')) {
        await fetch(request)
      }
    }
    
    console.log('Service Worker: Background sync completed')
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}
