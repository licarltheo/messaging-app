-- Licarl Prompt Maker - Core Schema
-- Run in Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'team', 'enterprise')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Encrypted API keys (per user / org)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  provider text not null,
  encrypted_key text not null,
  label text,
  created_at timestamptz default now()
);

-- Prompts
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  category text,
  tags text[] default '{}',
  variables jsonb default '[]',
  is_favorite boolean default false,
  is_archived boolean default false,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prompt versions
create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.prompts(id) on delete cascade,
  content text not null,
  version integer not null,
  created_at timestamptz default now()
);

-- Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  model text,
  provider text,
  folder text,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens integer,
  created_at timestamptz default now()
);

-- Workflows
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  definition jsonb not null default '{}',
  is_template boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agents
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  system_prompt text,
  model text,
  temperature real default 0.7,
  personality text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Organizations / Teams
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz default now()
);

create table if not exists public.organization_members (
  org_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'editor', 'viewer')) default 'viewer',
  primary key (org_id, user_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.prompts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.workflows enable row level security;
alter table public.agents enable row level security;

-- Basic RLS policies (users own their data)
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users manage own api_keys" on public.api_keys for all using (auth.uid() = user_id);
create policy "Users manage own prompts" on public.prompts for all using (auth.uid() = user_id);
create policy "Users manage own conversations" on public.conversations for all using (auth.uid() = user_id);
create policy "Users manage own workflows" on public.workflows for all using (auth.uid() = user_id);
create policy "Users manage own agents" on public.agents for all using (auth.uid() = user_id);
