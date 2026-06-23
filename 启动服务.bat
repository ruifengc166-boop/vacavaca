@echo off
cd /d "%~dp0site\backend"
echo Installing dependencies...
call npm install
echo Starting server...
start http://localhost:3000
node server.js
pause
