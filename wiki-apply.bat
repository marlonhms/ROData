@echo off
setlocal
title AureumRO - Aplicar Wiki
cd /d "%~dp0"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_EXE=C:\Users\Marlon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

echo.
echo ==============================================
echo   AureumRO - Aplicar dados oficiais da Wiki
echo ==============================================
echo.
echo Os conflitos e itens nao encontrados nao serao aplicados.
echo.
"%NODE_EXE%" scripts\wiki-sync.js --apply

echo.
if errorlevel 1 (
  echo A sincronizacao terminou com erro.
) else (
  echo Sincronizacao concluida. Recarregue o dashboard.
)
echo.
pause

