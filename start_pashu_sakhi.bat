@echo off
setlocal
echo =======================================================
echo     Pashu Sakhi - Startup Launcher
echo =======================================================

cd /d "%~dp0"

echo [1/3] Checking dependencies...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo [2/3] Starting Backend Server...
cd backend
if not exist "node_modules\" (
    echo Installing backend dependencies...
    call npm install
)

echo Starting embedded database...
start "PashuSakhi DB" cmd /c "npm run db:start & pause"

echo Waiting for DB to initialize (10 seconds)...
timeout /t 10 /nobreak >nul

echo Starting Backend API...
start "PashuSakhi Backend API" cmd /c "npm run dev & pause"
cd ..

echo [3/3] Starting Frontend Server...
cd frontend
echo Frontend will run on http://localhost:3000
start "PashuSakhi Frontend" cmd /c "node serve.js & pause"

echo =======================================================
echo Pashu Sakhi is starting up in separate windows.
echo - Database (Port 5432)
echo - Backend API (Port 5000)
echo - Frontend (Port 3000)
echo =======================================================
echo Press any key to close this launcher...
pause >nul
