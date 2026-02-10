const GLM_OCR_API = '/api/glm/ocr'

const resolveErrorMessage = async (response) => {
  try {
    const payload = await response.json()
    if (payload?.error) return payload.error
  } catch {
    // ignore response parsing error and try plain text
  }

  try {
    const text = await response.text()
    if (text?.trim()) return text.trim().slice(0, 200)
  } catch {
    // ignore plain text parsing failure
  }

  return response.statusText || `请求失败(${response.status})`
}

export const requestGlmOcrText = async ({ file } = {}) => {
  let response
  try {
    response = await fetch(GLM_OCR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file })
    })
  } catch (error) {
    throw new Error(`网络请求失败：${error?.message || '无法连接到 /api/glm/ocr'}`)
  }

  if (!response.ok) {
    const message = await resolveErrorMessage(response)
    throw new Error(message)
  }

  const payload = await response.json()
  const text = payload?.text?.trim()
  if (!text) {
    throw new Error('OCR 未返回有效文本，请稍后重试')
  }

  return text
}
