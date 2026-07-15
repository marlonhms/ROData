@echo off
setlocal
title AureumRO - Previa da Wiki
cd /d "%~dp0"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_EXE=C:\Users\Marlon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

echo.
echo ==============================================
echo   AureumRO - Verificar alteracoes da Wiki
echo ==============================================
echo.
"%NODE_EXE%" scripts\wiki-sync.js

echo.
if errorlevel 1 (
  echo A verificacao terminou com erro.
) else (
  echo Previa concluida. Consulte wiki-sync-report.json.
)
echo.
pause

