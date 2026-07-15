@echo off
setlocal
title AureumRO - Previa da Wiki
cd /d "%~dp0"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
  ) else (
    echo ERRO: Node.js nao foi encontrado neste computador.
    echo Instale a versao LTS em https://nodejs.org e tente novamente.
    echo.
    pause
    exit /b 1
  )
)

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
