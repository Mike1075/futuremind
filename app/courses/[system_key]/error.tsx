// @ts-nocheck
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('课程页面错误:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-cosmic-deep/50 to-mystic-purple/20" />
      <div className="text-center relative z-10 max-w-md mx-auto px-6">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-starlight mb-3">页面加载出错</h2>
        <p className="text-starlight-muted mb-6 text-sm">
          {error.message || '加载课程时遇到问题，请稍后重试'}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="btn-stardust px-6 py-2.5"
          >
            重新加载
          </button>
          <Link
            href="/portal"
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-starlight rounded-lg border border-white/20 transition-all"
          >
            返回门户
          </Link>
        </div>
      </div>
    </div>
  )
}
