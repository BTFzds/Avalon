@echo off
start "avalon-api" cmd /k "cd /d %~dp0backend && .venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
start "avalon-web" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0 --port 5173"
echo Started API :8000 and Web :5173
