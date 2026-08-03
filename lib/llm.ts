/**
 * 统一的对话模型调用层
 *
 * 原先盖亚和 AIP 的 LLM 调用都跑在 N8N 里，N8N 失联后这层搬回项目内。
 *
 * 支持三家，按模型名自动路由：
 * - `MiniMax*` / `abab*` → MiniMax（OpenAI 兼容接口）
 * - `gemini*`            → Google
 * - 其余                  → OpenAI
 *
 * 主模型失败（额度用尽、服务故障等）自动回退到备用模型，
 * 保证学员天天在用的对话功能不会因为单一服务商挂掉而整个不可用
 * （2026-07 xAI 故障导致作业批改全线失败的教训）。
 */

import { logger } from '@/lib/logger'

const OPENAI_BASE = 'https://api.openai.com/v1'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

/** MiniMax 国内/国际站域名不同，用环境变量兜住 */
const MINIMAX_BASE = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CallOptions {
  model: string
  temperature?: number
  maxTokens?: number
}

type Provider = 'openai' | 'gemini' | 'minimax'

function providerOf(model: string): Provider {
  const m = model.toLowerCase()
  if (m.startsWith('gemini')) return 'gemini'
  if (m.startsWith('minimax') || m.startsWith('abab')) return 'minimax'
  return 'openai'
}

/**
 * GPT-5 系列改用 max_completion_tokens，不再接受 max_tokens
 * （实测：gpt-5.4-mini / 5.4-nano / 5.5 / 5.6-* 传 max_tokens 一律 400）
 */
function usesCompletionTokens(model: string): boolean {
  return /^(gpt-5|o[1-9])/i.test(model)
}

/**
 * 部分模型只接受默认 temperature=1
 * （实测：gpt-5.5 / gpt-5.6-luna / sol / terra 传 0.8 报 unsupported_value；
 *   gpt-5.4-mini / 5.4-nano 可以传，但一旦带上 reasoning_effort 就又不行了）
 */
function acceptsTemperature(model: string): boolean {
  if (!/^gpt-5/i.test(model)) return true
  return /^gpt-5\.4-(mini|nano)/i.test(model)
}

/**
 * 调用 OpenAI 兼容接口（OpenAI 本体和 MiniMax 都走这里）
 */
async function callOpenAICompatible(
  messages: ChatMessage[],
  opts: CallOptions,
  cfg: { base: string; apiKey: string; label: string },
  allowTemperature = acceptsTemperature(opts.model)
): Promise<string> {
  const body: Record<string, unknown> = { model: opts.model, messages }

  if (usesCompletionTokens(opts.model)) {
    // 推理型模型的 reasoning tokens 也算在这个上限里，给宽一点免得正文被截断
    body.max_completion_tokens = (opts.maxTokens ?? 1500) * 2
  } else {
    body.max_tokens = opts.maxTokens ?? 1500
  }

  if (allowTemperature) body.temperature = opts.temperature ?? 0.8

  const res = await fetch(`${cfg.base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const detail = await res.text()

    // 兜底：碰到没见过的模型不接受 temperature 时，去掉重试一次
    if (allowTemperature && res.status === 400 && detail.includes('temperature')) {
      logger.warn(`[llm] ${opts.model} 不接受自定义 temperature，去掉后重试`)
      return callOpenAICompatible(messages, opts, cfg, false)
    }

    throw new Error(`${cfg.label} 请求失败 (${res.status}): ${detail.substring(0, 200)}`)
  }

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content

  if (typeof content !== 'string' || !content.trim()) {
    const reason = json?.choices?.[0]?.finish_reason || 'unknown'
    throw new Error(`${cfg.label} 返回内容为空 (finish_reason=${reason})`)
  }

  return content
}

async function callGemini(messages: ChatMessage[], opts: CallOptions): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY 未配置')

  // Gemini 把 system 单独放 systemInstruction，assistant 角色叫 model
  const systemText = messages
    .filter(m => m.role === 'system')
    .map(m => m.content)
    .join('\n\n')

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

  const res = await fetch(
    `${GEMINI_BASE}/models/${encodeURIComponent(opts.model)}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
        contents,
        generationConfig: {
          temperature: opts.temperature ?? 0.8,
          maxOutputTokens: opts.maxTokens ?? 1500,
          // flash 系列关掉 thinking：否则思考过程会吃掉 maxOutputTokens，
          // 可能返回空内容且 finishReason=MAX_TOKENS。
          // pro 系列不接受 thinkingBudget=0，所以不下发这个参数。
          ...(opts.model.includes('flash') ? { thinkingConfig: { thinkingBudget: 0 } } : {})
        }
      })
    }
  )

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini 请求失败 (${res.status}): ${detail.substring(0, 200)}`)
  }

  const json = await res.json()
  const parts = json?.candidates?.[0]?.content?.parts

  const content = Array.isArray(parts)
    ? parts.map((p: { text?: string }) => p.text || '').join('')
    : ''

  if (!content.trim()) {
    throw new Error(
      `Gemini 返回内容为空 (finishReason=${json?.candidates?.[0]?.finishReason || 'unknown'})`
    )
  }

  return content
}

/**
 * 主模型熔断
 *
 * MiniMax 的 Token Plan 用尽后会持续返回 429，此时每条消息都先白等一次失败
 * 再回退，纯属浪费。这里记一个冷却期，期间直接走备用模型。
 *
 * Serverless 下这是单实例内存状态，实例回收就重置——正好，额度充值后
 * 最多一个冷却周期就会自动恢复尝试，不需要人工干预。
 */
const COOLDOWN_MS = 10 * 60 * 1000
const cooldownUntil = new Map<string, number>()

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /\(429\)|\(401\)|\(403\)|rate_limit|用量上限|insufficient_quota|未配置/.test(msg)
}

async function callOne(messages: ChatMessage[], opts: CallOptions): Promise<string> {
  switch (providerOf(opts.model)) {
    case 'gemini':
      return callGemini(messages, opts)

    case 'minimax': {
      const key = process.env.MINIMAX_API_KEY
      if (!key) throw new Error('MINIMAX_API_KEY 未配置')
      return callOpenAICompatible(messages, opts, {
        base: MINIMAX_BASE,
        apiKey: key,
        label: 'MiniMax'
      })
    }

    default: {
      const key = process.env.OPENAI_API_KEY
      if (!key) throw new Error('OPENAI_API_KEY 未配置')
      return callOpenAICompatible(messages, opts, {
        base: OPENAI_BASE,
        apiKey: key,
        label: 'OpenAI'
      })
    }
  }
}

/**
 * 调用对话模型，主模型失败时自动回退
 *
 * 回退模型默认 gpt-5.4-mini：在 gpt-5 系列里实测最快（4.8s vs nano 7.5s、
 * 5.5 的 13s），价格 $0.75/$4.50 per 1M，质量足够撑住盖亚的语气。
 * nano 虽然更便宜，但实测既慢又啰嗦（1196 字），不适合当兜底。
 */
export async function callChatModel(messages: ChatMessage[], opts: CallOptions): Promise<string> {
  const fallback = process.env.LLM_FALLBACK_MODEL || 'gpt-5.4-mini'

  if (opts.model === fallback) {
    return callOne(messages, opts)
  }

  // 主模型还在冷却期内，直接用备用模型，不浪费一次注定失败的请求
  const until = cooldownUntil.get(opts.model) || 0
  if (Date.now() < until) {
    return callOne(messages, { ...opts, model: fallback })
  }

  try {
    return await callOne(messages, opts)
  } catch (error) {
    if (isQuotaError(error)) {
      cooldownUntil.set(opts.model, Date.now() + COOLDOWN_MS)
      logger.error(
        `[llm] ${opts.model} 额度/鉴权问题，暂停使用 ${COOLDOWN_MS / 60000} 分钟，改用 ${fallback}`,
        error
      )
    } else {
      logger.error(`[llm] ${opts.model} 调用失败，本次回退到 ${fallback}`, error)
    }

    return await callOne(messages, { ...opts, model: fallback })
  }
}
