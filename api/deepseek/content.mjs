import { requestDeepSeekContent } from '../../server/deepseekService.mjs'
import { parseRequestBody, writeJson } from '../_utils/http.mjs'

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
