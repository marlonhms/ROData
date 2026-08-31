@echo off
setlocal
chcp 65001 >nul
title AureumRO - Sincronizacao Completa em Fila
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

"%NODE_EXE%" scripts\sync-all.js %*
if errorlevel 1 (
  echo.
  echo [AVISO] A sincronizacao terminou com algum erro acima.
)
echo.
pause
