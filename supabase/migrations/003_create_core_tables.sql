-- 核心业务表

-- 车辆表
create table if not exists public.vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  brand text not null,
  series text not null,
  year text,
  engine text,
  transmission text,
  mileage numeric default 0,
  license_plate text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 诊断会话表
create table if not exists public.diagnosis_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  initial_symptom text,
  status text default 'in_progress',
  report jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 诊断消息表
create table if not exists public.diagnosis_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.diagnosis_sessions on delete cascade not null,
  role text not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- 二手车评估表
create table if not exists public.used_car_evaluations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  input jsonb not null,
  report_markdown text,
  created_at timestamptz default now()
);

-- 索引
create index if not exists idx_vehicles_user_id on public.vehicles(user_id);
create index if not exists idx_diagnosis_sessions_user_id on public.diagnosis_sessions(user_id);
create index if not exists idx_diagnosis_sessions_created_at on public.diagnosis_sessions(created_at desc);
create index if not exists idx_diagnosis_messages_session_id on public.diagnosis_messages(session_id);
create index if not exists idx_diagnosis_messages_created_at on public.diagnosis_messages(created_at);
create index if not exists idx_used_car_evaluations_user_id on public.used_car_evaluations(user_id);

-- 启用 RLS
alter table public.vehicles enable row level security;
alter table public.diagnosis_sessions enable row level security;
alter table public.diagnosis_messages enable row level security;
alter table public.used_car_evaluations enable row level security;

-- RLS 策略：用户只能访问自己的数据
drop policy if exists "Users can manage own vehicles" on public.vehicles;
create policy "Users can manage own vehicles" on public.vehicles
  for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own sessions" on public.diagnosis_sessions;
create policy "Users can manage own sessions" on public.diagnosis_sessions
  for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own messages" on public.diagnosis_messages;
create policy "Users can manage own messages" on public.diagnosis_messages
  for all using (
    exists (
      select 1 from public.diagnosis_sessions
      where id = session_id and user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage own evaluations" on public.used_car_evaluations;
create policy "Users can manage own evaluations" on public.used_car_evaluations
  for all using (auth.uid() = user_id);
