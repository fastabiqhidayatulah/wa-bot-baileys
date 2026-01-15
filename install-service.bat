@echo off
REM =====================================================
REM WA Bot Service Installation Script
REM Service Name: wabot
REM Auto-start: Yes
REM RAM Limit: 768MB
REM =====================================================

echo Installing WA Bot as Windows Service...

REM Set paths
set NSSM_PATH=%~dp0nssm\nssm.exe
set NODE_PATH=C:\Program Files\nodejs\node.exe
set BOT_PATH=%~dp0bot.js
set BOT_DIR=%~dp0

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

REM Remove existing service if exists
echo Removing old service if exists...
"%NSSM_PATH%" stop wabot >nul 2>&1
"%NSSM_PATH%" remove wabot confirm >nul 2>&1

REM Install new service
echo Installing wabot service...
"%NSSM_PATH%" install wabot "%NODE_PATH%" --max-old-space-size=768 "%BOT_PATH%"

REM Set working directory
"%NSSM_PATH%" set wabot AppDirectory "%BOT_DIR%"

REM Set display name and description
"%NSSM_PATH%" set wabot DisplayName "WA Bot Pemper"
"%NSSM_PATH%" set wabot Description "WhatsApp Bot service with Baileys - Auto restart on failure"

REM Set startup type to automatic
"%NSSM_PATH%" set wabot Start SERVICE_AUTO_START

REM Set restart options (auto-restart on failure)
"%NSSM_PATH%" set wabot AppThrottle 1500
"%NSSM_PATH%" set wabot AppExit Default Restart
"%NSSM_PATH%" set wabot AppRestartDelay 5000

REM Set stdout/stderr logging
"%NSSM_PATH%" set wabot AppStdout "%BOT_DIR%logs\service-stdout.log"
"%NSSM_PATH%" set wabot AppStderr "%BOT_DIR%logs\service-stderr.log"
"%NSSM_PATH%" set wabot AppRotateFiles 1
"%NSSM_PATH%" set wabot AppRotateOnline 1
"%NSSM_PATH%" set wabot AppRotateSeconds 86400
"%NSSM_PATH%" set wabot AppRotateBytes 10485760

REM Start the service
echo Starting wabot service...
"%NSSM_PATH%" start wabot

REM Check status
timeout /t 3 /nobreak >nul
sc query wabot

echo.
echo =====================================================
echo Service installed successfully!
echo Service Name: wabot
echo RAM Limit: 768MB (via --max-old-space-size=768)
echo Auto-start: Enabled
echo Logs: %BOT_DIR%logs\service-*.log
echo.
echo Useful commands:
echo   Start:   nssm start wabot
echo   Stop:    nssm stop wabot
echo   Restart: nssm restart wabot
echo   Status:  sc query wabot
echo   Edit:    nssm edit wabot
echo =====================================================
echo.
pause
