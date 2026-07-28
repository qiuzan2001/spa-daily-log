# spa-daily-log

Lake Spa 员工工作日志系统。

## 目录结构

```
backend/     # FastAPI 后端（Python 3.12+）
work-log/    # Next.js 前端
```

## 启动

### 后端

```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload
```

### 前端

```bash
cd work-log
npm install
npm run dev
```

前端 `http://localhost:3000` 自动代理 `/api/*` 到后端 `http://localhost:8000`。

## 种子员工

| 姓名 | PIN | 角色 |
|------|-----|------|
| Linda | 1234 | therapist |
| Lisa | 1234 | therapist |
| Tina | 1234 | therapist |
| Mia | 1234 | therapist |
| Jenney | 1234 | therapist |
| Jonathan | 5678 | front_desk |
| Ellie | 0000 | owner |