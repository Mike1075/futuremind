"use client";

import { motion } from "framer-motion";

export default function CosmicBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050510]">
      {/* 增强的星空噪点 */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100"></div>

      {/* 核心光球 1: 盖亚金 (左上) - 调高亮度到 0.6 */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-purple-600/30 blur-[100px]"
      />

      {/* 核心光球 2: 虚空紫 (右下) - 调高亮度到 0.6 */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-indigo-600/30 blur-[100px]"
      />

      {/* 核心光球 3: 能量蓝 (中间) */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] left-[50%] -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/20 blur-[120px]"
      />
    </div>
  );
}
