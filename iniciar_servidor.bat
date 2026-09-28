@echo off
title Servidor AsTeRICS Grid PWA
cd /d "%~dp0"

echo =======================================================
echo   Iniciando Servidor AsTeRICS Grid PWA...
echo   URL: http://localhost:9095/
echo =======================================================
echo.

:: 1. Liberar puerto 9095 si AsTeRICS_Grid.exe o un proceso previo sigue activo
taskkill /F /IM "AsTeRICS_Grid.exe" >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":9095" ^| findstr "LISTENING"') do (
    if "%%a" neq "0" if "%%a" neq "4" (
        taskkill /F /PID %%a >nul 2>nul
    )
)

:: 2. Si existen node_modules, iniciar webpack-dev-server
if exist "%~dp0node_modules\webpack-dev-server\bin\webpack-dev-server.js" (
    echo [MODO] Servidor de desarrollo con Webpack...
    call "%~dp0node_modules\.bin\webpack-dev-server.cmd" --config webpack.config.js
    goto :FIN
)

:: 3. Si no hay node_modules (ej. paquete PWA compilado / GitHub), usar servidor nativo ligero de Node.js
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    if exist "%~dp0server.js" (
        echo [MODO] Servidor estatico nativo Node.js...
        start "" http://localhost:9095/
        node server.js
        goto :FIN
    )
)

:: 4. Fallback si no hay Node.js
echo [AVISO] Abriendo index.html directamente en el navegador...
start "" index.html

:FIN
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: El servidor se ha detenido con codigo de error %ERRORLEVEL%
)
pause
