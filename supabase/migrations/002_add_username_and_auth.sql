-- 用户认证与账户系统
-- 创建 profiles 表并添加 username 字段

-- 创建 profiles 表（如果不存在）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  name text,
  email text,
  avatar_url text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 如果表已存在，添加缺失的列
alter table public.profiles add column if not exists username text unique;
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;

-- 创建索引以加速用户名查询
create index if not exists idx_profiles_username on public.profiles(username);

-- 自动创建 profile 的触发器（当新用户注册时）
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'username',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 删除旧触发器（如果存在）
drop trigger if exists on_auth_user_created on auth.users;

-- 创建触发器
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 启用 RLS
alter table public.profiles enable row level security;

-- 确保 RLS 策略存在
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Anyone can check username availability" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 允许检查用户名是否可用（只读 username 字段）
create policy "Anyone can check username availability" on public.profiles
  for select using (true);
