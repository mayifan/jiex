import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { requestDeepSeekContent } from './server/deepseekService.mjs'
import { requestGlmOcrText } from './server/glmOcrService.mjs'

const writeJson = (res, status, payload) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  req.on('error', reject)
})

const deepseekDevApiPlugin = () => {
  const registerHandler = (middlewares) => {
    middlewares.use('/api/deepseek/content', async (req, res, next) => {
      if (req.method !== 'POST') {
        next()
        return
      }

      try {
        const rawBody = await readBody(req)
        const payload = rawBody ? JSON.parse(rawBody) : {}
        const projectName = payload?.projectName
        if (!projectName) {
          writeJson(res, 400, { error: '缺少 projectName 参数' })
          return
        }

        const content = await requestDeepSeekContent(projectName)
        writeJson(res, 200, { content })
      } catch (error) {
        console.error('Vite DeepSeek API failed:', error)
        writeJson(res, 500, { error: error.message || 'DeepSeek调用失败' })
      }
    })
  }

  return {
    name: 'deepseek-dev-api',
    configureServer(server) {
      registerHandler(server.middlewares)
    },
    configurePreviewServer(server) {
      registerHandler(server.middlewares)
    }
  }
}

const glmOcrDevApiPlugin = () => {
  const registerHandler = (middlewares) => {
    middlewares.use('/api/glm/ocr', async (req, res, next) => {
      if (req.method !== 'POST') {
        next()
        return
      }

      try {
        const rawBody = await readBody(req)
        const payload = rawBody ? JSON.parse(rawBody) : {}
        const file = payload?.file || payload?.imageUrl || payload?.imageBase64
        if (!file) {
          writeJson(res, 400, { error: '缺少 file 参数' })
          return
        }

        const text = await requestGlmOcrText({ file })
        writeJson(res, 200, { text })
      } catch (error) {
        console.error('Vite GLM-OCR API failed:', error)
        writeJson(res, 500, { error: error.message || 'GLM-OCR调用失败' })
      }
    })
  }

  return {
    name: 'glm-ocr-dev-api',
    configureServer(server) {
      registerHandler(server.middlewares)
    },
    configurePreviewServer(server) {
      registerHandler(server.middlewares)
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [vue(), deepseekDevApiPlugin(), glmOcrDevApiPlugin()],
    base: process.env.GITHUB_PAGES === 'true' ? '/jiex/' : '/'
  }
})
