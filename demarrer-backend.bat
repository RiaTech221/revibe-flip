@echo off
chcp 65001 >nul
title ReVibe FliP - Backend Spring Boot (Port 8080)
cd /d "%~dp0backend"
echo ========================================================
echo    Demarrage du Backend ReVibe FliP (Profil Dev)
echo    Port : http://localhost:8080/api
echo ========================================================
echo.
call .\mvnw.cmd spring-boot:run
pause
