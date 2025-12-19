import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '赛斯365 - 每日灵感壁纸',
  description: '赛斯365每日灵感壁纸，让智慧装点你的每一天'
}

export default function Seth365Layout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  )
}
