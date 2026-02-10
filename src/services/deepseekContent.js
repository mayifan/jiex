import { postJson } from './http'

const DEEPSEEK_CONTENT_API = '/api/deepseek/content'

export const requestInitiationContent = async (projectName) => {
  const payload = await postJson({
    url: DEEPSEEK_CONTENT_API,
    body: { projectName },
    networkErrorMessage: '网络请求失败'
  })
  const content = payload?.content?.trim()
  if (!content) {
    throw new Error('AI 未返回有效内容，请稍后重试')
  }

  return content
}
