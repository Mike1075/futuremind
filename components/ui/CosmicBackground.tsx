"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CosmicBackground() {
  // 生成随机星星数据
  const [stars, setStars] = useState<{id: number, top: string, left: string, size: number, duration: number}[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1, // 1px - 3px
      duration: Math.random() * 3 + 2,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] bg-[#000000] overflow-hidden">
      {/* 唯一的环境光：底部极微弱的金色地平线光 */}
      <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-amber-900/10 to-transparent opacity-50"></div>

      {/* 星星层 */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{ duration: star.duration, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
        />
      ))}
    </div>
  );
}
