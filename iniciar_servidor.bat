@echo off
title Servidor AsTeRICS Grid
cd /d "%~dp0"

echo ===================================================
echo   Iniciando Servidor AsTeRICS Grid...
echo   Acceso local: http://localhost:9095/
echo ===================================================
echo.

if exist "%~dp0node_modules\webpack-dev-server\bin\webpack-dev-server.js" (
    call npm start
) else (
    echo [AVISO] La carpeta node_modules no esta instalada.
    echo Para desarrollo con webpack ejecuta primero: npm install
    echo.
    call npm start
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: El servidor se ha detenido con codigo de error %ERRORLEVEL%
)
pause
