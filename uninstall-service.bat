@echo off
REM =====================================================
REM WA Bot Service Uninstallation Script
REM =====================================================

echo Uninstalling WA Bot Service...

REM Set paths
set NSSM_PATH=%~dp0nssm\nssm.exe

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

REM Stop and remove service
echo Stopping wabot service...
"%NSSM_PATH%" stop wabot

timeout /t 2 /nobreak >nul

echo Removing wabot service...
"%NSSM_PATH%" remove wabot confirm

echo.
echo =====================================================
echo Service uninstalled successfully!
echo =====================================================
echo.
pause
