alter table public.posts
  add column if not exists category text;

update public.posts
set category = media_type
where category is null
  and media_type is not null;

comment on column public.posts.media_type is
  'Legacy category field kept in sync for upgrade compatibility; application code uses category.';

create index if not exists posts_category_idx
  on public.posts (category);

create or replace function public.sync_post_category_legacy_column()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.category := coalesce(new.category, new.media_type);
    new.media_type := coalesce(new.media_type, new.category);
  elsif new.category is distinct from old.category then
    new.media_type := new.category;
  elsif new.media_type is distinct from old.media_type then
    new.category := new.media_type;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_sync_category_legacy_column on public.posts;
create trigger posts_sync_category_legacy_column
before insert or update of category, media_type on public.posts
for each row execute function public.sync_post_category_legacy_column();

alter table public.posts enable row level security;

drop policy if exists "Admins can read all posts" on public.posts;
create policy "Admins can read all posts"
on public.posts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create table if not exists public.post_category_changes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  previous_category text,
  new_category text not null,
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  created_at timestamptz not null default now()
);

create index if not exists post_category_changes_created_at_idx
  on public.post_category_changes (created_at desc);

alter table public.post_category_changes enable row level security;
revoke all on public.post_category_changes from public, anon, authenticated;
grant select on public.post_category_changes to authenticated;

drop policy if exists "Admins can read post category changes"
  on public.post_category_changes;
create policy "Admins can read post category changes"
on public.post_category_changes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

alter table public.notifications
  alter column comment_id drop not null,
  add column if not exists message text,
  add column if not exists category_change_id uuid
    references public.post_category_changes(id) on delete cascade;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'comment_mention',
    'comment_reply',
    'admin_post_correction',
    'post_category_correction'
  ));

create unique index if not exists notifications_category_change_recipient_idx
  on public.notifications (category_change_id, recipient_id)
  where category_change_id is not null;

create or replace function public.admin_correct_post_category(
  p_post_id uuid,
  p_category text,
  p_reason text
)
returns table (
  id uuid,
  title text,
  slug text,
  status text,
  category text,
  author_id uuid,
  previous_category text,
  reason text,
  corrected_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  post_row public.posts%rowtype;
  old_category text;
  new_category text;
  change_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can correct post categories.'
      using errcode = '42501';
  end if;

  new_category := lower(btrim(p_category));
  if new_category is null
    or char_length(new_category) > 64
    or new_category !~ '^[a-z0-9][a-z0-9_-]*$'
  then
    raise exception 'Provide a valid category key.'
      using errcode = '22023';
  end if;

  if p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then
    raise exception 'Reason must be between 10 and 500 characters.'
      using errcode = '22023';
  end if;

  select *
  into post_row
  from public.posts
  where posts.id = p_post_id
  for update;

  if not found then
    raise exception 'Post not found.'
      using errcode = 'P0002';
  end if;

  old_category := post_row.category;
  if old_category is not distinct from new_category then
    raise exception 'The post already has this category.'
      using errcode = '22023';
  end if;

  update public.posts
  set category = new_category,
      updated_at = now()
  where posts.id = p_post_id
  returning * into post_row;

  insert into public.post_category_changes (
    post_id,
    actor_id,
    previous_category,
    new_category,
    reason
  )
  values (
    post_row.id,
    auth.uid(),
    old_category,
    new_category,
    btrim(p_reason)
  )
  returning post_category_changes.id into change_id;

  if post_row.author_id <> auth.uid() then
    insert into public.notifications (
      recipient_id,
      actor_id,
      comment_id,
      post_id,
      type,
      message,
      category_change_id
    )
    values (
      post_row.author_id,
      auth.uid(),
      null,
      post_row.id,
      'post_category_correction',
      btrim(p_reason),
      change_id
    )
    on conflict (category_change_id, recipient_id)
      where category_change_id is not null
      do nothing;
  end if;

  return query
  select
    post_row.id,
    post_row.title,
    post_row.slug,
    post_row.status::text,
    post_row.category,
    post_row.author_id,
    old_category,
    btrim(p_reason),
    now();
end;
$$;

revoke all on function public.admin_correct_post_category(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_correct_post_category(uuid, text, text)
  to authenticated;
