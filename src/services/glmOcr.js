import { postJson } from './http'

const GLM_OCR_API = '/api/glm/ocr'

export const requestGlmOcrText = async ({ file } = {}) => {
  const payload = await postJson({
    url: GLM_OCR_API,
    body: { file },
    networkErrorMessage: '网络请求失败'
  })
  const text = payload?.text?.trim()
  if (!text) {
    throw new Error('OCR 未返回有效文本，请稍后重试')
  }

  return text
}
