@echo off
setlocal
title AureumRO - Sincronizar Imagens de Almas da Wiki
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
echo   AureumRO - Extrair Imagens de Almas da Wiki
echo ==============================================
echo.
"%NODE_EXE%" scripts\fetch-soul-sprites.js

echo.
if errorlevel 1 (
  echo A extracao terminou com erro.
) else (
  echo Imagens de almas atualizadas com sucesso!
)
echo.
pause
