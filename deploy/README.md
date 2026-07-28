# Licarl Prompt Maker — Production Deploy

## Live URLs

- **Backend API**: https://licarl-api.vercel.app
- **Frontend**: https://licarl.vercel.app

## API (live now)

- `GET /api/health`
- `GET /api/v1/providers` — 12 providers
- `POST /api/v1/chat/completions` — streaming SSE
- Keys, agents, workflows, files, orgs, marketplace, analytics — all live

## Demo login

Any email/password works (demo mode).
Suggested: `demo@licarl.app` / `demo`

## Deploy this folder as Vercel root

1. Vercel project `licarl` → Root Directory = `deploy`
2. Framework: Vite | Build: `npm run build` | Output: `dist`
3. Optional env: `VITE_API_URL=https://licarl-api.vercel.app`
