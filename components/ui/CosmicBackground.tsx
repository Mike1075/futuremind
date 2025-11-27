"use client";

import { motion } from "framer-motion";

export default function CosmicBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#030014]">
      {/* 核心深空层 */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>

      {/* 动态光球 1: 盖亚金 */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-amber-500/20 blur-[120px]"
      />

      {/* 动态光球 2: 虚空紫 */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -50, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[10%] h-[600px] w-[600px] rounded-full bg-purple-800/20 blur-[120px]"
      />

      {/* 动态光球 3: 灵性能量蓝 */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-[40%] left-[50%] -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-blue-900/10 blur-[120px]"
      />

      {/* 星尘粒子 (可以是简单的CSS动画点) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/80"></div>
    </div>
  );
}
