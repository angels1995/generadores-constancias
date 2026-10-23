@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0desplegar.ps1" %*
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo El despliegue se detuvo. Revisa el motivo indicado arriba.
pause
exit /b %RESULT%
