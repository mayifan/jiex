@echo off
chcp 65001 >nul
echo ========================================
echo   结项单生成工具 - 停止脚本
echo ========================================
echo.

:: 检查 Docker 是否运行
echo [1/2] 检查 Docker 是否运行...
docker info >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] Docker 未运行！
    echo 无需停止容器
    echo.
    pause
    exit /b 0
)
echo [成功] Docker 正在运行
echo.

:: 停止并删除容器
echo [2/2] 停止并删除容器...
docker ps -a | findstr jiex-app >nul 2>&1
if %errorLevel% neq 0 (
    echo [提示] 未找到容器 jiex-app
    echo 容器可能已经被删除
    echo.
    pause
    exit /b 0
)

echo [执行] 正在停止容器...
docker stop jiex-app
if %errorLevel% neq 0 (
    echo [警告] 停止容器失败，尝试强制删除...
)

echo [执行] 正在删除容器...
docker rm jiex-app
if %errorLevel% neq 0 (
    echo [错误] 删除容器失败！
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   操作成功！
echo ========================================
echo.
echo [成功] 容器已停止并删除
echo.
echo ----------------------------------------
echo 提示:
echo ----------------------------------------
echo 1. 容器已完全删除
echo 2. 如需重新部署，请运行 deploy.bat
echo 3. Docker 镜像仍保留在系统中
echo 4. 如需删除镜像，请运行: docker rmi jiex-app:latest
echo ----------------------------------------
echo.

set /p removeImage="是否同时删除 Docker 镜像？(Y/N): "
if /i "%removeImage%"=="Y" (
    echo [执行] 正在删除镜像...
    docker rmi jiex-app:latest
    if %errorLevel% equ 0 (
        echo [成功] 镜像已删除
    ) else (
        echo [警告] 镜像删除失败，可能仍被其他容器使用
    )
    echo.
)

echo 按任意键退出...
pause >nul
