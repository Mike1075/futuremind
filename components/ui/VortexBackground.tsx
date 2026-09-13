"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";
import { motion } from "framer-motion";

interface VortexBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /** 粒子数量，默认 500 */
  particleCount?: number;
  /** Y轴范围，默认 800 */
  rangeY?: number;
  /** 基础色相（HSL），默认 280（紫色） */
  baseHue?: number;
  /** 色相范围，默认 100 */
  rangeHue?: number;
  /** 基础速度，默认 0.033 */
  baseSpeed?: number;
  /** 速度范围，默认 0.67 */
  rangeSpeed?: number;
  /** 基础半径，默认 1 */
  baseRadius?: number;
  /** 半径范围，默认 2 */
  rangeRadius?: number;
  /** 背景色，默认 #000000 */
  backgroundColor?: string;
}

/**
 * Vortex 彩色粒子背景组件
 * 基于 Canvas + simplex-noise 实现流动的彩色星光效果
 */
export function VortexBackground(props: VortexBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 配置参数
  const particleCount = props.particleCount || 500;
  const particlePropCount = 9;
  const particlePropsLength = particleCount * particlePropCount;
  const rangeY = props.rangeY || 800;
  const baseTTL = 50;
  const rangeTTL = 150;
  const baseSpeed = props.baseSpeed || 0.033;
  const rangeSpeed = props.rangeSpeed || 0.67;
  const baseRadius = props.baseRadius || 1;
  const rangeRadius = props.rangeRadius || 2;
  const baseHue = props.baseHue || 280;
  const rangeHue = props.rangeHue || 100;
  const noiseSteps = 3;
  const xOff = 0.00125;
  const yOff = 0.00125;
  const zOff = 0.0005;
  const backgroundColor = props.backgroundColor || "#000000";

  // 内部状态 refs
  const tickRef = useRef(0);
  const noise3DRef = useRef(createNoise3D());
  const particlePropsRef = useRef(new Float32Array(particlePropsLength));
  const centerRef = useRef<[number, number]>([0, 0]);
  const animationRef = useRef<number | null>(null);

  // 数学工具函数
  const TAU: number = 2 * Math.PI;
  const rand = (n: number): number => n * Math.random();
  const randRange = (n: number): number => n - rand(2 * n);
  const fadeInOut = (t: number, m: number): number => {
    const hm = 0.5 * m;
    return Math.abs(((t + hm) % m) - hm) / hm;
  };
  const lerp = (n1: number, n2: number, speed: number): number =>
    (1 - speed) * n1 + speed * n2;

  // 初始化单个粒子
  const initParticle = (i: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = rand(canvas.width);
    const y = centerRef.current[1] + randRange(rangeY);
    const vx = 0;
    const vy = 0;
    const life = 0;
    const ttl = baseTTL + rand(rangeTTL);
    const speed = baseSpeed + rand(rangeSpeed);
    const radius = baseRadius + rand(rangeRadius);
    const hue = baseHue + rand(rangeHue);

    particlePropsRef.current.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  };

  // 初始化所有粒子
  const initParticles = () => {
    tickRef.current = 0;
    particlePropsRef.current = new Float32Array(particlePropsLength);

    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      initParticle(i);
    }
  };

  // 绘制单个粒子
  const drawParticle = (
    x: number,
    y: number,
    x2: number,
    y2: number,
    life: number,
    ttl: number,
    radius: number,
    hue: number,
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = radius;
    ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };

  // 检查粒子是否超出边界
  const checkBounds = (x: number, y: number, canvas: HTMLCanvasElement) => {
    return x > canvas.width || x < 0 || y > canvas.height || y < 0;
  };

  // 更新单个粒子
  const updateParticle = (i: number, ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const i2 = 1 + i,
      i3 = 2 + i,
      i4 = 3 + i,
      i5 = 4 + i,
      i6 = 5 + i,
      i7 = 6 + i,
      i8 = 7 + i,
      i9 = 8 + i;

    const x = particlePropsRef.current[i];
    const y = particlePropsRef.current[i2];
    const n = noise3DRef.current(x * xOff, y * yOff, tickRef.current * zOff) * noiseSteps * TAU;
    const vx = lerp(particlePropsRef.current[i3], Math.cos(n), 0.5);
    const vy = lerp(particlePropsRef.current[i4], Math.sin(n), 0.5);
    let life = particlePropsRef.current[i5];
    const ttl = particlePropsRef.current[i6];
    const speed = particlePropsRef.current[i7];
    const x2 = x + vx * speed;
    const y2 = y + vy * speed;
    const radius = particlePropsRef.current[i8];
    const hue = particlePropsRef.current[i9];

    drawParticle(x, y, x2, y2, life, ttl, radius, hue, ctx);

    life++;

    particlePropsRef.current[i] = x2;
    particlePropsRef.current[i2] = y2;
    particlePropsRef.current[i3] = vx;
    particlePropsRef.current[i4] = vy;
    particlePropsRef.current[i5] = life;

    if (checkBounds(x, y, canvas) || life > ttl) {
      initParticle(i);
    }
  };

  // 绘制所有粒子
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      updateParticle(i, ctx);
    }
  };

  // 渲染发光效果
  const renderGlow = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.save();
    ctx.filter = "blur(8px) brightness(200%)";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.filter = "blur(4px) brightness(200%)";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  };

  // 渲染到屏幕
  const renderToScreen = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  };

  // 主绘制循环
  const draw = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    tickRef.current++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawParticles(ctx);
    renderGlow(canvas, ctx);
    renderToScreen(canvas, ctx);

    animationRef.current = window.requestAnimationFrame(() => draw(canvas, ctx));
  };

  // 调整 canvas 大小
  const resize = (canvas: HTMLCanvasElement) => {
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    centerRef.current[0] = 0.5 * canvas.width;
    centerRef.current[1] = 0.5 * canvas.height;
  };

  // 初始化设置
  const setup = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        resize(canvas);
        initParticles();
        draw(canvas, ctx);
      }
    }
  };

  useEffect(() => {
    setup();

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        resize(canvas);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative h-full w-full", props.containerClassName)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={containerRef}
        className="absolute h-full w-full inset-0 z-0 bg-transparent flex items-center justify-center"
      >
        <canvas ref={canvasRef}></canvas>
      </motion.div>

      <div className={cn("relative z-10", props.className)}>
        {props.children}
      </div>
    </div>
  );
}

/**
 * 全屏 Vortex 背景（用于替换 CosmicBackground）
 * 固定在屏幕底层，不影响页面内容
 */
export default function VortexBackgroundFixed() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      <VortexBackground
        backgroundColor="#000000"
        rangeY={800}
        particleCount={400}
        baseHue={280}
        rangeHue={120}
        baseSpeed={0.033}
        rangeSpeed={0.67}
        baseRadius={1}
        rangeRadius={2}
        containerClassName="absolute inset-0"
      />
    </div>
  );
}
