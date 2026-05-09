-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  college text,
  year text,
  github text,
  linkedin text,
  portfolio text,
  skills text[],
  projects text[],
  onboarding_completed boolean default false,
  updated_at timestamptz default now()
);

-- Create mail_history table
create table if not exists public.mail_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipient text,
  company text,
  role text,
  tone text,
  mail_type text,
  position_type text,
  word_limit integer,
  extra_context text,
  subject text,
  body text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.mail_history enable row level security;

-- Profiles Policies
create policy "Users manage own profile"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Mail History Policies
create policy "Users manage own mail history"
on public.mail_history
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create storage bucket if not exists
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Storage Policies for Resumes
create policy "Users manage own resumes"
on storage.objects
for all
to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
