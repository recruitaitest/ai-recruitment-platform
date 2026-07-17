@echo off
echo Starting AI Resume Management Platform...

echo Starting MinIO (Storage)...
start "MinIO Storage Server" cmd /k "cd Backend && .\minio.exe server .\data --console-address ":9001""

echo Starting Redis (Message Broker)...
start "Redis Server" cmd /k ".\Redis\redis-server.exe"

echo Starting Celery (Background Worker)...
start "Celery Worker" cmd /k "cd Backend && call venv\Scripts\activate && celery -A app.celery_app worker --pool=solo -l info"

echo Starting FastAPI (Backend Server)...
start "FastAPI Backend" cmd /k "cd Backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

echo Starting Next.js (Frontend UI)...
start "Next.js Frontend" cmd /k "cd Frontend && npm run dev"

echo All services started in separate windows! You can minimize them, but leave them open while working.
pause
