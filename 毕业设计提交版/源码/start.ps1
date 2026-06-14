$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  机场航班可视化查询系统 - 一键启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "[1/4] 检查依赖..." -ForegroundColor Yellow

if (-Not (Test-Path "node_modules")) {
    Write-Host "  未检测到依赖，正在安装前端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "前端依赖安装失败！" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "  前端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  前端依赖已存在" -ForegroundColor Green
}

if (-Not (Test-Path "server\node_modules")) {
    Write-Host "  正在安装后端依赖..." -ForegroundColor Yellow
    Set-Location server
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "后端依赖安装失败！" -ForegroundColor Red
        pause
        exit 1
    }
    Set-Location ..
    Write-Host "  后端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  后端依赖已存在" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/4] 启动后端服务 (端口 3001)..." -ForegroundColor Yellow

$backendJob = Start-Process -FilePath "node" -ArgumentList "server\mcp-proxy.js" -WorkingDirectory $scriptDir -NoNewWindow -PassThru
Write-Host "  后端进程已启动 (PID: $($backendJob.Id))" -ForegroundColor Green

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[3/4] 启动前端服务 (端口 5173)..." -ForegroundColor Yellow

$frontendJob = Start-Process -FilePath "npx" -ArgumentList "vite" -WorkingDirectory $scriptDir -NoNewWindow -PassThru
Write-Host "  前端进程已启动 (PID: $($frontendJob.Id))" -ForegroundColor Green

Wait-Process -Id $frontendJob.Id -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  前端地址: http://localhost:5173" -ForegroundColor White
Write-Host "  后端地址: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "  按 Ctrl+C 或关闭此窗口停止服务" -ForegroundColor Yellow
Write-Host ""

Start-Process "http://localhost:5173"

pause
