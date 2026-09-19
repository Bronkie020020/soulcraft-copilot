@echo off
title Soulcraft Studio Suite (v8.0)
cd /d "%~dp0"

echo =======================================================
echo    SOULCRAFT STUDIO SUITE (v8.0) // AARDBEVING
echo =======================================================
echo.
echo Starting Fastify Backend & React Studio...
echo Opening http://localhost:3000 in your browser...
echo.

start "" http://localhost:3000

node dist/server/index.js
pause
