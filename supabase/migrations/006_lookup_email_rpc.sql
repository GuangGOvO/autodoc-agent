-- 通过用户名查找邮箱的 RPC 函数
-- SECURITY DEFINER 绕过 RLS，允许未登录用户调用

create or replace function public.lookup_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email
  from public.profiles
  where username = p_username
  limit 1;

  return v_email;
end;
$$;

-- 允许任何人调用此函数（匿名用户可以查用户名对应的邮箱用于登录）
grant execute on function public.lookup_email_by_username(text) to anon;
grant execute on function public.lookup_email_by_username(text) to authenticated;
