/**
 * 意识树统一配置文件 - 7脉轮颜色系统
 *
 * 基于可见光光谱和脉轮系统：红橙黄绿青蓝紫
 * 每个等级对应一个脉轮颜色，每个等级内有5种颜色变化反映成长进度
 */

export interface LevelColorConfig {
  name: string
  chakra: string
  element: string
  theme: string
  hue: number        // HSL色调值 (0-360) 用于Canvas绘制
  colors: {
    darkest: string    // 0-20% progress
    dark: string       // 21-40%
    primary: string    // 41-70%
    light: string      // 71-90%
    lightest: string   // 91-100%
    accent: string     // 金色点缀（所有等级通用）
  }
}

export const CONSCIOUSNESS_LEVEL_COLORS: Record<string, LevelColorConfig> = {
  level_1: {
    name: '沉睡者 (The Sleeper)',
    chakra: '海底轮 (Root Chakra)',
    element: '土',
    theme: 'red',
    hue: 0,           // 红色 (0°)
    colors: {
      darkest: '#450A0A',    // 黑红色 (0-20% progress)
      dark: '#991B1B',       // 暗红色 (21-40%)
      primary: '#DC2626',    // 正红色 (41-70%)
      light: '#F87171',      // 亮红色 (71-90%)
      lightest: '#FCA5A5',   // 浅红色 (91-100%)
      accent: '#FFA500'      // 金色点缀
    }
  },
  level_2: {
    name: '觉醒者 (The Awakened)',
    chakra: '脐轮 (Sacral Chakra)',
    element: '水',
    theme: 'orange',
    hue: 25,          // 橙色 (25°)
    colors: {
      darkest: '#7C2D12',
      dark: '#C2410C',
      primary: '#EA580C',
      light: '#FB923C',
      lightest: '#FDBA74',
      accent: '#FFA500'
    }
  },
  level_3: {
    name: '探索者 (The Explorer)',
    chakra: '太阳神经丛 (Solar Plexus Chakra)',
    element: '火',
    theme: 'yellow',
    hue: 48,          // 黄色 (48°)
    colors: {
      darkest: '#713F12',
      dark: '#CA8A04',
      primary: '#EAB308',
      light: '#FACC15',
      lightest: '#FDE047',
      accent: '#FFA500'
    }
  },
  level_4: {
    name: '实践者 (The Practitioner)',
    chakra: '心轮 (Heart Chakra)',
    element: '气',
    theme: 'green',
    hue: 142,         // 绿色 (142°)
    colors: {
      darkest: '#14532D',
      dark: '#15803D',
      primary: '#16A34A',
      light: '#4ADE80',
      lightest: '#86EFAC',
      accent: '#FFA500'
    }
  },
  level_5: {
    name: '洞察者 (The Insightful)',
    chakra: '喉轮 (Throat Chakra)',
    element: '以太',
    theme: 'cyan',
    hue: 188,         // 青色 (188°)
    colors: {
      darkest: '#164E63',
      dark: '#0891B2',
      primary: '#06B6D4',
      light: '#22D3EE',
      lightest: '#67E8F9',
      accent: '#FFA500'
    }
  },
  level_6: {
    name: '先锋者 (The Pioneer)',
    chakra: '眉心轮 (Third Eye Chakra)',
    element: '光',
    theme: 'blue',
    hue: 217,         // 蓝色 (217°)
    colors: {
      darkest: '#1E3A8A',
      dark: '#1D4ED8',
      primary: '#2563EB',
      light: '#60A5FA',
      lightest: '#93C5FD',
      accent: '#FFA500'
    }
  },
  level_7: {
    name: '引领者 (The Leader)',
    chakra: '顶轮 (Crown Chakra)',
    element: '意识',
    theme: 'purple',
    hue: 271,         // 紫色 (271°)
    colors: {
      darkest: '#581C87',
      dark: '#7E22CE',
      primary: '#9333EA',
      light: '#C084FC',
      lightest: '#E9D5FF',
      accent: '#FFA500'
    }
  }
}

/**
 * 根据等级和进度返回对应的颜色
 * @param level - 意识等级 (1-7)
 * @param progress - 等级内进度 (0-100)
 * @returns 十六进制颜色代码
 */
export function getColorByProgress(level: number, progress: number): string {
  const levelKey = `level_${level}` as keyof typeof CONSCIOUSNESS_LEVEL_COLORS
  const levelColors = CONSCIOUSNESS_LEVEL_COLORS[levelKey]?.colors

  if (!levelColors) {
    console.warn(`Invalid consciousness level: ${level}`)
    return '#9CA3AF' // 默认灰色
  }

  if (progress <= 20) return levelColors.darkest  // 0-20%: 刚开始，暗淡
  if (progress <= 50) return levelColors.dark     // 21-50%: 成长中
  if (progress <= 85) return levelColors.primary  // 51-85%: 接近成熟
  return levelColors.light  // 86-100%: 即将升级，发光
}

/**
 * 获取等级的主要颜色（用于显示等级标识）
 * @param level - 意识等级 (1-7)
 * @returns 十六进制颜色代码
 */
export function getLevelPrimaryColor(level: number): string {
  const levelKey = `level_${level}` as keyof typeof CONSCIOUSNESS_LEVEL_COLORS
  return CONSCIOUSNESS_LEVEL_COLORS[levelKey]?.colors.primary || '#9CA3AF'
}

/**
 * 获取等级的HSL色调值（用于Canvas绘制）
 * @param level - 意识等级 (1-7)
 * @returns HSL色调值 (0-360)
 */
export function getLevelHue(level: number): number {
  const levelKey = `level_${level}` as keyof typeof CONSCIOUSNESS_LEVEL_COLORS
  return CONSCIOUSNESS_LEVEL_COLORS[levelKey]?.hue || 142 // 默认绿色
}

/**
 * 获取等级配置信息
 * @param level - 意识等级 (1-7)
 * @returns 等级配置对象
 */
export function getLevelConfig(level: number): LevelColorConfig | null {
  const levelKey = `level_${level}` as keyof typeof CONSCIOUSNESS_LEVEL_COLORS
  return CONSCIOUSNESS_LEVEL_COLORS[levelKey] || null
}

/**
 * 根据进度返回树的生长阶段
 * @param progress - 等级内进度 (0-100)
 * @returns 阶段名称
 */
export function getTreeStage(progress: number): 'seed' | 'sprout' | 'seedling' | 'young' | 'mature' {
  if (progress < 20) return 'seed'
  if (progress < 40) return 'sprout'
  if (progress < 60) return 'seedling'
  if (progress < 80) return 'young'
  return 'mature'
}

/**
 * 获取树图像的完整路径
 * @param level - 意识等级 (1-7)
 * @param progress - 等级内进度 (0-100)
 * @returns 图像文件路径
 */
export function getTreeImagePath(level: number, progress: number): string {
  const stage = getTreeStage(progress)
  return `/tree-images/level-${level}/${stage}.png`
}

/**
 * 根据总经验值计算意识等级
 * @param totalExp - 总经验值
 * @returns 意识等级 (1-7)
 */
export function calculateLevel(totalExp: number): number {
  if (totalExp < 500) return 1      // 红色 - 海底轮
  if (totalExp < 1500) return 2     // 橙色 - 脐轮
  if (totalExp < 3500) return 3     // 黄色 - 太阳神经丛
  if (totalExp < 7000) return 4     // 绿色 - 心轮
  if (totalExp < 12000) return 5    // 青色 - 喉轮
  if (totalExp < 20000) return 6    // 蓝色 - 眉心轮
  return 7                          // 紫色 - 顶轮
}

/**
 * 获取当前等级所需的经验值范围
 * @param level - 意识等级 (1-7)
 * @returns { min: number, max: number } 经验值范围
 */
export function getLevelExpRange(level: number): { min: number; max: number } {
  const ranges = [
    { min: 0, max: 500 },       // Level 1
    { min: 500, max: 1500 },    // Level 2
    { min: 1500, max: 3500 },   // Level 3
    { min: 3500, max: 7000 },   // Level 4
    { min: 7000, max: 12000 },  // Level 5
    { min: 12000, max: 20000 }, // Level 6
    { min: 20000, max: Infinity } // Level 7
  ]

  return ranges[level - 1] || { min: 0, max: 500 }
}

/**
 * 阶段名称映射（中英文）
 */
export const STAGE_NAMES = {
  seed: { zh: '种子期', en: 'Seed', description: '潜藏的潜能' },
  sprout: { zh: '发芽期', en: 'Sprout', description: '初现的生机' },
  seedling: { zh: '幼苗期', en: 'Seedling', description: '茁壮的成长' },
  young: { zh: '小树期', en: 'Young Tree', description: '蓬勃的发展' },
  mature: { zh: '大树期', en: 'Mature Tree', description: '丰硕的成果' }
} as const
