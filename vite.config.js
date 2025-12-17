import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 根据环境变量判断 base 路径
// Vercel 部署: base = '/'
// GitHub Pages: base = '/jiex/'
export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_PAGES === 'true' ? '/jiex/' : '/'
})