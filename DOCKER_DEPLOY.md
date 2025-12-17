# Docker 部署指南

## 镜像信息

- **镜像名称**: jiex-app
- **镜像大小**: 51.8MB
- **基础镜像**: nginx:stable-alpine

## 快速开始

### 方法一：使用 Docker Compose（推荐）

```bash
# 构建并启动容器
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问地址：http://localhost:8080

### 方法二：使用 Docker 命令

```bash
# 构建镜像（如果还没构建）
docker build -t jiex-app .

# 运行容器
docker run -d -p 8080:80 --name jiex-app jiex-app

# 查看容器状态
docker ps | grep jiex-app

# 查看容器日志
docker logs -f jiex-app

# 停止容器
docker stop jiex-app

# 启动容器
docker start jiex-app

# 删除容器
docker rm jiex-app
```

## 配置说明

### 端口映射

默认将容器的 80 端口映射到宿主机的 8080 端口。如需修改，可以：

#### Docker Compose 方式
编辑 `docker-compose.yml` 文件：
```yaml
ports:
  - "3000:80"  # 改为 3000 端口
```

#### Docker 命令方式
```bash
docker run -d -p 3000:80 --name jiex-app jiex-app
```

### 环境变量

可以通过环境变量配置：

```bash
docker run -d \
  -p 8080:80 \
  -e NODE_ENV=production \
  --name jiex-app \
  jiex-app
```

## 镜像管理

### 查看所有镜像
```bash
docker images
```

### 删除镜像
```bash
docker rmi jiex-app
```

### 重新构建镜像
```bash
docker build -t jiex-app . --no-cache
```

## 容器管理

### 进入容器
```bash
docker exec -it jiex-app sh
```

### 查看容器详细信息
```bash
docker inspect jiex-app
```

### 重启容器
```bash
docker restart jiex-app
```

## 生产部署建议

### 1. 使用自定义 Nginx 配置

创建 `nginx.conf` 文件并在 Dockerfile 中添加：
```dockerfile
COPY nginx.conf /etc/nginx/nginx.conf
```

### 2. 启用 HTTPS

使用 nginx-proxy 或 Traefik 等反向代理工具：
```yaml
version: '3.8'
services:
  jiex-app:
    image: jiex-app
    expose:
      - "80"
    environment:
      - VIRTUAL_HOST=yourdomain.com
      - LETSENCRYPT_HOST=yourdomain.com
```

### 3. 持久化日志

```bash
docker run -d \
  -p 8080:80 \
  -v /var/log/nginx:/var/log/nginx \
  --name jiex-app \
  jiex-app
```

### 4. 健康检查

在 `docker-compose.yml` 中添加：
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 故障排查

### 容器无法启动
```bash
# 查看容器日志
docker logs jiex-app

# 检查端口是否被占用
lsof -i :8080
```

### 应用访问不了
```bash
# 检查容器是否运行
docker ps | grep jiex-app

# 检查防火墙规则
# macOS
sudo pfctl -s rules

# Linux
sudo iptables -L
```

### 镜像构建失败
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker build -t jiex-app . --no-cache
```

## 备份与恢复

### 保存镜像
```bash
docker save jiex-app > jiex-app.tar
```

### 加载镜像
```bash
docker load < jiex-app.tar
```

### 推送到 Docker Hub
```bash
# 标记镜像
docker tag jiex-app your-username/jiex-app:v1.0

# 登录 Docker Hub
docker login

# 推送镜像
docker push your-username/jiex-app:v1.0
```

## 性能优化

### 1. 多阶段构建（已实现）
当前 Dockerfile 已使用多阶段构建，大大减少了镜像大小。

### 2. 使用 Alpine 基础镜像（已实现）
使用轻量级的 Alpine Linux 作为基础镜像。

### 3. 启用 Gzip 压缩
在 nginx 配置中启用 gzip：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

## 监控和日志

### 查看实时日志
```bash
docker logs -f --tail 100 jiex-app
```

### 导出日志
```bash
docker logs jiex-app > app.log 2>&1
```

## 更新部署

### 滚动更新
```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker build -t jiex-app .

# 停止旧容器
docker stop jiex-app

# 删除旧容器
docker rm jiex-app

# 启动新容器
docker run -d -p 8080:80 --name jiex-app jiex-app
```

或使用 Docker Compose：
```bash
docker-compose down
docker-compose build
docker-compose up -d
```
