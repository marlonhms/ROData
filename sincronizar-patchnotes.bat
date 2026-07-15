@echo off
setlocal
title AureumRO - Sincronizar Patch Notes
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

echo Buscando as mudancas recentes da Wiki AureumRO...
"%NODE_EXE%" scripts\wiki-patchnotes-sync.js
echo.
if errorlevel 1 (
  echo Nao foi possivel concluir a sincronizacao.
) else (
  echo Pronto. O painel de Patch Notes foi atualizado.
)
echo.
pause
