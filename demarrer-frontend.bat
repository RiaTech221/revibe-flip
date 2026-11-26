@echo off
chcp 65001 >nul
title ReVibe FliP - Frontend Vite (Port 5173)
cd /d "%~dp0frontend"
echo ========================================================
echo    Demarrage du Frontend ReVibe FliP
echo    URL : http://localhost:5173
echo ========================================================
echo.
call npm.cmd run dev
pause
