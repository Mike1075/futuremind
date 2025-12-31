"use client";

import VortexBackgroundFixed from "./VortexBackground";

/**
 * 宇宙背景组件
 * 现在使用 VortexBackground 提供彩色流动粒子效果
 *
 * 如需切换回原有的静态星空效果，可取消注释下方的 OldCosmicBackground
 */
export default function CosmicBackground() {
  // 新版：彩色流动粒子背景
  return <VortexBackgroundFixed />;
}

// ============================================
// 原版静态星空背景（备用）
// ============================================
// import { useMemo } from "react";
//
// function OldCosmicBackground() {
//   const [smallStars, mediumStars, largeStars] = useMemo(() => {
//     const generateSpace = (n: number) => {
//       let value = `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`;
//       for (let i = 2; i <= n; i++) {
//         value += `, ${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`;
//       }
//       return value;
//     };
//     return [generateSpace(700), generateSpace(200), generateSpace(100)];
//   }, []);
//
//   return (
//     <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
//       <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-amber-900/20 via-transparent to-transparent opacity-40 pointer-events-none" />
//       <div className="absolute inset-0 animate-[move-twinkle_100s_linear_infinite]" style={{ boxShadow: smallStars, width: '1px', height: '1px', opacity: 0.4 }} />
//       <div className="absolute inset-0 animate-[move-twinkle_150s_linear_infinite]" style={{ boxShadow: mediumStars, width: '2px', height: '2px', opacity: 0.6 }} />
//       <div className="absolute inset-0 animate-[move-twinkle_200s_linear_infinite]" style={{ boxShadow: largeStars, width: '3px', height: '3px', opacity: 0.8 }} />
//     </div>
//   );
// }
