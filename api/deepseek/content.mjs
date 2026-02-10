import { requestDeepSeekContent } from '../../server/deepseekService.mjs'

const writeJson = (res, statusCode, payload) => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

const readRawBody = async (req) => {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

const parseRequestBody = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }

  const raw = await readRawBody(req)
  if (!raw) return {}

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    writeJson(res, 405, { error: 'Method Not Allowed' })
    return
  }

  try {
    const body = await parseRequestBody(req)
    const projectName = String(body?.projectName || '').trim()

    if (!projectName) {
      writeJson(res, 400, { error: '缺少 projectName 参数' })
      return
    }

    const content = await requestDeepSeekContent(projectName)
    writeJson(res, 200, { content })
  } catch (error) {
    console.error('Vercel DeepSeek content generation failed:', error)
    writeJson(res, 500, {
      error: error?.message || 'DeepSeek调用失败'
    })
  }
}
