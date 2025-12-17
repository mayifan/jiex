@echo off
chcp 65001 >nul
echo ========================================
echo   创建部署包
echo ========================================
echo.

set DEPLOY_DIR=jiex-app-deploy-windows
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%

echo [1/3] 创建部署文件夹...
if exist "%DEPLOY_DIR%" (
    echo [提示] 删除旧的部署文件夹...
    rmdir /s /q "%DEPLOY_DIR%"
)
mkdir "%DEPLOY_DIR%"
echo [成功] 文件夹已创建: %DEPLOY_DIR%
echo.

echo [2/3] 复制文件到部署文件夹...

:: 复制必需文件
echo [复制] jiex-app.tar
copy /y "jiex-app.tar" "%DEPLOY_DIR%\" >nul
if %errorLevel% neq 0 (
    echo [错误] 无法复制 jiex-app.tar
    pause
    exit /b 1
)

echo [复制] deploy.bat
copy /y "deploy.bat" "%DEPLOY_DIR%\" >nul

echo [复制] stop.bat
copy /y "stop.bat" "%DEPLOY_DIR%\" >nul

echo [复制] 开始使用.txt
copy /y "开始使用.txt" "%DEPLOY_DIR%\" >nul

echo [复制] WINDOWS_DEPLOY.md
copy /y "WINDOWS_DEPLOY.md" "%DEPLOY_DIR%\" >nul

:: 复制可选文件
echo [复制] deploy.ps1
copy /y "deploy.ps1" "%DEPLOY_DIR%\" >nul

echo [复制] DOCKER_USAGE.md
copy /y "DOCKER_USAGE.md" "%DEPLOY_DIR%\" >nul

echo.
echo [成功] 所有文件已复制完成
echo.

echo [3/3] 生成说明文件...
(
echo ========================================
echo   结项单生成工具 - Windows 部署包
echo ========================================
echo.
echo 快速开始：
echo 1. 双击运行 deploy.bat
echo 2. 访问 http://localhost:8080
echo.
echo 详细说明请查看：
echo - 开始使用.txt ^(快速入门^)
echo - WINDOWS_DEPLOY.md ^(完整文档^)
echo.
echo ========================================
) > "%DEPLOY_DIR%\README.txt"

echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo [成功] 部署包已创建
echo.
echo 文件夹位置: %CD%\%DEPLOY_DIR%
echo.
echo 包含文件:
dir /b "%DEPLOY_DIR%"
echo.
echo ----------------------------------------
echo 下一步操作:
echo ----------------------------------------
echo 1. 将整个 %DEPLOY_DIR% 文件夹发送给用户
echo 2. 或压缩为 ZIP 文件后发送
echo 3. 用户只需运行文件夹中的 deploy.bat 即可
echo ----------------------------------------
echo.

set /p openFolder="是否打开文件夹？(Y/N): "
if /i "%openFolder%"=="Y" (
    explorer "%DEPLOY_DIR%"
)

echo.
echo 按任意键退出...
pause >nul
