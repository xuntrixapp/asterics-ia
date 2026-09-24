@echo off
title Asterics AAC Dev Server
cd /d "d:\Antigravity app\play store\Asterics\pwa mod"
echo ===================================================
echo Iniciando servidor de desarrollo Asterics AAC...
echo Accede a: http://localhost:9095/
echo ===================================================
call "C:\Users\jmigu\AppData\Roaming\npm\npm.cmd" start
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: El servidor se ha detenido con codigo de error %ERRORLEVEL%
)
pause
