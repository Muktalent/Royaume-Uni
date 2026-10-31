-- Replace ONLY the email below with the existing owner's login.
-- Do not choose an employee's email. Run in Supabase SQL Editor.
do $$
declare owner_email text := 'REPLACE_WITH_YOUR_LOGIN_EMAIL'; owner_id uuid;
begin
 if owner_email='REPLACE_WITH_YOUR_LOGIN_EMAIL' then raise exception 'Replace the email before running this script.'; end if;
 select id into strict owner_id from auth.users where lower(email)=lower(owner_email);
 insert into public.mt_personal_owner(singleton,user_id) values(true,owner_id);
end $$;
select user_id from public.mt_personal_owner;
