# Tally Test Credentials

## Admin
- Token: set by `ADMIN_TOKEN` (local: `backend/.env`, live: Vercel env vars)
- URL: `/admin`
- Header: `X-Admin-Token: <ADMIN_TOKEN>`

Admin token is set in `/app/backend/.env` as `ADMIN_TOKEN`.

There is no user authentication for the public app (intentionally — user opted to skip auth for MVP).
