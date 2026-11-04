do $$
begin
  if exists (
    select 1
    from public.profiles
    where username is not null
    group by lower(btrim(username))
    having count(*) > 1
  ) then
    raise exception
      'Cannot enforce unique usernames: existing profiles contain usernames that differ only by letter case. Resolve those duplicates, then rerun this migration.';
  end if;
end;
$$;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(btrim(username)))
  where username is not null;

create or replace function public.enforce_profile_username_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if new.username is distinct from old.username then
      raise exception 'Usernames cannot be changed after account creation.'
        using errcode = '22023';
    end if;

    return new;
  end if;

  new.username := lower(btrim(new.username));

  if new.username is null
    or char_length(new.username) not between 3 and 30
    or new.username !~ '^[a-z0-9][a-z0-9_-]*$'
  then
    raise exception
      'Username must be 3 to 30 characters and start with a letter or number; only lowercase letters, numbers, underscores, and dashes are allowed.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_username_identity on public.profiles;
create trigger profiles_enforce_username_identity
before insert or update of username on public.profiles
for each row execute function public.enforce_profile_username_identity();

revoke update on table public.profiles from public, anon, authenticated;
revoke update (username) on table public.profiles from authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_username text;
  email_username text;
begin
  new_username := lower(btrim(new.raw_user_meta_data ->> 'username'));

  if new_username is null or new_username = '' then
    email_username := lower(
      regexp_replace(
        split_part(coalesce(new.email, ''), '@', 1),
        '[^a-z0-9_-]+',
        '_',
        'g'
      )
    );
    email_username := regexp_replace(email_username, '^[^a-z0-9]+', '');
    email_username := left(email_username, 30);

    if char_length(email_username) between 3 and 30
      and not exists (
        select 1
        from public.profiles
        where lower(btrim(profiles.username)) = email_username
      )
    then
      new_username := email_username;
    else
      new_username := 'user_' || left(replace(new.id::text, '-', ''), 25);
    end if;
  end if;

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    new_username,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
