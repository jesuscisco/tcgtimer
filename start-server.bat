@echo off
title TCG Timer - Servidor
cd /d "%~dp0"
netsh advfirewall firewall add rule name="TCG Timer" dir=in action=allow protocol=TCP localport=3000 >nul 2>nul

echo.
echo  =============================================
echo   TCG TIMER - Servidor de la tienda
echo  =============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] No se encontro Node.js.
    echo  Descargalo desde https://nodejs.org, instalalo
    echo  y volve a hacer doble clic en este archivo.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  Instalando componentes por primera vez. Esto tarda unos minutos.
    call npm install
    if errorlevel 1 (
        echo  [ERROR] No se pudo instalar. Revisa que haya internet.
        pause
        exit /b 1
    )
)

echo.
echo  --------------------------------------------------------------------
echo  IMPORTANTE: deja esta ventana abierta mientras este el torneo.
echo.
echo  La TELE tiene que entrar a esta direccion:
echo.

set "LANIP="
for /f "delims=" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get-lan-ip.ps1"') do set "LANIP=%%i"

if defined LANIP (
    echo   [ http://%LANIP%:3000/display ]
) else (
    echo   La IP no se detecto sola. Proba alguna de estas:
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do echo   * http://%%a:3000/display
)
echo.
echo  En unos segundos se abre el Panel de Control solo.
echo  Para apagar: doble clic en stop-server.bat o cerrar esta ventana.
echo  --------------------------------------------------------------------
echo.

start "" /b powershell -NoProfile -Command "$i=0; $ok=$false; while ($i -lt 60 -and -not $ok) { Start-Sleep 1; $i++; $ok=Test-NetConnection 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue }; if ($ok) { Start-Process 'http://localhost:3000/admin' }"

call npm run start

echo.
echo  [ERROR] El servidor se detuvo. Doble clic en
echo  stop-server.bat y luego abri este archivo de nuevo.
pause