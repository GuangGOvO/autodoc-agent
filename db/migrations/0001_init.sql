-- AutoDoc 自托管数据库初始化
-- 说明：替代原 Supabase 迁移；幂等可重复执行（schema_migrations 记录已应用项）

create extension if not exists pgcrypto;

-- ==================== 用户表（替代 Supabase Auth + profiles） ====================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text not null unique,
  password_hash text not null,
  name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_username on users(username);
create index if not exists idx_users_email on users(email);

-- ==================== 车辆表 ====================
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  brand text not null,
  series text not null,
  year text,
  engine text,
  transmission text,
  mileage numeric default 0,
  license_plate text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_user_id on vehicles(user_id);

-- ==================== 诊断会话表 ====================
create table if not exists diagnosis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  initial_symptom text,
  status text not null default 'in_progress',
  report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_diagnosis_sessions_user_id on diagnosis_sessions(user_id);
create index if not exists idx_diagnosis_sessions_created_at on diagnosis_sessions(created_at desc);

-- ==================== 诊断消息表 ====================
create table if not exists diagnosis_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references diagnosis_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_diagnosis_messages_session_id on diagnosis_messages(session_id);
create index if not exists idx_diagnosis_messages_created_at on diagnosis_messages(created_at);

-- ==================== 二手车评估表 ====================
create table if not exists used_car_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  input jsonb not null,
  report_markdown text,
  created_at timestamptz not null default now()
);

create index if not exists idx_used_car_evaluations_user_id on used_car_evaluations(user_id);

-- ==================== 迁移记录表 ====================
create table if not exists schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
