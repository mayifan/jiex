import { requestGlmOcrText } from '../../server/glmOcrService.mjs'
import { parseRequestBody, writeJson } from '../_utils/http.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    writeJson(res, 405, { error: 'Method Not Allowed' })
    return
  }

  try {
    const body = await parseRequestBody(req)
    const file = String(body?.file || body?.imageUrl || body?.imageBase64 || '').trim()

    if (!file) {
      writeJson(res, 400, { error: '缺少 file 参数' })
      return
    }

    const text = await requestGlmOcrText({ file })
    writeJson(res, 200, { text })
  } catch (error) {
    console.error('Vercel GLM-OCR failed:', error, {
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      hasGlmOcrKey: Boolean(String(process.env.GLM_OCR_API_KEY || '').trim()),
      hasZhipuKey: Boolean(String(process.env.ZHIPU_API_KEY || '').trim())
    })
    writeJson(res, 500, {
      error: error?.message || 'GLM-OCR 调用失败'
    })
  }
}
