import express from 'express'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { requestDeepSeekContent } from './deepseekService.mjs'
import { requestGlmOcrText } from './glmOcrService.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')
dotenv.config({ path: path.join(rootDir, '.env.local') })
dotenv.config({ path: path.join(rootDir, '.env') })

const app = express()
const port = Number(process.env.PORT || 8080)

app.use(express.json({ limit: '20mb' }))

const getTrimmedString = (value) => String(value ?? '').trim()
const handleApiError = (res, error, fallback) => {
  res.status(500).json({ error: error?.message || fallback })
}

app.post('/api/deepseek/content', async (req, res) => {
  const projectName = getTrimmedString(req.body?.projectName)
  if (!projectName) {
    res.status(400).json({ error: '缺少 projectName 参数' })
    return
  }
  try {
    const content = await requestDeepSeekContent(projectName)
    res.json({ content })
  } catch (error) {
    console.error('DeepSeek content generation failed:', error)
    handleApiError(res, error, 'DeepSeek调用失败')
  }
})

app.post('/api/glm/ocr', async (req, res) => {
  const file = getTrimmedString(req.body?.file || req.body?.imageUrl || req.body?.imageBase64)
  if (!file) {
    res.status(400).json({ error: '缺少 file 参数' })
    return
  }

  try {
    const text = await requestGlmOcrText({ file })
    res.json({ text })
  } catch (error) {
    console.error('GLM-OCR failed:', error)
    handleApiError(res, error, 'GLM-OCR 调用失败')
  }
})

if (existsSync(distDir)) {
  app.use(express.static(distDir))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Jiex server running on http://localhost:${port}`)
})
