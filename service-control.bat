@echo off
REM =====================================================
REM WA Bot Service Control Script
REM =====================================================

set NSSM_PATH=%~dp0nssm\nssm.exe

echo.
echo =====================================================
echo WA Bot Service Control Panel
echo =====================================================
echo.
echo [1] Start Service
echo [2] Stop Service
echo [3] Restart Service
echo [4] Check Status
echo [5] View Logs (tail)
echo [6] Open Service Settings GUI
echo [0] Exit
echo.
set /p choice="Enter your choice: "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto gui
if "%choice%"=="0" goto end

:start
echo Starting wabot service...
"%NSSM_PATH%" start wabot
sc query wabot
pause
goto end

:stop
echo Stopping wabot service...
"%NSSM_PATH%" stop wabot
sc query wabot
pause
goto end

:restart
echo Restarting wabot service...
"%NSSM_PATH%" restart wabot
timeout /t 3 /nobreak >nul
sc query wabot
pause
goto end

:status
echo Service Status:
sc query wabot
echo.
echo Process Info:
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
pause
goto end

:logs
echo Opening logs directory...
start explorer "%~dp0logs"
goto end

:gui
echo Opening NSSM GUI editor...
"%NSSM_PATH%" edit wabot
goto end

:end
