alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'comment_mention',
    'comment_reply',
    'admin_post_correction',
    'post_category_correction',
    'post_mention'
  ));

create unique index if not exists notifications_post_mention_recipient_idx
  on public.notifications (recipient_id, post_id, type)
  where type = 'post_mention';

create or replace function public.notify_post_mentions()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  mentioned_profile record;
  post_text text;
begin
  if new.status <> 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.status = 'published'
    and new.body is not distinct from old.body
  then
    return new;
  end if;

  post_text := regexp_replace(new.body, '<[^>]*>', ' ', 'g');

  for mentioned_profile in
    select profiles.id, profiles.username
    from public.profiles
    where profiles.id <> new.author_id
      and profiles.username ~ '^[a-z0-9_-]{3,30}$'
      and post_text ~* (
        '(^|[^a-z0-9_-])@'
        || profiles.username
        || '([^a-z0-9_-]|$)'
      )
  loop
    insert into public.notifications (
      recipient_id,
      actor_id,
      comment_id,
      post_id,
      type
    )
    values (
      mentioned_profile.id,
      new.author_id,
      null,
      new.id,
      'post_mention'
    )
    on conflict (recipient_id, post_id, type)
      where type = 'post_mention'
      do nothing;
  end loop;

  return new;
end;
$$;

revoke all on function public.notify_post_mentions() from public, anon, authenticated;

drop trigger if exists posts_notify_mentions_after_insert on public.posts;
create trigger posts_notify_mentions_after_insert
after insert on public.posts
for each row execute function public.notify_post_mentions();

drop trigger if exists posts_notify_mentions_after_update on public.posts;
create trigger posts_notify_mentions_after_update
after update of body, status on public.posts
for each row
when (old.body is distinct from new.body or old.status is distinct from new.status)
execute function public.notify_post_mentions();
