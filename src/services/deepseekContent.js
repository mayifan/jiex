const DEEPSEEK_CONTENT_API = '/api/deepseek/content'

const resolveErrorMessage = async (response) => {
  try {
    const payload = await response.json()
    if (payload?.error) return payload.error
  } catch {
    // ignore response parsing error and fallback to status text
  }
  return response.statusText || '请求失败'
}

export const requestInitiationContent = async (projectName) => {
  const response = await fetch(DEEPSEEK_CONTENT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ projectName })
  })

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
