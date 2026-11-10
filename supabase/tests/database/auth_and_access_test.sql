create extension if not exists pgtap with schema extensions;

begin;

select plan(62);

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

insert into public.post_category_changes (
  id,
  post_id,
  actor_id,
  previous_category,
  new_category,
  reason
)
values (
  '30000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  'general',
  'design',
  'Seed audit entry for a draft'
);

insert into public.comments (id, post_id, author_id, body)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'A public comment by owner two'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'An editable comment by owner one'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'A comment on a private draft'
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
  (select count(*)::integer from public.profiles where id = '10000000-0000-0000-0000-000000000002'),
  1,
  'an authenticated user can read another public profile'
);

select lives_ok(
  $$
    update public.profiles
    set display_name = 'Unauthorized profile edit'
    where id = '10000000-0000-0000-0000-000000000002'
  $$,
  'an authenticated user cannot update another profile'
);

reset role;

select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000002'),
  'Owner Two',
  'a cross-account profile update leaves the profile unchanged'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

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

select lives_ok(
  $$
    insert into public.comments (post_id, author_id, body)
    values (
      '20000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000001',
      'A new comment on a published post'
    )
  $$,
  'an authenticated user can comment on a published post'
);

select throws_ok(
  $$
    insert into public.comments (post_id, author_id, body)
    values (
      '20000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      'A comment on another account’s draft'
    )
  $$,
  '42501',
  null,
  'a user cannot comment on a private draft'
);

select lives_ok(
  $$
    update public.comments
    set body = 'Owner one edited their comment'
    where id = '40000000-0000-0000-0000-000000000002'
  $$,
  'a user can edit their own comment'
);

select lives_ok(
  $$
    update public.comments
    set body = 'Unauthorized comment edit'
    where id = '40000000-0000-0000-0000-000000000001'
  $$,
  'a user cannot edit another user’s comment'
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values (
      'avatars',
      '10000000-0000-0000-0000-000000000001/owner-one-test.png',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  'a user can upload an avatar into their own folder'
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values (
      'profile-covers',
      '10000000-0000-0000-0000-000000000001/owner-one-test.png',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  'a user can upload a profile cover into their own folder'
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values (
      'post-images',
      '10000000-0000-0000-0000-000000000001/owner-one-test.png',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  'a user can upload a post image into their own folder'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values (
      'avatars',
      '10000000-0000-0000-0000-000000000002/owner-two-test.png',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null,
  'a user cannot upload an avatar into another user’s folder'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values (
      'profile-covers',
      '10000000-0000-0000-0000-000000000002/owner-two-test.png',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null,
  'a user cannot upload a profile cover into another user’s folder'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner, owner_id)
    values (
      'post-images',
      '10000000-0000-0000-0000-000000000002/owner-two-test.png',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null,
  'a user cannot upload a post image into another user’s folder'
);

reset role;

select is(
  (select body from public.comments where id = '40000000-0000-0000-0000-000000000002'),
  'Owner one edited their comment',
  'the owner comment edit persists'
);

select is(
  (select body from public.comments where id = '40000000-0000-0000-0000-000000000001'),
  'A public comment by owner two',
  'a cross-account comment edit leaves the comment unchanged'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'avatars' and name = '10000000-0000-0000-0000-000000000001/owner-one-test.png'),
  1,
  'the uploaded avatar object is stored'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'profile-covers' and name = '10000000-0000-0000-0000-000000000001/owner-one-test.png'),
  1,
  'the uploaded profile cover object is stored'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'post-images' and name = '10000000-0000-0000-0000-000000000001/owner-one-test.png'),
  1,
  'the uploaded post image object is stored'
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

select is(
  (select count(*)::integer from public.profiles),
  3,
  'anonymous clients can read public profiles'
);

select is(
  (select count(*)::integer from public.comments),
  3,
  'anonymous clients can read comments on published posts'
);

select is(
  (select count(*)::integer from public.comments where post_id = '20000000-0000-0000-0000-000000000002'),
  0,
  'anonymous clients cannot read comments on a private draft'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'avatars'),
  0,
  'anonymous clients cannot list avatar object metadata'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'profile-covers'),
  0,
  'anonymous clients cannot list profile-cover object metadata'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'post-images'),
  0,
  'anonymous clients cannot list post-image object metadata'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select is(
  (select count(*)::integer from public.posts where status = 'draft'),
  0,
  'an admin cannot read other users’ private drafts'
);

select is(
  (select count(*)::integer from public.posts where status = 'published'),
  1,
  'an admin can read published posts'
);

select throws_ok(
  $$
    select * from public.admin_correct_post_category(
      '20000000-0000-0000-0000-000000000001',
      'design',
      'An admin cannot correct a private draft'
    )
  $$,
  '42501',
  'Only published posts can be corrected.',
  'the admin correction RPC rejects private drafts'
);

select throws_ok(
  $$ select public.admin_delete_post('20000000-0000-0000-0000-000000000001') $$,
  'P0002',
  'Published post not found.',
  'the admin delete RPC rejects private drafts'
);

select is(
  (select count(*)::integer from public.post_category_changes),
  1,
  'an admin can read only published post category history'
);

select lives_ok(
  $$
    select * from public.admin_correct_post_category(
      '20000000-0000-0000-0000-000000000003',
      'design',
      'An admin verified this post category should change'
    )
  $$,
  'an admin can correct a post category'
);

reset role;

select is(
  (select category from public.posts where id = '20000000-0000-0000-0000-000000000003'),
  'design',
  'the admin correction updates the post category'
);

select is(
  (select count(*)::integer from public.post_category_changes where post_id = '20000000-0000-0000-0000-000000000003'),
  2,
  'the admin correction records an audit event'
);

select is(
  (
    select count(*)::integer
    from public.notifications
    where recipient_id = '10000000-0000-0000-0000-000000000002'
      and post_id = '20000000-0000-0000-0000-000000000003'
      and type = 'post_category_correction'
  ),
  1,
  'the admin correction notifies the post author'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select is(
  (select count(*)::integer from public.notifications where recipient_id = '10000000-0000-0000-0000-000000000002'),
  0,
  'a user cannot read another user’s notifications'
);

select lives_ok(
  $$
    update public.notifications
    set read_at = now()
    where recipient_id = '10000000-0000-0000-0000-000000000002'
  $$,
  'a user cannot mark another user’s notifications as read'
);

reset role;

select is(
  (select read_at is null from public.notifications where recipient_id = '10000000-0000-0000-0000-000000000002' and type = 'post_category_correction'),
  true,
  'a cross-account notification update leaves it unread'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select is(
  (select count(*)::integer from public.notifications where recipient_id = '10000000-0000-0000-0000-000000000002'),
  1,
  'a user can read their own notification'
);

select lives_ok(
  $$
    update public.notifications
    set read_at = now()
    where recipient_id = '10000000-0000-0000-0000-000000000002'
      and type = 'post_category_correction'
  $$,
  'a user can mark their own notification as read'
);

reset role;

select is(
  (select read_at is not null from public.notifications where recipient_id = '10000000-0000-0000-0000-000000000002' and type = 'post_category_correction'),
  true,
  'the owner notification update persists'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete their own avatars'
      and cmd = 'DELETE'
      and qual like '%storage.foldername(name)%auth.uid%'
  ),
  1,
  'avatar deletion policy is scoped to the caller’s folder'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete their own profile covers'
      and cmd = 'DELETE'
      and qual like '%storage.foldername(name)%auth.uid%'
  ),
  1,
  'profile-cover deletion policy is scoped to the caller’s folder'
);

select lives_ok(
  $$
    update storage.objects
    set name = '10000000-0000-0000-0000-000000000002/renamed.png'
    where bucket_id = 'post-images'
      and name = '10000000-0000-0000-0000-000000000001/owner-one-test.png'
  $$,
  'a user cannot update another user’s post image'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'avatars'),
  0,
  'a second account cannot list avatar object metadata'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'profile-covers'),
  0,
  'a second account cannot list profile-cover object metadata'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'post-images'),
  0,
  'a second account cannot list post-image object metadata'
);

reset role;

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'post-images' and name = '10000000-0000-0000-0000-000000000001/owner-one-test.png'),
  1,
  'a cross-account image update leaves the object intact'
);

select * from finish();
rollback;
