@echo off
setlocal
title AureumRO - Aplicar Wiki
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
echo   AureumRO - Aplicar dados oficiais da Wiki
echo ==============================================
echo.
echo Os conflitos e itens nao encontrados nao serao aplicados.
echo.
"%NODE_EXE%" scripts\wiki-sync.js --apply
if not errorlevel 1 "%NODE_EXE%" scripts\wiki-price-history-sync.js

echo.
if errorlevel 1 (
  echo A sincronizacao terminou com erro.
) else (
  echo Sincronizacao concluida. Recarregue o dashboard.
)
echo.
pause
