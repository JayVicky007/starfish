drop policy if exists "Admins can read all posts" on public.posts;
drop policy if exists "Admins can read published posts" on public.posts;
create policy "Admins can read published posts"
on public.posts
for select
to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can read post category changes"
  on public.post_category_changes;
create policy "Admins can read published post category changes"
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
  and exists (
    select 1
    from public.posts
    where posts.id = post_category_changes.post_id
      and posts.status = 'published'
  )
);

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

  if post_row.status <> 'published' then
    raise exception 'Only published posts can be corrected.'
      using errcode = '42501';
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

create or replace function public.admin_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can delete posts.'
      using errcode = '42501';
  end if;

  delete from public.posts
  where posts.id = p_post_id
    and posts.status = 'published';

  if not found then
    raise exception 'Published post not found.'
      using errcode = 'P0002';
  end if;
end;
$$;
