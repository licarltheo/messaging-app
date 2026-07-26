# Licarl Prompt Maker

**The Complete AI Workspace.**

> One workspace. Every AI model. Every prompt. Every workflow. Every team.

Licarl Prompt Maker is a production-ready, enterprise-grade AI productivity platform that unifies prompt engineering, multi-provider AI chat, agents, visual workflows, marketplace, team collaboration, analytics, and enterprise administration into a single professional workspace.

## Features

- **Multi-Provider AI Chat** — OpenAI, Claude, Gemini, Grok, DeepSeek, Mistral, Meta, OpenRouter, Together, Groq, Cohere, Ollama, Azure + managed Licarl AI
- **Professional Prompt Builder** — Variables, templates, version history, Monaco editor
- **Prompt Optimizer & Tester** — Side-by-side comparison across models
- **Visual Workflow Builder** — Multi-step AI pipelines with `{{variables}}`
- **AI Agents** — System prompts, memory, knowledge base, tools
- **Community Marketplace** — Publish, install, rate, review
- **Teams & Organizations** — RBAC (Owner / Admin / Editor / Viewer)
- **File Manager, Analytics, Enterprise Security**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind, Shadcn UI, Framer Motion, TanStack Router/Query, Zustand, Monaco, Recharts |
| Backend | Node.js, Hono, TypeScript |
| Database / Auth / Storage | Supabase (PostgreSQL) |

## Quick Start

```bash
git clone https://github.com/licarltheo/messaging-app.git
cd messaging-app
pnpm install

cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
# Fill in Supabase credentials

# Run schema in Supabase SQL Editor (see supabase/schema.sql)

pnpm --filter api dev   # http://localhost:8787
pnpm --filter web dev   # http://localhost:5173
```

## Project Structure

```
apps/
  web/     # React frontend
  api/     # Hono backend
packages/
  shared/  # Shared types
supabase/
  schema.sql
```

## Security

- API keys encrypted at rest (AES-256-GCM)
- Supabase Auth + JWT
- Role-based access control
- Rate limiting, input validation (Zod), audit logs

## License

MIT © Licarl
