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

export const postJson = async ({ url, body, networkErrorMessage }) => {
  let response

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  } catch (error) {
    throw new Error(`${networkErrorMessage}：${error?.message || `无法连接到 ${url}`}`)
  }

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response))
  }

  return response.json()
}
