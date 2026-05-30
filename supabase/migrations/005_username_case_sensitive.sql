-- 用户名恢复大小写敏感
-- 将 citext 改回 text，使数据库严格区分大小写

alter table public.profiles alter column username type text;

-- 注意：citext 扩展不删除，因为可能有其他表使用
