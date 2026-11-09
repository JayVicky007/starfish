create extension if not exists pgtap with schema extensions;

begin;

select plan(22);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'owner-one@example.test',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"username":"Owner_One","display_name":"Owner One"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'owner-two@example.test',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"username":"owner_two","display_name":"Owner Two"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'admin@example.test',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"username":"site_admin","display_name":"Site Admin"}',
    now(),
    now()
  );

update public.profiles
set role = 'admin'
where id = '10000000-0000-0000-0000-000000000003';

insert into public.posts (id, author_id, title, slug, body, status, content_type, category)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Owner one draft',
    'owner-one-draft-test',
    '<p>Draft content</p>',
    'draft',
    'article',
    'general'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Owner two draft',
    'owner-two-draft-test',
    '<p>Private draft content</p>',
    'draft',
    'article',
    'general'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Public post',
    'owner-two-published-test',
    '<p>Published content</p>',
    'published',
    'article',
    'general'
  );

insert into public.post_category_changes (
  id,
  post_id,
  actor_id,
  previous_category,
  new_category,
  reason
)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000003',
  'general',
  'design',
  'Seed audit entry for access tests'
);

select is(
  (select username from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'owner_one',
  'signup creates a profile and canonicalizes its username'
);

select is(
  (select role from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'user',
  'signup assigns the standard user role'
);

select throws_ok(
  $$
    insert into auth.users (
      id, aud, role, email, encrypted_password, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at
    )
    values (
      '10000000-0000-0000-0000-000000000004',
      'authenticated',
      'authenticated',
      'duplicate-username@example.test',
      '',
      '{"provider":"email","providers":["email"]}',
      '{"username":"OWNER_ONE"}',
      now(),
      now()
    )
  $$,
  '23505',
  null,
  'case-insensitive duplicate usernames are rejected at signup'
);

select throws_ok(
  $$
    update public.profiles
    set username = 'changed_name'
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  '22023',
  'Usernames cannot be changed after account creation.',
  'username changes are rejected by the database'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$
    update public.profiles
    set display_name = 'Owner One Updated',
        bio = 'Updated profile bio',
        avatar_url = 'https://example.test/owner-one-avatar.png',
        cover_image_url = 'https://example.test/owner-one-cover.png'
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  'an owner can update editable profile and image fields'
);

select is(
  (
    select jsonb_build_object(
      'display_name', display_name,
      'bio', bio,
      'avatar_url', avatar_url,
      'cover_image_url', cover_image_url
    )
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  jsonb_build_object(
    'display_name', 'Owner One Updated',
    'bio', 'Updated profile bio',
    'avatar_url', 'https://example.test/owner-one-avatar.png',
    'cover_image_url', 'https://example.test/owner-one-cover.png'
  ),
  'the owner profile changes persist'
);

select is(
  (select count(*)::integer from public.posts where id = '20000000-0000-0000-0000-000000000001'),
  1,
  'an owner can read their own draft'
);

select lives_ok(
  $$
    update public.posts
    set title = 'Owner one draft updated'
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  'an owner can update their own draft'
);

select is(
  (select title from public.posts where id = '20000000-0000-0000-0000-000000000001'),
  'Owner one draft updated',
  'an owner update persists'
);

select is(
  (select count(*)::integer from public.posts where id = '20000000-0000-0000-0000-000000000002'),
  0,
  'an owner cannot read another account’s draft'
);

select is(
  (select count(*)::integer from public.post_category_changes),
  0,
  'a regular user cannot read the admin category audit history'
);

select lives_ok(
  $$
    update public.posts
    set title = 'Unauthorized edit'
    where id = '20000000-0000-0000-0000-000000000002'
  $$,
  'an owner cannot update another account’s draft'
);

reset role;

select is(
  (select title from public.posts where id = '20000000-0000-0000-0000-000000000002'),
  'Owner two draft',
  'a cross-account update leaves the draft unchanged'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$
    update public.profiles
    set role = 'admin'
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'a regular user cannot promote their profile to admin'
);

select throws_ok(
  $$
    select * from public.admin_correct_post_category(
      '20000000-0000-0000-0000-000000000001',
      'design',
      'A sufficiently detailed test correction reason'
    )
  $$,
  '42501',
  'Only admins can correct post categories.',
  'a regular user cannot execute the admin correction'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select count(*)::integer from public.posts),
  1,
  'anonymous clients can read published posts but not drafts'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select is(
  (select count(*)::integer from public.posts where status = 'draft'),
  2,
  'an admin can read drafts owned by other accounts'
);

select is(
  (select count(*)::integer from public.post_category_changes),
  1,
  'an admin can read the category audit history'
);

select lives_ok(
  $$
    select * from public.admin_correct_post_category(
      '20000000-0000-0000-0000-000000000001',
      'design',
      'An admin verified this post category should change'
    )
  $$,
  'an admin can correct a post category'
);

reset role;

select is(
  (select category from public.posts where id = '20000000-0000-0000-0000-000000000001'),
  'design',
  'the admin correction updates the post category'
);

select is(
  (select count(*)::integer from public.post_category_changes where post_id = '20000000-0000-0000-0000-000000000001'),
  1,
  'the admin correction records an audit event'
);

select is(
  (
    select count(*)::integer
    from public.notifications
    where recipient_id = '10000000-0000-0000-0000-000000000001'
      and post_id = '20000000-0000-0000-0000-000000000001'
      and type = 'post_category_correction'
  ),
  1,
  'the admin correction notifies the post author'
);

select * from finish();
rollback;
