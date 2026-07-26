# Licarl Prompt Maker

**The Complete AI Workspace.**

> One workspace. Every AI model. Every prompt. Every workflow. Every team.

Licarl Prompt Maker is a production-ready, enterprise-grade AI productivity platform that unifies prompt engineering, multi-provider AI chat, agents, visual workflows, marketplace, team collaboration, analytics, and enterprise administration into a single professional workspace.

## Features

- Multi-Provider AI Chat (OpenAI, Claude, Gemini, Grok, DeepSeek, Mistral, Meta, OpenRouter, Together, Groq, Cohere, Ollama, Azure + managed Licarl AI)
- Professional Prompt Builder with variables, templates, version history, Monaco editor
- Prompt Optimizer & side-by-side Tester
- Visual Workflow Builder with {{variables}}
- AI Agents with memory, tools, knowledge base
- Community Marketplace
- Teams & Organizations with RBAC
- File Manager, Analytics, Enterprise-ready security

## Tech Stack

Frontend: React + TypeScript + Vite + Tailwind + Shadcn UI + Framer Motion + TanStack Router/Query + Zustand + Monaco + Recharts
Backend: Node.js + Hono + TypeScript
Database/Auth/Storage: Supabase (PostgreSQL)

## Quick Start

```bash
git clone https://github.com/licarltheo/messaging-app.git
cd messaging-app
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
# Fill env vars, run supabase/schema.sql
pnpm --filter api dev
pnpm --filter web dev
```

Open http://localhost:5173

## Security

API keys encrypted at rest (AES-256-GCM), Supabase Auth, RBAC, rate limiting, Zod validation, audit logs.

## License

MIT © Licarl
