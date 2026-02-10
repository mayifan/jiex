import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const ensureEnvLoaded = () => {
  const candidateDirs = [process.cwd(), rootDir]
  candidateDirs.forEach((dir) => {
    dotenv.config({ path: path.join(dir, '.env.local'), override: true })
    dotenv.config({ path: path.join(dir, '.env'), override: true })
  })
}

const getBaseUrl = () => process.env.GLM_OCR_BASE_URL || 'https://open.bigmodel.cn'
const getApiUrl = () => process.env.GLM_OCR_API_URL || ''
const getApiKey = () => process.env.GLM_OCR_API_KEY || ''
const getModel = () => process.env.GLM_OCR_MODEL || 'glm-ocr'

const resolveApiUrl = () => {
  const apiUrl = String(getApiUrl() || '').trim()
  if (apiUrl) return apiUrl
  const trimmed = String(getBaseUrl() || '').trim().replace(/\/+$/, '')
  return `${trimmed}/api/paas/v4/layout_parsing`
}

const normalizeAuth = (value = '') => {
  const token = String(value || '').trim()
  if (!token) return ''
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

const extractOcrText = (payload) => {
  if (!payload || typeof payload !== 'object') return ''
  const target = payload.data && typeof payload.data === 'object' ? payload.data : payload

  const mdResults = typeof target.md_results === 'string' ? target.md_results.trim() : ''
  if (mdResults) return mdResults

  const text = typeof target.text === 'string' ? target.text.trim() : ''
  if (text) return text

  const details = target.layout_details
  if (Array.isArray(details)) {
    const lines = []
    details.flat().forEach((item) => {
      if (item && typeof item.content === 'string' && item.content.trim()) {
        lines.push(item.content.trim())
      }
    })
    return lines.join('\n').trim()
  }

  return ''
}

const normalizeFilePayload = (file = '') => {
  return String(file || '').trim()
}

export const requestGlmOcrText = async ({ file } = {}) => {
  ensureEnvLoaded()
  const safeFile = normalizeFilePayload(file)
  if (!safeFile) {
    throw new Error('OCR 识别缺少文件数据')
  }

  const apiKey = normalizeAuth(getApiKey())
  if (!apiKey) {
    throw new Error('服务端未配置 GLM_OCR_API_KEY，无法调用 GLM-OCR')
  }

  const response = await fetch(resolveApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey
    },
    body: JSON.stringify({
      model: getModel(),
      file: safeFile
    })
  })

  if (!response.ok) {
    let details = response.statusText
    try {
      const errorPayload = await response.json()
      details = errorPayload?.error?.message || errorPayload?.error || errorPayload?.message || details
    } catch {
      // ignore parsing error
    }
    throw new Error(`GLM-OCR 请求失败(${response.status})：${details || '未知错误'}`)
  }

  const payload = await response.json()
  const text = extractOcrText(payload)
  if (!text) {
    throw new Error('GLM-OCR 未返回可用文本')
  }

  return text
}
