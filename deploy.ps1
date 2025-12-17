# 结项单生成工具 - PowerShell 一键部署脚本
# 使用方法：右键点击此文件 -> "使用 PowerShell 运行"

# 设置控制台编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 颜色输出函数
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($Message) {
    Write-ColorOutput Green "[成功] $Message"
}

function Write-Info($Message) {
    Write-ColorOutput Cyan "[提示] $Message"
}

function Write-Warning($Message) {
    Write-ColorOutput Yellow "[警告] $Message"
}

function Write-Error-Custom($Message) {
    Write-ColorOutput Red "[错误] $Message"
}

# 标题
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  结项单生成工具 - 一键部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "建议以管理员权限运行此脚本"
    Write-Info "右键点击脚本，选择 '以管理员身份运行'"
    Write-Host ""
}

# 步骤1: 检查 Docker 是否安装
Write-Info "[1/5] 检查 Docker 是否安装..."
try {
    $dockerVersion = docker --version
    Write-Success "Docker 已安装"
    Write-Host "    版本: $dockerVersion" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Error-Custom "未检测到 Docker！"
    Write-Host "请先安装 Docker Desktop for Windows" -ForegroundColor Yellow
    Write-Host "下载地址: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

# 步骤2: 检查 Docker 是否运行
Write-Info "[2/5] 检查 Docker 是否运行..."
try {
    docker info | Out-Null
    Write-Success "Docker 正在运行"
    Write-Host ""
} catch {
    Write-Error-Custom "Docker 未运行！"
    Write-Host "请先启动 Docker Desktop" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

# 步骤3: 检查镜像文件
Write-Info "[3/5] 检查镜像文件..."
$imagePath = Join-Path $PSScriptRoot "jiex-app.tar"
if (-not (Test-Path $imagePath)) {
    Write-Error-Custom "未找到镜像文件 jiex-app.tar"
    Write-Host "请确保 jiex-app.tar 文件与此脚本在同一目录" -ForegroundColor Yellow
    Write-Host "当前脚本路径: $PSScriptRoot" -ForegroundColor Gray
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}
$fileSize = (Get-Item $imagePath).Length / 1MB
Write-Success "找到镜像文件 jiex-app.tar"
Write-Host "    文件大小: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
Write-Host ""

# 步骤4: 加载 Docker 镜像
Write-Info "[4/5] 加载 Docker 镜像..."
Write-Host "这可能需要几秒钟，请耐心等待..." -ForegroundColor Yellow
try {
    docker load -i $imagePath
    Write-Success "镜像加载完成"
    Write-Host ""
} catch {
    Write-Error-Custom "镜像加载失败！"
    Write-Host "错误信息: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

# 步骤5: 启动应用容器
Write-Info "[5/5] 启动应用容器..."

# 检查是否已有容器
$existingContainer = docker ps -a --filter "name=jiex-app" --format "{{.Names}}" 2>$null
if ($existingContainer -eq "jiex-app") {
    Write-Info "检测到已存在的容器，正在清理..."
    docker stop jiex-app 2>$null | Out-Null
    docker rm jiex-app 2>$null | Out-Null
    Write-Success "旧容器已清理"
}

# 运行新容器
Write-Host "正在启动应用容器..." -ForegroundColor Cyan
try {
    docker run -d -p 8080:80 --name jiex-app jiex-app:latest | Out-Null

    # 等待容器启动
    Write-Host "等待容器启动..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3

    # 检查容器状态
    $containerStatus = docker ps --filter "name=jiex-app" --format "{{.Status}}"
    if ($containerStatus) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  部署成功！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Success "应用已成功部署并运行！"
        Write-Host ""
        Write-Host "访问地址: " -NoNewline
        Write-Host "http://localhost:8080" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "容器名称: jiex-app" -ForegroundColor Gray
        Write-Host "容器状态: $containerStatus" -ForegroundColor Gray
        Write-Host ""

        # 常用命令
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host "常用命令:" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host "查看容器状态:  " -NoNewline; Write-Host "docker ps" -ForegroundColor Cyan
        Write-Host "查看容器日志:  " -NoNewline; Write-Host "docker logs jiex-app" -ForegroundColor Cyan
        Write-Host "停止容器:      " -NoNewline; Write-Host "docker stop jiex-app" -ForegroundColor Cyan
        Write-Host "启动容器:      " -NoNewline; Write-Host "docker start jiex-app" -ForegroundColor Cyan
        Write-Host "重启容器:      " -NoNewline; Write-Host "docker restart jiex-app" -ForegroundColor Cyan
        Write-Host "删除容器:      " -NoNewline; Write-Host "docker stop jiex-app; docker rm jiex-app" -ForegroundColor Cyan
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host ""

        # 询问是否打开浏览器
        $openBrowser = Read-Host "是否立即打开浏览器？(Y/N)"
        if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
            Write-Info "正在打开浏览器..."
            Start-Process "http://localhost:8080"
        }

    } else {
        Write-Error-Custom "容器未能正常启动"
        Write-Host "查看容器日志:" -ForegroundColor Yellow
        docker logs jiex-app
        Write-Host ""
        Read-Host "按回车键退出"
        exit 1
    }

} catch {
    Write-Error-Custom "容器启动失败！"
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 端口 8080 已被占用" -ForegroundColor Yellow
    Write-Host "2. Docker 资源不足" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "尝试解决方案：" -ForegroundColor Cyan
    Write-Host "1. 关闭占用 8080 端口的程序" -ForegroundColor Cyan
    Write-Host "2. 重启 Docker Desktop" -ForegroundColor Cyan
    Write-Host "3. 重启电脑" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "错误详情: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""
Read-Host "按回车键退出"
