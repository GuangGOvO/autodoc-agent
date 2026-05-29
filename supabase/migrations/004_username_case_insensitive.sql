-- 用户名大小写不敏感唯一约束
-- 启用 citext 扩展（Case-Insensitive Text）

create extension if not exists citext;

-- 将 username 列改为 citext（大小写不敏感）
-- citext 的比较是大小写不敏感的，所以已有的 UNIQUE 约束会自动处理大小写
alter table public.profiles alter column username type citext;
