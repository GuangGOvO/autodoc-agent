-- 用户角色：admin（管理后台）/ user（普通用户）
-- 管理员身份通过 ADMIN_EMAILS 环境变量在注册时授予

alter table users add column if not exists role text not null default 'user';

create index if not exists idx_users_role on users(role);
