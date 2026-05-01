"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import consciousnessTreeAPI, { DomainScores } from '@/lib/api/consciousness-tree'

interface Vector2D {
  x: number
  y: number
}

interface Branch {
  position: Vector2D
  stw: number // strokeWidth
  gen: number // generation
  alive: boolean
  age: number
  angle: number
  speed: Vector2D
  index: number
  maxlife: number
  proba1: number
  proba2: number
  proba3: number
  proba4: number
  deviation: number
}

interface Root {
  startX: number
  startY: number
  endX: number
  endY: number
  thickness: number
  generation: number
  angle: number
  color: string
  domain: string
  depth_score: number
}

interface Tree {
  branches: Branch[]
  roots: Root[]
  start: Vector2D
  coeff: number
  teinte: number // base hue
  index: number
  proba1: number
  proba2: number
  proba3: number
  proba4: number
}

export function SimpleTree() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const treeRef = useRef<Tree | null>(null)
  const [domainScores, setDomainScores] = useState<DomainScores | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Balanced constants for elegant simplicity
  const maxlife = 18 // Moderate life span

  const createVector = (x: number, y: number): Vector2D => ({ x, y })

  const random = (min?: number, max?: number): number => {
    if (min === undefined) return Math.random()
    if (max === undefined) return Math.random() * min
    return min + Math.random() * (max - min)
  }

  const createRoots = (centerX: number, centerY: number): Root[] => {
    if (!domainScores) return []

    const roots: Root[] = []
    const domains = [
      { name: 'self_awareness', label: '自我觉察', score: domainScores.self_awareness.depth_score, angle: -90, color: '#8B5CF6' },
      { name: 'life_sciences', label: '生命科学', score: domainScores.life_sciences.depth_score, angle: -135, color: '#10B981' },
      { name: 'universal_laws', label: '宇宙法则', score: domainScores.universal_laws.depth_score, angle: -45, color: '#F59E0B' },
      { name: 'creative_expression', label: '创意表达', score: domainScores.creative_expression.depth_score, angle: -150, color: '#EC4899' },
      { name: 'social_connection', label: '社会连接', score: domainScores.social_connection.depth_score, angle: -30, color: '#3B82F6' }
    ]

    domains.forEach(domain => {
      const baseLength = Math.max(50, domain.score * 100) // 根据分数确定根的长度
      const angleRad = (domain.angle * Math.PI) / 180

      // 主根
      const mainRoot: Root = {
        startX: centerX,
        startY: centerY,
        endX: centerX + Math.cos(angleRad) * baseLength,
        endY: centerY + Math.sin(angleRad) * baseLength,
        thickness: Math.max(8, domain.score * 15),
        generation: 1,
        angle: domain.angle,
        color: domain.color,
        domain: domain.name,
        depth_score: domain.score
      }
      roots.push(mainRoot)

      // 分支根（基于分数生成更多分支）
      const branchCount = Math.floor(domain.score * 3) + 1
      for (let i = 0; i < branchCount; i++) {
        const branchAngle = domain.angle + random(-20, 20)
        const branchLength = baseLength * random(0.6, 0.8)
        const branchAngleRad = (branchAngle * Math.PI) / 180

        const branchRoot: Root = {
          startX: centerX + Math.cos(angleRad) * (baseLength * 0.3),
          startY: centerY + Math.sin(angleRad) * (baseLength * 0.3),
          endX: centerX + Math.cos(angleRad) * (baseLength * 0.3) + Math.cos(branchAngleRad) * branchLength,
          endY: centerY + Math.sin(angleRad) * (baseLength * 0.3) + Math.sin(branchAngleRad) * branchLength,
          thickness: Math.max(3, domain.score * 8),
          generation: 2,
          angle: branchAngle,
          color: domain.color,
          domain: domain.name,
          depth_score: domain.score
        }
        roots.push(branchRoot)
      }
    })

    return roots
  }

  const createTree = (width: number, height: number): Tree => {
    // Perfect center positioning
    const x = width / 2
    const y = height * 0.78 // Slightly lower for better visual balance
    const start = createVector(x, y)

    const tree: Tree = {
      branches: [],
      roots: createRoots(x, y),
      start,
      coeff: start.y / (height - 100),
      teinte: random(20, 40), // Warm, natural hues
      index: 0,
      // Moderate probabilities for elegant, not overwhelming growth
      proba1: random(0.75, 0.95),
      proba2: random(0.75, 0.95),
      proba3: random(0.45, 0.65),
      proba4: random(0.45, 0.65),
    }

    // Create trunk - elegant proportions
    const trunk: Branch = {
      position: { ...start },
      stw: 25 * Math.sqrt(start.y / height),
      gen: 1,
      alive: true,
      age: 0,
      angle: 0,
      speed: createVector(0, -3.2),
      index: 0,
      maxlife: maxlife * random(0.7, 1.2),
      proba1: tree.proba1,
      proba2: tree.proba2,
      proba3: tree.proba3,
      proba4: tree.proba4,
      deviation: random(0.5, 0.8), // Controlled elegant angles
    }

    tree.branches.push(trunk)
    return tree
  }

  const createBranch = (
    start: Vector2D,
    stw: number,
    angle: number,
    gen: number,
    index: number,
    tree: Tree,
  ): Branch => ({
    position: { ...start },
    stw,
    gen,
    alive: true,
    age: 0,
    angle,
    speed: createVector(0, -3.2),
    index,
    maxlife: maxlife * random(0.5, 1.0),
    proba1: tree.proba1,
    proba2: tree.proba2,
    proba3: tree.proba3,
    proba4: tree.proba4,
    deviation: random(0.5, 0.8),
  })

  const hsbToRgb = (h: number, s: number, b: number, a = 1): string => {
    h = Math.max(0, Math.min(360, h)) / 360
    s = Math.max(0, Math.min(255, s)) / 255
    b = Math.max(0, Math.min(255, b)) / 255

    const c = b * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = b - c

    let r = 0,
      g = 0,
      bl = 0

    if (0 <= h && h < 1 / 6) {
      r = c
      g = x
      bl = 0
    } else if (1 / 6 <= h && h < 2 / 6) {
      r = x
      g = c
      bl = 0
    } else if (2 / 6 <= h && h < 3 / 6) {
      r = 0
      g = c
      bl = x
    } else if (3 / 6 <= h && h < 4 / 6) {
      r = 0
      g = x
      bl = c
    } else if (4 / 6 <= h && h < 5 / 6) {
      r = x
      g = 0
      bl = c
    } else if (5 / 6 <= h && h < 1) {
      r = c
      g = 0
      bl = x
    }

    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    bl = Math.round((bl + m) * 255)

    return `rgba(${r}, ${g}, ${bl}, ${a})`
  }

  const growBranch = (branch: Branch, tree: Tree) => {
    if (!branch.alive) return

    branch.age++

    // Balanced death probability for elegant simplicity
    if (branch.age >= Math.floor(branch.maxlife / branch.gen) || random(1) < 0.025 * branch.gen) {
      branch.alive = false

      // Selective branching - only create branches when meaningful
      if (branch.stw > 0.4 && branch.gen < 5) {
        // Limit generation depth for simplicity
        const brs = tree.branches
        const pos = createVector(branch.position.x, branch.position.y)

        // More selective branching probabilities
        if (random(1) < branch.proba1 / Math.pow(branch.gen, 0.9)) {
          brs.push(
            createBranch(
              pos,
              branch.stw * random(0.5, 0.75), // Better size progression
              branch.angle + random(0.6, 1.0) * branch.deviation,
              branch.gen + 0.2,
              branch.index,
              tree,
            ),
          )
        }

        if (random(1) < branch.proba2 / Math.pow(branch.gen, 0.9)) {
          brs.push(
            createBranch(
              pos,
              branch.stw * random(0.5, 0.75),
              branch.angle - random(0.6, 1.0) * branch.deviation,
              branch.gen + 0.2,
              branch.index,
              tree,
            ),
          )
        }

        // Secondary branches - more selective
        if (branch.gen < 3 && random(1) < branch.proba3 / Math.pow(branch.gen, 1.1)) {
          brs.push(
            createBranch(
              pos,
              branch.stw * random(0.6, 0.8),
              branch.angle + random(0.3, 0.7) * branch.deviation,
              branch.gen + 0.15,
              branch.index,
              tree,
            ),
          )
        }

        if (branch.gen < 3 && random(1) < branch.proba4 / Math.pow(branch.gen, 1.1)) {
          brs.push(
            createBranch(
              pos,
              branch.stw * random(0.6, 0.8),
              branch.angle - random(0.3, 0.7) * branch.deviation,
              branch.gen + 0.15,
              branch.index,
              tree,
            ),
          )
        }
      }
    } else {
      // Gentle movement for elegant growth
      branch.speed.x += random(-0.15, 0.15)
    }
  }

  const displayBranch = (branch: Branch, tree: Tree, ctx: CanvasRenderingContext2D) => {
    const c = tree.coeff
    const st = tree.start
    const x0 = branch.position.x
    const y0 = branch.position.y

    // Update position with smooth movement
    branch.position.x += -branch.speed.x * Math.cos(branch.angle) + branch.speed.y * Math.sin(branch.angle)
    branch.position.y += branch.speed.x * Math.sin(branch.angle) + branch.speed.y * Math.cos(branch.angle)

    // Subtle shadows
    const shadowColor = hsbToRgb(tree.teinte + branch.age + 10 * branch.gen, 15, 15, 0.06)
    ctx.strokeStyle = shadowColor
    const shadowWidth = branch.stw * 1.2 - (branch.age / branch.maxlife) * (branch.stw * 0.4)
    ctx.lineWidth = Math.max(0.5, shadowWidth)

    const dis = 0.008 * Math.pow(Math.abs(st.y - y0), 1.3)

    ctx.beginPath()
    ctx.moveTo(x0 + dis, 2 * st.y - y0 + dis)
    ctx.lineTo(branch.position.x + dis, 2 * st.y - branch.position.y + dis)
    ctx.stroke()

    // Light accent - subtle
    const lightHue = tree.teinte + branch.age + 18 * branch.gen
    const lightColor = hsbToRgb(lightHue, 120 * c, 200 + 12 * branch.gen, (20 * c) / 100)
    ctx.strokeStyle = lightColor
    const lightWidth = branch.stw * 0.8 - (branch.age / branch.maxlife) * (branch.stw * 0.3)
    ctx.lineWidth = Math.max(0.3, lightWidth)

    ctx.beginPath()
    ctx.moveTo(x0 + 0.12 * branch.stw, y0)
    ctx.lineTo(branch.position.x + 0.12 * branch.stw, branch.position.y)
    ctx.stroke()

    // Main branch with elegant colors
    const mainHue = tree.teinte + branch.age + 15 * branch.gen
    const mainSat = Math.min(180, 100 * c + 15 * branch.gen)
    const mainBright = Math.min(150, 70 + 12 * branch.gen)
    const mainColor = hsbToRgb(mainHue, mainSat, mainBright, (22 * c) / 100)
    ctx.strokeStyle = mainColor
    const mainWidth = branch.stw - (branch.age / branch.maxlife) * (branch.stw * 0.4)
    ctx.lineWidth = Math.max(0.2, mainWidth)

    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(branch.position.x, branch.position.y)
    ctx.stroke()

    // Subtle highlight for main branches only
    if (branch.gen < 2) {
      const highlightColor = hsbToRgb(mainHue + 8, mainSat * 0.5, mainBright + 30, (12 * c) / 100)
      ctx.strokeStyle = highlightColor
      ctx.lineWidth = Math.max(0.1, mainWidth * 0.25)

      ctx.beginPath()
      ctx.moveTo(x0 - 0.08 * branch.stw, y0)
      ctx.lineTo(branch.position.x - 0.08 * branch.stw, branch.position.y)
      ctx.stroke()
    }
  }

  const drawRoots = (roots: Root[], ctx: CanvasRenderingContext2D) => {
    roots.forEach(root => {
      // 绘制根系阴影
      ctx.strokeStyle = `${root.color}20`
      ctx.lineWidth = root.thickness + 2
      ctx.beginPath()
      ctx.moveTo(root.startX + 2, root.startY + 2)
      ctx.lineTo(root.endX + 2, root.endY + 2)
      ctx.stroke()

      // 绘制主根
      ctx.strokeStyle = root.color
      ctx.lineWidth = root.thickness
      ctx.beginPath()
      ctx.moveTo(root.startX, root.startY)
      ctx.lineTo(root.endX, root.endY)
      ctx.stroke()

      // 绘制根尖发光效果
      if (root.generation === 1) {
        const gradient = ctx.createRadialGradient(
          root.endX, root.endY, 0,
          root.endX, root.endY, root.thickness
        )
        gradient.addColorStop(0, `${root.color}80`)
        gradient.addColorStop(1, `${root.color}00`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(root.endX, root.endY, root.thickness, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  const setup = useCallback(() => {
    if (!canvasRef.current || !domainScores) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Clean, elegant background
    const bgColor = hsbToRgb(42, 12, 248)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Very subtle vignette
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) * 0.9,
    )
    gradient.addColorStop(0, "rgba(0,0,0,0)")
    gradient.addColorStop(1, "rgba(0,0,0,0.02)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Create elegant tree
    treeRef.current = createTree(canvas.width, canvas.height)
  }, [domainScores])

  const draw = useCallback(() => {
    if (!canvasRef.current || !treeRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 绘制根系
    if (treeRef.current.roots.length > 0) {
      drawRoots(treeRef.current.roots, ctx)
    }

    // Tree grows once per frame
    const tree = treeRef.current
    let hasAliveBranches = false

    tree.branches.forEach((branch) => {
      if (branch.alive) {
        hasAliveBranches = true
        growBranch(branch, tree)
        displayBranch(branch, tree, ctx)
      }
    })

    // Continue animation with elegant frame rate
    if (hasAliveBranches) {
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(draw)
      }, 1000 / 90) // Smooth 90fps
    }
  }, [])

  const handleClick = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setup()
    draw()
  }

  // 加载领域数据
  useEffect(() => {
    const loadDomainData = async () => {
      setIsLoading(true)
      try {
        const result = await consciousnessTreeAPI.getDomainExploration()
        if (result.success && result.data) {
          setDomainScores(result.data.domain_scores)
        } else {
          // 使用默认值
          setDomainScores({
            self_awareness: { depth_score: 0.3 },
            life_sciences: { depth_score: 0.2 },
            universal_laws: { depth_score: 0.4 },
            creative_expression: { depth_score: 0.5 },
            social_connection: { depth_score: 0.3 }
          })
        }
      } catch (error) {
        console.error('加载领域数据失败:', error)
        // 使用默认值
        setDomainScores({
          self_awareness: { depth_score: 0.3 },
          life_sciences: { depth_score: 0.2 },
          universal_laws: { depth_score: 0.4 },
          creative_expression: { depth_score: 0.5 },
          social_connection: { depth_score: 0.3 }
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDomainData()
  }, [])

  useEffect(() => {
    if (domainScores && !isLoading) {
      setup()
      draw()
    }

    const handleResize = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (domainScores && !isLoading) {
        setup()
        draw()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [setup, draw, domainScores, isLoading])

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载意识树数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 cursor-pointer" onClick={handleClick} />

      {/* Minimal elegant overlay */}
      <div className="absolute bottom-6 right-6 text-xs text-black/20 font-light">点击生长新的意识树</div>

      {/* Clean title */}
      <div className="absolute top-6 left-6 text-black/25">
        <h1 className="text-2xl font-extralight tracking-wider">意识根系</h1>
        <p className="text-sm font-light mt-1 opacity-80">五域共生</p>
      </div>

      {/* 领域信息显示 */}
      {domainScores && (
        <div className="absolute top-6 right-6 text-xs text-black/30 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#8B5CF6'}}></div>
            <span>自我觉察: {(domainScores.self_awareness.depth_score * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#10B981'}}></div>
            <span>生命科学: {(domainScores.life_sciences.depth_score * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#F59E0B'}}></div>
            <span>宇宙法则: {(domainScores.universal_laws.depth_score * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#EC4899'}}></div>
            <span>创意表达: {(domainScores.creative_expression.depth_score * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#3B82F6'}}></div>
            <span>社会连接: {(domainScores.social_connection.depth_score * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}