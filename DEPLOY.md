# 部署指南

本项目支持两种部署方式：Vercel 和 GitHub Pages。

## Vercel 部署

Vercel 会自动部署，无需额外配置。每次推送代码到 master 分支，Vercel 会自动重新部署。

```bash
npm run build
git add dist/
git commit -m "update"
git push
```

## GitHub Pages 部署

GitHub Pages 需要使用特殊的构建命令：

```bash
npm run build:github
git add dist/
git commit -m "update for GitHub Pages"
git push
```

### GitHub Pages 设置

1. 进入仓库的 Settings > Pages
2. Source 选择: `Deploy from a branch`
3. Branch 选择: `master` 分支，文件夹选择 `/` (root)
4. 保存后等待部署完成

访问: https://mayifan.github.io/jiex/

## 注意事项

- **Vercel**: 使用 `npm run build`（base 路径为 `/`）
- **GitHub Pages**: 使用 `npm run build:github`（base 路径为 `/jiex/`）
- 两个平台不能同时使用同一份构建产物
