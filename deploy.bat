@echo off
chcp 65001 >nul
echo ========================================
echo   结项单生成工具 - 一键部署脚本
echo ========================================
echo.

:: 检查是否以管理员权限运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [警告] 建议以管理员权限运行此脚本
    echo 右键点击脚本，选择"以管理员身份运行"
    echo.
    pause
)

:: 检查 Docker 是否安装
echo [1/5] 检查 Docker 是否安装...
docker --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 未检测到 Docker！
    echo 请先安装 Docker Desktop for Windows
    echo 下载地址: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo [成功] Docker 已安装
docker --version
echo.

:: 检查 Docker 是否运行
echo [2/5] 检查 Docker 是否运行...
docker info >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] Docker 未运行！
    echo 请先启动 Docker Desktop
    echo.
    pause
    exit /b 1
)
echo [成功] Docker 正在运行
echo.

:: 检查镜像文件是否存在
echo [3/5] 检查镜像文件...
if not exist "jiex-app.tar" (
    echo [错误] 未找到镜像文件 jiex-app.tar
    echo 请确保 jiex-app.tar 文件与此脚本在同一目录
    echo.
    pause
    exit /b 1
)
echo [成功] 找到镜像文件 jiex-app.tar
echo.

:: 加载 Docker 镜像
echo [4/5] 加载 Docker 镜像...
echo 这可能需要几秒钟，请耐心等待...
docker load -i jiex-app.tar
if %errorLevel% neq 0 (
    echo [错误] 镜像加载失败！
    echo.
    pause
    exit /b 1
)
echo [成功] 镜像加载完成
echo.

:: 检查是否已有容器在运行
echo [5/5] 启动应用容器...
docker ps -a | findstr jiex-app >nul 2>&1
if %errorLevel% equ 0 (
    echo [提示] 检测到已存在的容器，正在清理...
    docker stop jiex-app >nul 2>&1
    docker rm jiex-app >nul 2>&1
    echo [成功] 旧容器已清理
)

:: 运行容器
echo [启动] 正在启动应用容器...
docker run -d -p 8080:80 --name jiex-app jiex-app:latest
if %errorLevel% neq 0 (
    echo [错误] 容器启动失败！
    echo.
    echo 可能的原因：
    echo 1. 端口 8080 已被占用
    echo 2. Docker 资源不足
    echo.
    echo 尝试解决方案：
    echo 1. 关闭占用 8080 端口的程序
    echo 2. 重启 Docker Desktop
    echo 3. 重启电脑
    echo.
    pause
    exit /b 1
)

:: 等待容器启动
echo [等待] 等待容器启动...
timeout /t 3 /nobreak >nul

:: 检查容器状态
docker ps | findstr jiex-app >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 容器未能正常启动
    echo [日志] 查看容器日志...
    docker logs jiex-app
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   部署成功！
echo ========================================
echo.
echo [成功] 应用已成功部署并运行！
echo.
echo 访问地址: http://localhost:8080
echo.
echo 容器名称: jiex-app
echo 容器状态: 运行中
echo.
echo ----------------------------------------
echo 常用命令:
echo ----------------------------------------
echo 查看容器状态:  docker ps
echo 查看容器日志:  docker logs jiex-app
echo 停止容器:      docker stop jiex-app
echo 启动容器:      docker start jiex-app
echo 重启容器:      docker restart jiex-app
echo 删除容器:      docker stop jiex-app ^&^& docker rm jiex-app
echo ----------------------------------------
echo.

:: 询问是否打开浏览器
set /p openBrowser="是否立即打开浏览器？(Y/N): "
if /i "%openBrowser%"=="Y" (
    echo [启动] 正在打开浏览器...
    start http://localhost:8080
)

echo.
echo 按任意键退出...
pause >nul
