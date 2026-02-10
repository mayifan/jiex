const DEEPSEEK_CONTENT_API = '/api/deepseek/content'

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

export const requestInitiationContent = async (projectName) => {
  let response
  try {
    response = await fetch(DEEPSEEK_CONTENT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectName })
    })
  } catch (error) {
    throw new Error(`网络请求失败：${error?.message || '无法连接到 /api/deepseek/content'}`)
  }

  if (!response.ok) {
    const message = await resolveErrorMessage(response)
    throw new Error(message)
  }

  const payload = await response.json()
  const content = payload?.content?.trim()
  if (!content) {
    throw new Error('AI 未返回有效内容，请稍后重试')
  }

  return content
}
