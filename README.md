# Tally

Every store, one total. Tally compares a product's price across stores in several countries, adds delivery, and sorts the offers so the cheapest real total comes first.

## Stack

- **Frontend:** React (CRA + CRACO), Tailwind, shadcn/ui — `frontend/`
- **API:** FastAPI + MongoDB (Motor) — `backend/server.py`
- **Hosting:** Vercel. The React build is served statically; `api/index.py` runs the FastAPI app as a Python function under `/api`.

## Run locally

```bash
# API (needs MongoDB on localhost:27017)
cd backend
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
cp .env.example .env   # then set ADMIN_TOKEN
./venv/bin/uvicorn server:app --port 8000 --reload

# Frontend
cd frontend
npm install --legacy-peer-deps
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
npm start
```

Sample stores and products are seeded automatically on the first API request when the database is empty.

## Environment variables (Vercel)

| Name | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection string (e.g. MongoDB Atlas) |
| `DB_NAME` | Database name, e.g. `tally` |
| `ADMIN_TOKEN` | Long random string; required to use `/admin` |
| `CORS_ORIGINS` | Optional, defaults to `*` |
