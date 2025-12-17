# Windows 一键部署指南

## 📋 前提条件

1. **安装 Docker Desktop**
   - 下载地址：https://www.docker.com/products/docker-desktop
   - 安装后重启电脑
   - 确保 Docker Desktop 正在运行（系统托盘图标显示）

2. **准备文件**
   - `jiex-app.tar` - Docker 镜像文件
   - `deploy.bat` - 一键部署脚本（批处理版本）
   - `deploy.ps1` - 一键部署脚本（PowerShell 版本）
   - `stop.bat` - 停止脚本

## 🚀 一键部署（推荐）

### 方法一：使用批处理脚本（最简单）

1. **将所有文件放在同一文件夹**
   ```
   C:\jiex-app\
   ├── jiex-app.tar
   ├── deploy.bat
   └── stop.bat
   ```

2. **双击运行 `deploy.bat`**
   - 右键点击 `deploy.bat`
   - 选择 "以管理员身份运行"（推荐）
   - 或直接双击运行

3. **等待部署完成**
   - 脚本会自动检查环境
   - 加载 Docker 镜像
   - 启动容器
   - 提示是否打开浏览器

4. **访问应用**
   - 浏览器访问：http://localhost:8080
   - 开始使用！

### 方法二：使用 PowerShell 脚本（推荐高级用户）

1. **右键点击 `deploy.ps1`**

2. **选择 "使用 PowerShell 运行"**
   - 如果提示执行策略错误，以管理员身份打开 PowerShell
   - 运行：`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
   - 然后重新右键点击 `deploy.ps1` -> "使用 PowerShell 运行"

3. **等待部署完成**
   - PowerShell 版本有彩色输出，更易读
   - 自动检查所有步骤

4. **访问应用**
   - 浏览器访问：http://localhost:8080

---

## 🛑 停止应用

### 使用停止脚本（推荐）

**双击 `stop.bat`**
- 自动停止容器
- 删除容器
- 可选择删除镜像

### 手动停止

```cmd
# 停止容器
docker stop jiex-app

# 删除容器
docker rm jiex-app
```

---

## 🔄 重新启动

如果容器已停止，重新启动：

```cmd
docker start jiex-app
```

或者重新运行 `deploy.bat`

---

## 📊 部署步骤详解

`deploy.bat` 自动执行以下步骤：

1. ✅ **检查 Docker 是否安装**
   - 验证 Docker 命令可用

2. ✅ **检查 Docker 是否运行**
   - 确保 Docker Desktop 已启动

3. ✅ **检查镜像文件**
   - 验证 jiex-app.tar 存在

4. ✅ **加载 Docker 镜像**
   - 从 tar 文件加载镜像到 Docker

5. ✅ **启动容器**
   - 自动清理旧容器（如果存在）
   - 启动新容器
   - 映射端口 8080

6. ✅ **打开浏览器**（可选）
   - 询问是否自动打开浏览器

---

## ⚠️ 常见问题

### 问题1：脚本无法运行

**解决方案：**
- 右键点击 `deploy.bat` -> "以管理员身份运行"
- 确保文件名没有被修改
- 检查文件是否被杀毒软件阻止

### 问题2：Docker 未运行

**解决方案：**
```
1. 打开 Docker Desktop
2. 等待 Docker 图标显示为绿色
3. 重新运行 deploy.bat
```

### 问题3：端口 8080 被占用

**解决方案：**

**方法A：关闭占用端口的程序**
```cmd
# 查看占用 8080 端口的程序
netstat -ano | findstr :8080

# 记下 PID，在任务管理器中结束该进程
```

**方法B：使用其他端口**
```cmd
# 编辑 deploy.bat，将 8080 改为其他端口（如 9000）
# 找到这一行：
docker run -d -p 8080:80 --name jiex-app jiex-app:latest

# 改为：
docker run -d -p 9000:80 --name jiex-app jiex-app:latest

# 然后访问 http://localhost:9000
```

### 问题4：镜像加载失败

**解决方案：**
```
1. 检查 jiex-app.tar 文件是否完整
2. 重新下载镜像文件
3. 确保磁盘空间充足（至少 500MB）
```

### 问题5：PowerShell 执行策略错误

**错误信息：**
```
无法加载文件 deploy.ps1，因为在此系统上禁止运行脚本
```

**解决方案：**
```powershell
# 以管理员身份打开 PowerShell
# 运行以下命令：
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后重新运行脚本
```

### 问题6：容器启动但无法访问

**解决方案：**
```cmd
# 1. 检查容器是否运行
docker ps

# 2. 查看容器日志
docker logs jiex-app

# 3. 检查防火墙设置
#    允许 Docker Desktop 通过防火墙

# 4. 重启容器
docker restart jiex-app
```

---

## 🔧 手动部署（不使用脚本）

如果脚本无法使用，可以手动执行：

```cmd
# 1. 加载镜像
docker load -i jiex-app.tar

# 2. 运行容器
docker run -d -p 8080:80 --name jiex-app jiex-app:latest

# 3. 打开浏览器
# 访问 http://localhost:8080
```

---

## 📱 验证部署成功

### 1. 检查容器状态
```cmd
docker ps
```
应该看到：
```
CONTAINER ID   IMAGE              STATUS         PORTS                  NAMES
xxxxx          jiex-app:latest    Up 2 minutes   0.0.0.0:8080->80/tcp   jiex-app
```

### 2. 访问应用
打开浏览器，访问：http://localhost:8080

应该看到应用界面

### 3. 测试功能
- 上传 Excel 文件测试
- 金额分配功能测试
- 生成文档测试

---

## 🛠️ 常用命令

```cmd
# 查看所有容器
docker ps -a

# 查看容器日志
docker logs jiex-app

# 查看实时日志
docker logs -f jiex-app

# 停止容器
docker stop jiex-app

# 启动容器
docker start jiex-app

# 重启容器
docker restart jiex-app

# 删除容器
docker rm jiex-app

# 查看镜像
docker images

# 删除镜像
docker rmi jiex-app:latest

# 进入容器（调试用）
docker exec -it jiex-app sh
```

---

## 📞 获取帮助

如果遇到问题，请提供以下信息：

1. **系统信息**
   ```cmd
   systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
   ```

2. **Docker 版本**
   ```cmd
   docker --version
   ```

3. **容器状态**
   ```cmd
   docker ps -a
   ```

4. **容器日志**
   ```cmd
   docker logs jiex-app
   ```

5. **错误截图**

---

## 🎉 部署成功标志

当看到以下内容时，说明部署成功：

```
========================================
  部署成功！
========================================

[成功] 应用已成功部署并运行！

访问地址: http://localhost:8080

容器名称: jiex-app
容器状态: 运行中
```

---

## 📝 卸载说明

### 完全卸载

1. **运行 stop.bat**
   - 选择 "Y" 删除镜像

2. **或手动删除**
   ```cmd
   # 停止并删除容器
   docker stop jiex-app
   docker rm jiex-app

   # 删除镜像
   docker rmi jiex-app:latest

   # 删除文件
   # 手动删除文件夹中的所有文件
   ```

### 保留数据卸载

只删除容器，保留镜像（方便下次快速部署）：
```cmd
docker stop jiex-app
docker rm jiex-app
```

---

## ✨ 提示和技巧

1. **首次部署后**
   - 如果容器已创建，直接运行 `docker start jiex-app` 即可
   - 无需重新加载镜像

2. **更新应用**
   - 停止并删除旧容器：`stop.bat`
   - 运行新的部署脚本：`deploy.bat`

3. **快速访问**
   - 创建桌面快捷方式指向 http://localhost:8080

4. **开机自启动**
   - 将 `docker start jiex-app` 命令添加到启动脚本

---

祝您使用愉快！🚀
