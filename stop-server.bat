@echo off
title TCG Timer - Detener servidor

echo.
echo  Deteniendo el servidor TCG Timer...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":3000 " ^| findstr /c:"LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo  Listo. Ya podes cerrar esta ventana.
timeout /t 2 /nobreak >nul