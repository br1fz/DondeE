@echo off
chcp 65001 >nul
echo ========================================================
echo   Iniciando Plataforma DondeE (Full-Stack)
echo ========================================================

echo [1/2] Iniciando Backend en puerto 3001...
start "DondeE - Backend (API :3001)" cmd /k "cd /d "%~dp0DondeE - BE" && npm run dev"

echo [2/2] Iniciando Frontend en puerto 5173...
start "DondeE - Frontend (Vite :5173)" cmd /k "cd /d "%~dp0DondeE - FE" && npm run dev"

echo.
echo Esperando inicialización de servicios...
timeout /t 4 /nobreak >nul

echo Abriendo navegador en http://localhost:5173 ...
start http://localhost:5173

echo ========================================================
echo   ¡DondeE se está ejecutando!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001
echo ========================================================
