@echo off
cd /d "%~dp0"

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo  Photo-Wall dev server
echo  Open http://localhost:3000 in your browser
echo.
call npm run dev

pause
