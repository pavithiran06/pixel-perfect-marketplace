
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'customer');
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  if requested_role in ('customer', 'worker') then
    insert into public.user_roles (user_id, role) values (new.id, requested_role::public.app_role);
  else
    insert into public.user_roles (user_id, role) values (new.id, 'customer');
  end if;
  return new;
end;
$$;
