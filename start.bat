@echo off
echo =====================================
echo  AI??????? - ????
echo =====================================
echo.
echo ???? Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [??] ??? Node.js?????: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js: OK
echo.
echo ??????...
cd /d "%~dp0site\backend"
call npm install
if %errorlevel% neq 0 (
    echo [??] ??????
    pause
    exit /b 1
)
echo ??????
echo.
echo ??????...
start http://localhost:3000
start http://localhost:3000/admin/
node server.js
pause
