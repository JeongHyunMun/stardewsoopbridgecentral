@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist .env (
  echo [ERROR] .env file not found.
  echo Copy .env.example to .env and configure the secrets first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo [INFO] Installing dependencies for the first run...
  call npm.cmd install
  if errorlevel 1 (
    echo [ERROR] npm install failed. Check Node.js and network connectivity.
    pause
    exit /b 1
  )
)
call npm.cmd start
pause
