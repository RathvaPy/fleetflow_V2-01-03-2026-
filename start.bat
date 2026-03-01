@echo off
echo ============================================
echo  FleetFlow - Starting All Servers
echo ============================================
echo.

echo [1/2] Starting Express Backend (port 5000)...
start "FleetFlow Backend" cmd /k "cd /d %~dp0 && node server.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Next.js Frontend (port 3000)...
start "FleetFlow Frontend" cmd /k "cd /d %~dp0 && npx next dev"

echo.
echo Both servers are starting...
echo  - Backend:  http://localhost:5000
echo  - Frontend: http://localhost:3000
echo.
echo Close the two opened windows to stop the servers.
pause
