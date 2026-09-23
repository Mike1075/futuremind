import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * 订阅 Realtime 通道，通道不通时用定时轮询兜底。
 *
 * 浏览器端 Supabase 走本站同源转发（见 config.ts），而 Vercel 外部转发不代理 WebSocket，
 * 所以线上 Realtime 大概率连不上。策略：一上来就开轮询；通道真的 SUBSCRIBED 了就停掉轮询，
 * 之后掉线（TIMED_OUT / CHANNEL_ERROR / CLOSED）再把轮询开回来。返回清理函数，卸载时调用。
 */
export function subscribeWithPolling(
  channel: RealtimeChannel,
  refresh: () => void,
  intervalMs = 30_000,
): () => void {
  let timer: ReturnType<typeof setInterval> | null = null
  let disposed = false
  const startPolling = () => {
    if (disposed || timer) return
    timer = setInterval(refresh, intervalMs)
  }
  const stopPolling = () => {
    if (!timer) return
    clearInterval(timer)
    timer = null
  }

  startPolling()
  channel.subscribe((status) => {
    // removeChannel 之后会回调 CLOSED，此时绝不能把轮询再开回来
    if (disposed) return
    if (status === 'SUBSCRIBED') stopPolling()
    else startPolling()
  })

  return () => {
    disposed = true
    stopPolling()
    void channel.socket.removeChannel(channel)
  }
}
