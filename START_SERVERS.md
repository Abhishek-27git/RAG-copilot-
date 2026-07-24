# DD Copilot — How to Start the Project

## Run this ONE command (does everything)

```powershell
PowerShell -ExecutionPolicy Bypass -File C:\Users\Admin\OneDrive\Desktop\RAG\START_SERVERS.ps1
```

This script will automatically:
- Install Redis inside WSL (if not installed)
- Create Python `.venv` (if missing)
- Install all Python packages from `requirements.txt`
- Install Node.js packages via `npm install` (if `node_modules` missing)
- Run database migrations (`alembic upgrade head`)
- Open 4 separate terminals with each server running

---

## What Runs in Each Terminal

| # | Service | URL | Started by |
|---|---------|-----|------------|
| 1 | Redis (Task Queue) | `localhost:6379` | WSL |
| 2 | FastAPI Backend | `http://localhost:8000` | uvicorn |
| 3 | Celery Worker | background only | celery |
| 4 | Next.js Frontend | `http://localhost:3000` | npm run dev |

> PostgreSQL starts automatically as a **Windows Service** — no terminal needed.
> Check: Win + R → `services.msc` → look for `postgresql-x64-XX` → Status = Running

---

## ENV Variables — What Is Set vs. What You May Need to Change

### `backend/.env` — Current Status

| Variable | Status | Notes |
|----------|--------|-------|
| `DATABASE_URL` | ✅ Set | Points to local PostgreSQL on port 5432 |
| `JWT_SECRET_KEY` | ✅ Set | OK for development. **Change for production** |
| `JWT_ALGORITHM` | ✅ Set | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ Set | 15 minutes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | ✅ Set | 7 days |
| `BACKEND_CORS_ORIGINS` | ✅ Set | `http://localhost:3000` |
| `COOKIE_SECURE` | ✅ Set | `False` for dev, set `True` in production |
| `COOKIE_SAMESITE` | ✅ Set | `lax` |
| `CELERY_BROKER_URL` | ✅ Set | `redis://localhost:6379/0` |
| `CELERY_RESULT_BACKEND` | ✅ Set | `redis://localhost:6379/0` |
| `OPENAI_API_KEY` | ✅ Set | Your OpenAI key — replace if expired |
| `STORAGE_PATH` | ✅ Set | `./storage` (local folder) |
| `CHROMA_PATH` | ✅ Set | `./storage/chroma` (local vector DB) |

### `frontend/.env` — Current Status

| Variable | Status | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_API_URL` | ✅ Set | `http://localhost:8000` |

### ⚠️ Variables You May Need to Update

| Variable | File | Why |
|----------|------|-----|
| `OPENAI_API_KEY` | `backend/.env` | Replace if your key expires or hits quota |
| `DATABASE_URL` | `backend/.env` | Change password/host if PostgreSQL is on a different machine |
| `JWT_SECRET_KEY` | `backend/.env` | Must change to a random 64+ char string before going live |
| `COOKIE_SECURE` | `backend/.env` | Set to `True` when deploying to HTTPS |
| `NEXT_PUBLIC_API_URL` | `frontend/.env` | Change to your server IP if deploying remotely |

---

## If Something Goes Wrong

| Error | Fix |
|-------|-----|
| `redis.exceptions.ConnectionError` | Redis not running — check Terminal 1 (WSL) |
| `Failed to fetch` on login | PostgreSQL not running — check `services.msc` |
| `ECONNREFUSED` on frontend | Backend not started — check Terminal 2 |
| Document stuck at "pending" | Celery not running — check Terminal 3 |
| `cannot import name mapped_column` | Wrong Python — script always uses `.venv\Scripts\python.exe` |
| `wsl: command not found` | Enable WSL: `wsl --install` then restart PC |
