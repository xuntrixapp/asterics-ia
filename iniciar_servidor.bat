@echo off
title Asterics AAC Dev Server
cd /d "%~dp0"
echo ===================================================
echo Iniciando servidor de desarrollo Asterics AAC...
echo Accede a: http://localhost:9095/
echo ===================================================
call npm start
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: El servidor se ha detenido con codigo de error %ERRORLEVEL%
)
pause

