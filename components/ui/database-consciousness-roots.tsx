"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import consciousnessTreeAPI, { ConsciousnessTreeView } from '@/lib/api/consciousness-tree'
import { createClient } from '@/lib/supabase/client'
import { getTreeStage, getTreeScaling, type TreeStage } from '@/lib/consciousness/tree-stage-config'

// Mock mode props interface
interface MockModeProps {
  mockMode?: boolean
  mockLevel?: number
  mockProgress?: number
  mockDomains?: {
    self_awareness?: number
    life_sciences?: number
    universal_laws?: number
    creative_expression?: number
    social_connection?: number
  }
}

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
  domainColor?: number // Domain-specific color for branches
  isDomainRoot?: boolean // Mark domain root branches
}

interface Tree {
  branches: Branch[]
  start: Vector2D
  coeff: number
  teinte: number // base hue
  index: number
  proba1: number
  proba2: number
  proba3: number
  proba4: number
}

// Domain state management - 使用数据库的五个领域
interface DomainState {
  name: string
  color: number
  depth: number
  branches: number[]
  db_score: number // 数据库中的深度分数
}

export function DatabaseConsciousnessRoots({
  mockMode = false,
  mockLevel = 1,
  mockProgress = 0,
  mockDomains = {}
}: MockModeProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const treeRef = useRef<Tree | null>(null)
  const [treeView, setTreeView] = useState<ConsciousnessTreeView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [consciousnessLevel, setConsciousnessLevel] = useState(1) // 用户意识等级
  const [levelProgress, setLevelProgress] = useState(0) // 等级内进度 0-100
  const [compositeScore, setCompositeScore] = useState(0) // 综合评分 0-100 (保留向后兼容)

  // 数据库五个领域配置 - 替换前端小姐姐的科学、艺术、哲学
  const [domains, setDomains] = useState<Record<string, DomainState>>({
    self_awareness: { name: '🧘 自我觉察', color: 280, depth: 0, branches: [], db_score: 0 },
    life_sciences: { name: '🧬 生命科学', color: 120, depth: 0, branches: [], db_score: 0 },
    universal_laws: { name: '🌌 宇宙法则', color: 45, depth: 0, branches: [], db_score: 0 },
    creative_expression: { name: '🎨 创意表达', color: 300, depth: 0, branches: [], db_score: 0 },
    social_connection: { name: '🤝 社会连接', color: 200, depth: 0, branches: [], db_score: 0 }
  })

  // MOUSE HOVER STATE - 鼠标悬浮状态
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)

  // 树干状态管理 - 冥想系统
  const [trunkThickness, setTrunkThickness] = useState(1.0) // 树干粗细倍数，默认1.0
  const MAX_TRUNK_THICKNESS = 3.0 // 最大粗细倍数
  const THICKNESS_INCREMENT = 0.1 // 每次冥想增加的粗细

  // 冥想处理函数
  const handleMeditation = () => {
    setTrunkThickness(prev => {
      const newThickness = Math.min(prev + THICKNESS_INCREMENT, MAX_TRUNK_THICKNESS)
      return newThickness
    })
  }
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)

  // 标准化数据库分数到0-1范围
  const normalizeScore = (score: number): number => {
    // 如果分数大于1，说明是旧的大数值系统，需要标准化
    if (score > 1) {
      return Math.min(1.0, score / 20.0) // 除以20来标准化，最大不超过1
    }
    return score // 已经是0-1范围的正确值
  }

  // 根据意识等级返回基础色调
  const getLevelBaseHue = (level: number): number => {
    const levelHues: Record<number, number> = {
      1: 110,  // 初醒者 - 嫩绿色 (新生、发芽)
      2: 150,  // 探索者 - 青绿色 (成长)
      3: 180,  // 觉察者 - 蓝绿色 (清明)
      4: 220,  // 实践者 - 蓝色 (沉稳)
      5: 280,  // 贤者 - 紫色 (智慧)
      6: 320,  // 智者 - 紫红色 (深邃)
      7: 40,   // 觉醒者 - 金色 (觉悟)
    }
    return levelHues[level] || levelHues[1]
  }

  // 注：保留旧的3形态系统用于向后兼容，但实际使用新的5阶段系统

  // 加载意识树视图数据
  useEffect(() => {
    const loadTreeViewData = async () => {
      setIsLoading(true)
      try {
        // Mock模式：使用传入的模拟数据
        if (mockMode) {
          setConsciousnessLevel(mockLevel)
          setLevelProgress(mockProgress)
          setCompositeScore(mockProgress) // 向后兼容

          const currentStage = getTreeStage(mockProgress)
          console.log(`🌳 [Mock模式] 等级: ${mockLevel}, 进度: ${mockProgress}%, 阶段: ${currentStage}`)

          // 创建模拟的意识树视图数据
          const mockTreeView: ConsciousnessTreeView = {
            roots: {
              main_roots: [
                { domain: 'self_awareness', length: mockDomains.self_awareness || 0 },
                { domain: 'life_sciences', length: mockDomains.life_sciences || 0 },
                { domain: 'universal_laws', length: mockDomains.universal_laws || 0 },
                { domain: 'creative_expression', length: mockDomains.creative_expression || 0 },
                { domain: 'social_connection', length: mockDomains.social_connection || 0 }
              ]
            },
            trunk: { thickness: 1, stability: 1 },
            branches_and_leaves: { total_leaves: 0 },
            fruits: [],
            last_updated: null
          }
          setTreeView(mockTreeView)

          // 更新领域状态
          setDomains(prev => ({
            self_awareness: { ...prev.self_awareness, db_score: mockDomains.self_awareness || 0, depth: mockDomains.self_awareness || 0 },
            life_sciences: { ...prev.life_sciences, db_score: mockDomains.life_sciences || 0, depth: mockDomains.life_sciences || 0 },
            universal_laws: { ...prev.universal_laws, db_score: mockDomains.universal_laws || 0, depth: mockDomains.universal_laws || 0 },
            creative_expression: { ...prev.creative_expression, db_score: mockDomains.creative_expression || 0, depth: mockDomains.creative_expression || 0 },
            social_connection: { ...prev.social_connection, db_score: mockDomains.social_connection || 0, depth: mockDomains.social_connection || 0 }
          }))

          setIsLoading(false)
          return
        }

        // 真实模式：从数据库获取数据
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('consciousness_level, level_progress, composite_score')
            .eq('id', user.id)
            .single()

          if (profile) {
            setConsciousnessLevel(profile.consciousness_level || 1)

            // 优先使用 level_progress，fallback 到 composite_score
            const progress = profile.level_progress !== null && profile.level_progress !== undefined
              ? profile.level_progress
              : (typeof profile.composite_score === 'string'
                  ? parseFloat(profile.composite_score)
                  : (profile.composite_score || 0))

            setLevelProgress(progress)
            setCompositeScore(progress) // 向后兼容

            const currentStage = getTreeStage(progress)
            console.log(`🌳 当前等级: ${profile.consciousness_level}, 进度: ${progress}%, 阶段: ${currentStage}`)
          }
        }

        const result = await consciousnessTreeAPI.getConsciousnessTreeView()
        if (result.success && result.data) {
          setTreeView(result.data)

          // 从意识树视图中提取根部长度数据并更新领域状态
          const rootsData = result.data.roots.main_roots
          const rootsMap = rootsData.reduce((acc, root) => {
            acc[root.domain] = root.length
            return acc
          }, {} as Record<string, number>)

          const selfScore = rootsMap.self_awareness || 0
          const lifeScore = rootsMap.life_sciences || 0
          const universalScore = rootsMap.universal_laws || 0
          const creativeScore = rootsMap.creative_expression || 0
          const socialScore = rootsMap.social_connection || 0

          setDomains(prev => ({
            self_awareness: {
              ...prev.self_awareness,
              db_score: selfScore,
              depth: selfScore // 直接使用根部长度作为深度
            },
            life_sciences: {
              ...prev.life_sciences,
              db_score: lifeScore,
              depth: lifeScore
            },
            universal_laws: {
              ...prev.universal_laws,
              db_score: universalScore,
              depth: universalScore
            },
            creative_expression: {
              ...prev.creative_expression,
              db_score: creativeScore,
              depth: creativeScore
            },
            social_connection: {
              ...prev.social_connection,
              db_score: socialScore,
              depth: socialScore
            }
          }))
        } else {
          // 使用空数据（新用户）
          const defaultTreeView = {
            roots: {
              main_roots: [
                { domain: 'self_awareness', length: 0 },
                { domain: 'life_sciences', length: 0 },
                { domain: 'universal_laws', length: 0 },
                { domain: 'creative_expression', length: 0 },
                { domain: 'social_connection', length: 0 }
              ]
            },
            trunk: { thickness: 1, stability: 1 },
            branches_and_leaves: { total_leaves: 0 },
            fruits: [],
            last_updated: null
          }
          setTreeView(defaultTreeView)

          // 更新 domains 状态 - 全部为0
          setDomains(prev => ({
            self_awareness: {
              ...prev.self_awareness,
              db_score: 0,
              depth: 0
            },
            life_sciences: {
              ...prev.life_sciences,
              db_score: 0,
              depth: 0
            },
            universal_laws: {
              ...prev.universal_laws,
              db_score: 0,
              depth: 0
            },
            creative_expression: {
              ...prev.creative_expression,
              db_score: 0,
              depth: 0
            },
            social_connection: {
              ...prev.social_connection,
              db_score: 0,
              depth: 0
            }
          }))

        }
      } catch (error) {
        console.error('加载意识树视图数据失败:', error)
        // 使用空数据（新用户或加载失败）
        const defaultTreeView = {
          roots: {
            main_roots: [
              { domain: 'self_awareness', length: 0 },
              { domain: 'life_sciences', length: 0 },
              { domain: 'universal_laws', length: 0 },
              { domain: 'creative_expression', length: 0 },
              { domain: 'social_connection', length: 0 }
            ]
          },
          trunk: { thickness: 1, stability: 1 },
          branches_and_leaves: { total_leaves: 0 },
          fruits: [],
          last_updated: null
        }
        setTreeView(defaultTreeView)

        // 更新 domains 状态 - 全部为0
        setDomains(prev => ({
          self_awareness: {
            ...prev.self_awareness,
            db_score: 0,
            depth: 0
          },
          life_sciences: {
            ...prev.life_sciences,
            db_score: 0,
            depth: 0
          },
          universal_laws: {
            ...prev.universal_laws,
            db_score: 0,
            depth: 0
          },
          creative_expression: {
            ...prev.creative_expression,
            db_score: 0,
            depth: 0
          },
          social_connection: {
            ...prev.social_connection,
            db_score: 0,
            depth: 0
          }
        }))

      } finally {
        setIsLoading(false)
      }
    }

    loadTreeViewData()
  }, [mockMode, mockLevel, mockProgress, mockDomains])

  // Balanced constants for elegant simplicity - 保持前端小姐姐的常量
  const maxlife = 18 // Moderate life span

  const createVector = (x: number, y: number): Vector2D => ({ x, y })

  const random = (min?: number, max?: number): number => {
    if (min === undefined) return Math.random()
    if (max === undefined) return Math.random() * min
    return min + Math.random() * (max - min)
  }

  const createTree = useCallback((width: number, height: number): Tree => {
    // 使用新的5阶段系统
    const currentStage = getTreeStage(levelProgress)
    const scaling = getTreeScaling(levelProgress)

    console.log(`🌱 创建${currentStage}阶段的树，进度: ${levelProgress}%，缩放: `, scaling)

    // ROOT SYSTEM: Start at horizontal line for proper root system
    const x = width / 2
    const y = height * 0.5 // FIXED: Back to 50% to match horizontal line
    const start = createVector(x, y)

    // 根据阶段调整概率
    const baseProbability = scaling.branchProbability

    const tree: Tree = {
      branches: [],
      start,
      coeff: start.y / (height - 100),
      teinte: getLevelBaseHue(consciousnessLevel), // 使用基于等级的颜色
      index: 0,
      // 根据阶段调整分支概率
      proba1: baseProbability,
      proba2: baseProbability,
      proba3: baseProbability * 0.6,
      proba4: baseProbability * 0.6,
    }

    // 种子期：完全没有树干，只有根系
    if (scaling.trunkWidth === 0) {
      console.log(`🌰 种子期：不创建树干，仅显示根系`)
      return tree
    }

    // 其他阶段：根据阶段创建主干/茎
    const baseTrunkWidth = 25 * Math.sqrt(start.y / height)
    const trunk: Branch = {
      position: { ...start },
      stw: baseTrunkWidth * scaling.trunkWidth * trunkThickness, // 应用阶段缩放
      gen: 1,
      alive: true,
      age: 0,
      angle: random(-0.15, 0.15),
      speed: createVector(random(-0.3, 0.3), +3.2),
      index: 0,
      maxlife: maxlife * scaling.trunkLength * 2, // 根据阶段调整长度
      proba1: tree.proba1,
      proba2: tree.proba2,
      proba3: tree.proba3,
      proba4: tree.proba4,
      deviation: 0.65,
    }

    tree.branches.push(trunk)
    return tree
  }, [trunkThickness, consciousnessLevel, levelProgress])

  const createBranch = (
    start: Vector2D,
    stw: number,
    angle: number,
    gen: number,
    index: number,
    tree: Tree,
    fixedMaxlife?: number // 新增参数：固定长度
  ): Branch => ({
    position: { ...start },
    stw,
    gen,
    alive: true,
    age: 0,
    angle,
    speed: createVector(0, +3.2), // ROOT CHANGE: DOWN instead of UP
    index,
    maxlife: fixedMaxlife || maxlife * 0.8, // 统一生命周期，减少随机性
    proba1: tree.proba1,
    proba2: tree.proba2,
    proba3: tree.proba3,
    proba4: tree.proba4,
    deviation: 0.65, // 固定偏差值，不再随机
  })

  // 根据意识树视图的根部长度自动生成初始根系
  const generateInitialRoots = useCallback((scores: Record<string, { depth_score: number }>) => {
    const currentStage = getTreeStage(levelProgress)
    const scaling = getTreeScaling(levelProgress)

    // 等待树初始化完成
    setTimeout(() => {
      Object.entries(scores).forEach(([domainKey, data]) => {
        // 直接使用根部长度，不需要标准化（因为已经是预计算的值）
        const rootLength = data.depth_score

        // 根据阶段调整根的数量
        // seed: 最多2根，sprout: 最多3根，seedling: 最多4根，young: 最多5根，mature: 最多5根
        const maxBranches = Math.min(
          scaling.maxRootBranches,
          Math.ceil(rootLength / 3)
        )
        const branchCount = Math.max(rootLength > 0 ? 1 : 0, maxBranches)

        console.log(`🌿 ${domainKey}: 数据库深度=${rootLength}, 生成${branchCount}根 (阶段=${currentStage}, 上限=${scaling.maxRootBranches})`)

        // 为每个领域生成相应数量的分支
        for (let i = 0; i < branchCount; i++) {
          setTimeout(() => {
            autoCreateDomainBranch(domainKey)
          }, i * 200) // 每200ms生成一个分支，创造生长动画效果
        }
      })
    }, 1000) // 等待1秒让主干完成初始生长（种子期无主干，直接生成根系）
  }, [levelProgress])

  // 自动创建领域分支（不依赖depth计数器）
  const autoCreateDomainBranch = (domainKey: string) => {
    if (!treeRef.current) return

    const tree = treeRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    // 获取当前阶段的缩放参数
    const currentStage = getTreeStage(levelProgress)
    const scaling = getTreeScaling(levelProgress)

    // 找到主干（可能已经死亡或还活着）
    // 种子期没有主干，直接从start位置创建根系
    const mainTrunk = tree.branches.find(b => b.gen === 1)
    const startPos = mainTrunk ? mainTrunk.position : tree.start

    // Domain-specific branch angles for visual separation - 五个固定角度
    const getDomainAngle = (domainKey: string): number => {
      const staticAngles: Record<string, number> = {
        self_awareness: -0.6,      // 左侧
        life_sciences: -0.3,       // 左中
        universal_laws: 0,         // 中央
        creative_expression: 0.3,  // 右中
        social_connection: 0.6     // 右侧
      }

      return staticAngles[domainKey] || 0
    }

    const domainAngle = getDomainAngle(domainKey)

    // Create domain branch - 根据阶段调整根的粗细和长度
    // 种子期：使用固定基础粗细，因为没有主干
    const baseStw = mainTrunk ? mainTrunk.stw * 0.65 : 5
    const domainBranch = createBranch(
      { x: startPos.x, y: startPos.y },
      baseStw * scaling.rootWidth, // 应用根宽度缩放
      domainAngle,
      2, // Second generation
      tree.index++,
      tree,
      maxlife * 0.7 * scaling.rootLength // 应用根长度缩放
    )

    // 不设置domainColor，让根系也使用等级颜色
    // domainBranch.domainColor = currentDomain.color
    domainBranch.isDomainRoot = true

    tree.branches.push(domainBranch)
  }

  // 从主干末端创建领域分支 - 基于数据库深度分数
  const addDomainBranch = (domainKey: string) => {
    if (!treeRef.current) return

    const tree = treeRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    const currentDomain = domains[domainKey]

    if (currentDomain.depth === 0) {
      // FIRST CLICK: Create seed with FIXED parameters for consistent growth
      const mainTrunk = tree.branches.find(b => b.gen === 1 && !b.alive)
      if (!mainTrunk) {
        return
      }

      // Domain-specific branch angles for visual separation - 五个固定角度
      const getDomainAngle = (domainKey: string): number => {
        const staticAngles: Record<string, number> = {
          self_awareness: -0.6,      // 左侧
          life_sciences: -0.3,       // 左中
          universal_laws: 0,         // 中央
          creative_expression: 0.3,  // 右中
          social_connection: 0.6     // 右侧
        }

        return staticAngles[domainKey] || 0
      }

      const domainAngle = getDomainAngle(domainKey)

      // Create CONSISTENT seed branch with UNIFIED parameters
      const domainBranch = createBranch(
        { x: mainTrunk.position.x, y: mainTrunk.position.y },
        mainTrunk.stw * 0.65, // 统一尺寸比例，稍微细一点更优雅
        domainAngle,
        2, // Second generation
        tree.index++,
        tree,
        maxlife * 0.7 // 统一初始长度，适中不会太短或太长
      )

      domainBranch.domainColor = currentDomain.color
      domainBranch.isDomainRoot = true
      domainBranch.alive = true
      domainBranch.age = 0

      // INHERIT FIXED PROBABILITIES for consistent branching
      domainBranch.proba1 = tree.proba1
      domainBranch.proba2 = tree.proba2
      domainBranch.proba3 = tree.proba3
      domainBranch.proba4 = tree.proba4
      domainBranch.deviation = 0.65 // FIXED deviation

      tree.branches.push(domainBranch)

    } else {
      // SUBSEQUENT CLICKS: Layered seeding strategy for sustained rich branching
      const domainBranches = tree.branches.filter(b =>
        b.domainColor === currentDomain.color && !b.alive
      )

      if (domainBranches.length === 0) {
        return
      }

      // SYSTEMATIC BRANCH SELECTION: 统一化选择策略，消除随机性
      domainBranches.sort((a, b) => b.position.y - a.position.y) // Sort by depth

      let sourceBranch
      let isMainBranchCreation = false

      // UNIFIED LAYERED STRATEGY: 基于深度的规律性主分支创建
      if (currentDomain.depth % 10 === 0 && currentDomain.depth > 0) {
        // 统一的主分支选择逻辑
        const thickBranches = domainBranches.filter(b =>
          b.gen >= 2 && b.gen <= 4 && b.stw > 3
        ).sort((a, b) => b.stw - a.stw)

        if (thickBranches.length > 0) {
          // 使用深度百分比选择，不随机
          const selectionIndex = Math.floor((currentDomain.depth / 10 - 1) % thickBranches.length)
          sourceBranch = thickBranches[selectionIndex]
          isMainBranchCreation = true
        } else {
          sourceBranch = domainBranches[0] // 最深的分支
          isMainBranchCreation = true
        }
      } else {
        // CONSISTENT NORMAL SELECTION: 规律性普通选择
        const depthCycle = currentDomain.depth % 5 // 5次循环
        const selectionRatio = depthCycle / 5 // 0, 0.2, 0.4, 0.6, 0.8
        const selectionIndex = Math.floor(selectionRatio * domainBranches.length)
        sourceBranch = domainBranches[Math.min(selectionIndex, domainBranches.length - 1)]
      }

      // UNIFIED BRANCH CREATION: 统一化分支参数，确保一致性
      const baseStw = isMainBranchCreation
        ? Math.max(sourceBranch.stw * 0.9, 8)    // 统一主分支尺寸
        : sourceBranch.stw * 0.8                 // 统一普通分支尺寸

      const baseAngle = sourceBranch.angle + ((currentDomain.depth % 3 - 1) * 0.15) // 规律角度变化
      const baseGen = isMainBranchCreation
        ? Math.min(sourceBranch.gen + 0.1, 3)    // 统一主分支代数
        : sourceBranch.gen + 0.2                 // 统一普通分支代数增长

      const newSeedBranch = createBranch(
        { x: sourceBranch.position.x, y: sourceBranch.position.y },
        baseStw,
        baseAngle,
        baseGen,
        tree.index++,
        tree,
        isMainBranchCreation
          ? maxlife * 1.2  // 统一主分支生命
          : maxlife * 0.9  // 统一普通分支生命
      )

      // UNIFIED PARAMETER SETTING: 统一化参数设置
      newSeedBranch.domainColor = currentDomain.color
      newSeedBranch.isDomainRoot = false
      newSeedBranch.alive = true
      newSeedBranch.age = 0
      newSeedBranch.deviation = 0.65 // 统一偏差

      if (isMainBranchCreation) {
        // UNIFIED MAIN BRANCH: 统一主分支参数
        newSeedBranch.proba1 = 0.8  // 固定高概率
        newSeedBranch.proba2 = 0.8
        newSeedBranch.proba3 = 0.6  // 固定中等概率
        newSeedBranch.proba4 = 0.6
      } else {
        // UNIFIED NORMAL BRANCH: 统一普通分支衰减
        const baseDecay = 0.95 - (currentDomain.depth * 0.005) // 基于深度的线性衰减
        newSeedBranch.proba1 = Math.max(sourceBranch.proba1 * baseDecay, 0.4)
        newSeedBranch.proba2 = Math.max(sourceBranch.proba2 * baseDecay, 0.4)
        newSeedBranch.proba3 = Math.max(sourceBranch.proba3 * baseDecay, 0.3)
        newSeedBranch.proba4 = Math.max(sourceBranch.proba4 * baseDecay, 0.3)
      }

      tree.branches.push(newSeedBranch)
    }

    // 重启动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    draw()

    // Update domain state
    setDomains(prev => ({
      ...prev,
      [domainKey]: {
        ...prev[domainKey],
        depth: prev[domainKey].depth + 1
      }
    }))
  }

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

    // MAIN TRUNK: Natural trunk growth with gradual thinning and subtle movement
    if (branch.gen === 1) {
      // SHORTER TRUNK: Stop after 16 cycles instead of 30 for better proportion
      if (branch.age >= 16) {
        branch.alive = false
      } else {
        // GRADUAL THINNING: Natural tapering like real tree trunk
        branch.stw *= 0.985 // Gradual thinning each cycle

        // ENHANCED NATURAL SWAY: More visible angular changes for organic feel
        branch.angle += random(-0.08, 0.08) // INCREASED: More noticeable sway

        // ENHANCED NATURAL SPEED VARIATION: More noticeable growth speed changes
        branch.speed.x += random(-0.15, 0.15) // INCREASED: More horizontal variation
        branch.speed.y *= random(0.95, 1.05) // INCREASED: More vertical speed variation

        // Keep horizontal movement in check but allow more natural movement
        branch.speed.x *= 0.92 // ADJUSTED: Allow more natural drift before correction
      }
      return // Never auto-branch from main trunk
    }

    // MAINTAIN ORIGINAL ALGORITHM with ENHANCED DOWNWARD BIAS and REDUCED randomness for lifecycles
    if (branch.age >= Math.floor(branch.maxlife / branch.gen) || random(1) < 0.025 * branch.gen) {
      branch.alive = false

      // ORIGINAL THRESHOLD: Only substantial branches can branch
      if (branch.stw > 0.4 && branch.gen < 5) { // Keep original threshold
        const brs = tree.branches
        const pos = createVector(branch.position.x, branch.position.y)

        // UNIFIED 4-PROBABILITY SYSTEM: 统一化分支生长，减少随机性
        if (random(1) < branch.proba1 / Math.pow(branch.gen, 0.8)) {
          const newBranch = createBranch(
            pos,
            branch.stw * 0.7, // 统一尺寸缩放，不再随机
            branch.angle + 0.5 * branch.deviation, // 统一角度变化
            branch.gen + 0.2,
            branch.index,
            tree,
            maxlife * 0.95 // 统一生命周期
          )
          newBranch.domainColor = branch.domainColor
          newBranch.isDomainRoot = false

          // 统一概率继承
          newBranch.proba1 = branch.proba1 * 0.95
          newBranch.proba2 = branch.proba2 * 0.95
          newBranch.proba3 = branch.proba3 * 0.95
          newBranch.proba4 = branch.proba4 * 0.95
          newBranch.deviation = branch.deviation

          brs.push(newBranch)
        }

        if (random(1) < branch.proba2 / Math.pow(branch.gen, 0.8)) {
          const newBranch = createBranch(
            pos,
            branch.stw * 0.7, // 统一尺寸
            branch.angle - 0.5 * branch.deviation, // 统一反向角度
            branch.gen + 0.2,
            branch.index,
            tree,
            maxlife * 0.95 // 统一生命周期
          )
          newBranch.domainColor = branch.domainColor
          newBranch.isDomainRoot = false

          // 统一概率继承
          newBranch.proba1 = branch.proba1 * 0.95
          newBranch.proba2 = branch.proba2 * 0.95
          newBranch.proba3 = branch.proba3 * 0.95
          newBranch.proba4 = branch.proba4 * 0.95
          newBranch.deviation = branch.deviation

          brs.push(newBranch)
        }

        // 统一次级分支
        if (branch.gen < 3 && random(1) < branch.proba3 / Math.pow(branch.gen, 0.8)) {
          const newBranch = createBranch(
            pos,
            branch.stw * 0.75, // 次级分支稍粗一点
            branch.angle + 0.3 * branch.deviation, // 较小角度变化
            branch.gen + 0.15,
            branch.index,
            tree,
            maxlife * 0.9 // 次级分支稍短
          )
          newBranch.domainColor = branch.domainColor
          newBranch.isDomainRoot = false

          // 统一概率继承
          newBranch.proba1 = branch.proba1 * 0.95
          newBranch.proba2 = branch.proba2 * 0.95
          newBranch.proba3 = branch.proba3 * 0.95
          newBranch.proba4 = branch.proba4 * 0.95
          newBranch.deviation = branch.deviation

          brs.push(newBranch)
        }

        if (branch.gen < 3 && random(1) < branch.proba4 / Math.pow(branch.gen, 0.8)) {
          const newBranch = createBranch(
            pos,
            branch.stw * 0.75, // 统一次级分支尺寸
            branch.angle - 0.3 * branch.deviation, // 统一反向小角度
            branch.gen + 0.15,
            branch.index,
            tree,
            maxlife * 0.9 // 统一次级分支生命
          )
          newBranch.domainColor = branch.domainColor
          newBranch.isDomainRoot = false

          // 统一概率继承
          newBranch.proba1 = branch.proba1 * 0.95
          newBranch.proba2 = branch.proba2 * 0.95
          newBranch.proba3 = branch.proba3 * 0.95
          newBranch.proba4 = branch.proba4 * 0.95
          newBranch.deviation = branch.deviation

          brs.push(newBranch)
        }
      }
    } else {
      // Gentle movement for natural growth
      branch.speed.x += random(-0.15, 0.15)
    }
  }

  const displayBranch = (branch: Branch, tree: Tree, ctx: CanvasRenderingContext2D) => {
    const c = tree.coeff
    const st = tree.start
    const x0 = branch.position.x
    const y0 = branch.position.y

    // Update position with smooth movement - NATURAL DOWNWARD GROWTH
    branch.position.x += -branch.speed.x * Math.cos(branch.angle) + branch.speed.y * Math.sin(branch.angle)
    branch.position.y += branch.speed.x * Math.sin(branch.angle) + branch.speed.y * Math.cos(branch.angle)

    // CLEAN SINGLE LAYER RENDERING - No mirror, direct downward drawing
    const mainHue = (branch.domainColor !== undefined ? branch.domainColor : tree.teinte) + branch.age + 15 * branch.gen
    const mainSat = Math.min(180, 100 * c + 15 * branch.gen)
    const mainBright = Math.min(150, 70 + 12 * branch.gen)
    const mainColor = hsbToRgb(mainHue, mainSat, mainBright, 0.7)

    ctx.strokeStyle = mainColor
    // Natural tapering as branch ages
    const mainWidth = branch.stw - (branch.age / branch.maxlife) * (branch.stw * 0.4)
    ctx.lineWidth = Math.max(0.5, mainWidth)

    ctx.beginPath()
    ctx.moveTo(x0, y0) // Direct drawing, no mirror
    ctx.lineTo(branch.position.x, branch.position.y)
    ctx.stroke()
  }

  // MOUSE HOVER DETECTION - 检测鼠标悬浮在哪个分支上
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !treeRef.current) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    setMousePos({ x: mouseX, y: mouseY })

    // 检查鼠标是否悬浮在某个分支上
    let foundDomain: string | null = null

    for (const branch of treeRef.current.branches) {
      if (branch.domainColor !== undefined) {
        // 计算鼠标到分支的距离
        const distance = Math.sqrt(
          Math.pow(mouseX - branch.position.x, 2) +
          Math.pow(mouseY - branch.position.y, 2)
        )

        if (distance < branch.stw + 10) { // 悬浮检测范围
          // 找到对应的领域
          for (const [key, domain] of Object.entries(domains)) {
            if (domain.color === branch.domainColor) {
              foundDomain = key
              break
            }
          }
          break
        }
      }
    }

    setHoveredDomain(foundDomain)
  }

  const setup = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 纯黑色背景，与页面背景匹配
    ctx.fillStyle = "rgb(0, 0, 0)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw horizontal line at middle - 使用更亮的颜色在黑色背景上可见
    ctx.strokeStyle = "rgba(255,255,255,0.1)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    // Level 1 特殊效果: 在中心添加嫩绿色柔和光晕
    if (consciousnessLevel === 1) {
      const glowGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.4,
      )
      glowGradient.addColorStop(0, "rgba(100, 200, 100, 0.05)") // 嫩绿色微光
      glowGradient.addColorStop(1, "rgba(100, 200, 100, 0)")
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Create root system
    treeRef.current = createTree(canvas.width, canvas.height)

    // 树创建完成后，触发自动生长（如果有数据的话）
    if (treeView && treeView.roots.main_roots.length > 0) {
      const rootsMap = treeView.roots.main_roots.reduce((acc, root) => {
        acc[root.domain] = { depth_score: root.length }
        return acc
      }, {} as Record<string, { depth_score: number }>)
      generateInitialRoots(rootsMap)
    }
  }, [treeView, createTree, generateInitialRoots, consciousnessLevel])


  const draw = useCallback(() => {
    if (!canvasRef.current || !treeRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // DON'T CLEAR - Let branches accumulate like original SimpleTree
    // Root grows once per frame
    const tree = treeRef.current
    let hasAliveBranches = false

    tree.branches.forEach((branch) => {
      if (branch.alive) {
        hasAliveBranches = true
        growBranch(branch, tree)
        displayBranch(branch, tree, ctx)
      }
    })

    // 动画循环现在由useEffect中的startAnimation处理
  }, [])


  useEffect(() => {
    if (!isLoading && treeView) {
      setup()
      // 立即开始动画循环（90fps）
      const startAnimation = () => {
        draw()
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(startAnimation)
        }, 1000 / 90) // 90fps
      }
      startAnimation()
    }

    const handleResize = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (!isLoading && treeView) {
        setup()
        // 重新开始动画循环（90fps）
        const startAnimation = () => {
          draw()
          setTimeout(() => {
            animationRef.current = requestAnimationFrame(startAnimation)
          }, 1000 / 90) // 90fps
        }
        startAnimation()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [setup, draw, isLoading, treeView])

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载意识根系数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-hidden relative bg-transparent">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredDomain(null)
          setMousePos(null)
        }}
      />

    </div>
  )
}