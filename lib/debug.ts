/**
 * 条件日志系统
 * 只在开发环境中输出调试日志，生产环境静默
 */

const isDev = process.env.NODE_ENV === 'development'

/**
 * 创建带命名空间的调试日志器
 * @param namespace - 日志命名空间，如 'GAIA', 'AIP', 'AudioPlayer'
 */
export function createDebugLogger(namespace: string) {
  const prefix = `[${namespace}]`

  return {
    log: (...args: unknown[]) => {
      if (isDev) console.log(prefix, ...args)
    },
    info: (...args: unknown[]) => {
      if (isDev) console.info(prefix, ...args)
    },
    warn: (...args: unknown[]) => {
      // 警告在开发和生产环境都显示
      console.warn(prefix, ...args)
    },
    error: (...args: unknown[]) => {
      // 错误在开发和生产环境都显示
      console.error(prefix, ...args)
    },
    debug: (...args: unknown[]) => {
      if (isDev) console.debug(prefix, ...args)
    },
    /** 只在开发环境显示的表格数据 */
    table: (data: unknown) => {
      if (isDev) console.table(data)
    },
    /** 带时间戳的日志 */
    time: (label: string) => {
      if (isDev) console.time(`${prefix} ${label}`)
    },
    timeEnd: (label: string) => {
      if (isDev) console.timeEnd(`${prefix} ${label}`)
    },
    /** 分组日志 */
    group: (label: string) => {
      if (isDev) console.group(`${prefix} ${label}`)
    },
    groupEnd: () => {
      if (isDev) console.groupEnd()
    }
  }
}

// 预定义的日志器实例
export const gaiaDebug = createDebugLogger('GAIA')
export const aipDebug = createDebugLogger('AIP')
export const audioDebug = createDebugLogger('AudioPlayer')
export const adminDebug = createDebugLogger('Admin')
export const courseDebug = createDebugLogger('Course')

/**
 * 通用调试日志（不带命名空间）
 * 只在开发环境输出
 */
export const debug = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args)
  },
  warn: (...args: unknown[]) => {
    console.warn(...args)
  },
  error: (...args: unknown[]) => {
    console.error(...args)
  }
}
