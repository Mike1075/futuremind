"use client";

import { useMemo } from "react";

export default function CosmicBackground() {
  // 使用 useMemo 生成静态的星星投影字符串，避免重复计算
  // 这种 box-shadow 技术是渲染大量粒子最高效的方法
  const [smallStars, mediumStars, largeStars] = useMemo(() => {
    const generateSpace = (n: number) => {
      let value = `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`;
      for (let i = 2; i <= n; i++) {
        value += `, ${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`;
      }
      return value;
    };
    return [generateSpace(700), generateSpace(200), generateSpace(100)];
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
      {/* 唯一的环境光：底部极微弱的琥珀色辉光，增加层次感 */}
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-amber-900/20 via-transparent to-transparent opacity-40 pointer-events-none" />

      {/* 星星层：纯 CSS 驱动 */}
      <div className="absolute inset-0 animate-[move-twinkle_100s_linear_infinite]" style={{ boxShadow: smallStars, width: '1px', height: '1px', opacity: 0.4 }} />
      <div className="absolute inset-0 animate-[move-twinkle_150s_linear_infinite]" style={{ boxShadow: mediumStars, width: '2px', height: '2px', opacity: 0.6 }} />
      <div className="absolute inset-0 animate-[move-twinkle_200s_linear_infinite]" style={{ boxShadow: largeStars, width: '3px', height: '3px', opacity: 0.8 }} />
    </div>
  );
}
