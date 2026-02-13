@echo off
title Asthma-Flow Dev Server
echo ========================================
echo   Asthma-Flow - Starting Dev Server...
echo ========================================
echo.
cd /d "%~dp0"
npm run dev
pause
