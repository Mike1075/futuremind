/**
 * 统一的对话模型调用层
 *
 * 原先盖亚和 AIP 的 LLM 调用都跑在 N8N 里（两个工作流都挂的是
 * Google Gemini Chat Model 节点），N8N 失联后这层搬回项目内。
 *
 * 按模型名自动选择服务商：`gemini-*` 走 Google，其余走 OpenAI 兼容接口。
 */

import { logger } from '@/lib/logger'

const OPENAI_BASE = 'https://api.openai.com/v1'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CallOptions {
  model: string
  temperature?: number
  maxTokens?: number
}

function isGemini(model: string): boolean {
  return model.startsWith('gemini')
}

async function callOpenAI(messages: ChatMessage[], opts: CallOptions): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY 未配置')

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: opts.model,
      messages,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.maxTokens ?? 1500
    })
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`OpenAI 请求失败 (${res.status}): ${detail.substring(0, 200)}`)
  }

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI 返回内容为空')
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
 * 调用对话模型
 *
 * Gemini 不可用时自动退回 OpenAI——盖亚/AIP 对话是学员天天在用的功能，
 * 单一服务商故障不该让它整个不可用（2026-07 xAI 故障导致作业批改全线失败的教训）。
 */
export async function callChatModel(messages: ChatMessage[], opts: CallOptions): Promise<string> {
  try {
    return isGemini(opts.model)
      ? await callGemini(messages, opts)
      : await callOpenAI(messages, opts)
  } catch (error) {
    const fallback = process.env.LLM_FALLBACK_MODEL || 'gpt-4o'

    if (!isGemini(opts.model) || !process.env.OPENAI_API_KEY) {
      throw error
    }

    logger.error(`[llm] ${opts.model} 调用失败，回退到 ${fallback}`, error)
    return await callOpenAI(messages, { ...opts, model: fallback })
  }
}
