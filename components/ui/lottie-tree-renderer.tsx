'use client'

import { useEffect, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import animationData from '@/public/animations/growing-plant.json'

interface LottieTreeRendererProps {
  levelProgress: number // 0-100
  consciousnessLevel?: number
  domainDepths?: Record<string, number>
  className?: string
}

export function LottieTreeRenderer({
  levelProgress,
  consciousnessLevel,
  domainDepths,
  className = '',
}: LottieTreeRendererProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  useEffect(() => {
    if (lottieRef.current) {
      // 获取动画总帧数
      const totalFrames = lottieRef.current.getDuration(true)

      // 根据levelProgress计算目标帧
      // levelProgress: 0-100 映射到 0-totalFrames
      const targetFrame = (levelProgress / 100) * totalFrames

      // 跳转到目标帧并暂停
      lottieRef.current.goToAndStop(targetFrame, true)
    }
  }, [levelProgress])

  return (
    <div className={`relative ${className}`}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={false}
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* 调试信息 */}
      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
        <div>进度: {levelProgress.toFixed(1)}%</div>
        {consciousnessLevel && <div>等级: {consciousnessLevel}</div>}
        {lottieRef.current && (
          <div>
            帧: {Math.floor((levelProgress / 100) * lottieRef.current.getDuration(true))} / {Math.floor(lottieRef.current.getDuration(true))}
          </div>
        )}
      </div>
    </div>
  )
}
