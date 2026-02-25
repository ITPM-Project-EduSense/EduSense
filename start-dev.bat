@echo off
REM EduSense Development Server Startup Script

echo Starting EduSense Development Environment...
echo.

REM Get the root directory
set ROOT_DIR=%~dp0

REM Start Backend
echo [1/3] Starting Backend Server (FastAPI on port 8000)...
cd %ROOT_DIR%backend
start cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start Frontend
echo [2/3] Starting Frontend Server (Next.js on port 3000)...
cd %ROOT_DIR%frontend
start cmd /k "npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak

REM Open browser to localhost:3000
echo [3/3] Opening localhost:3000 in default browser...
start http://localhost:3000

echo.
echo EduSense is running!
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo.
echo Close these windows to stop the servers.
pause
