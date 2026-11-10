# Starfish Editorial Starter

Starfish is a downloadable starter project for developers who want to build on
an example editorial application. It uses Next.js, Supabase, and Tiptap. The
repository includes working application features, but it is a starting point,
not a certified or production-vetted service.

## Included

- Email and password sign-up, sign-in, and Supabase session handling.
- Password reset email requests and password updates through Supabase Auth.
- User profiles with unique, permanent usernames, editable display names, and
  avatar and cover image uploads.
- A Tiptap editor with draft autosave, draft editing, and publishing.
- Public article pages, comments, replies, likes, and mention notifications.
- Admin pages for moderation, account management, and audited post-category
  corrections.
- Supabase migrations for the application schema, access policies, and storage
  buckets.

Access policies are present in the migrations, but every buyer should review
and test them against their own requirements before launch.

## Not included

- In-app billing or payment processing. Deployers must integrate and operate
  their own provider account if their product needs billing.
- Team organizations, invitations, or multi-tenant workspaces.
- A warranty, compliance certification, or guarantee that the application is
  production-ready without additional review and testing.

## Requirements

- Node.js 22 or later.
- npm.
- A Supabase project.

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create `.env.local` in the repository root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

   # Optional: required only for server-side admin operations.
   # Never expose this key in browser code or commit it to source control.
   SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
   ```

   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be used instead of
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These two public-key variables are not
   secrets; the service-role key is.

3. Configure the Supabase Auth site URL and redirect allowlist for your local
   URL, including `http://localhost:3000/auth/callback`.

4. To apply migrations to a **new, empty Supabase project**, log in and link the
   project. With the current Supabase CLI, database commands target the local
   stack by default; use `--remote` to target the linked hosted project:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REFERENCE_ID
   npx supabase migration list --remote
   npx supabase db push --remote --dry-run
   ```

   Review migration status and the dry-run output. Confirm the linked project is
   the intended one before applying:

   ```bash
   npx supabase db push --remote
   ```

   **Do not push this migration history blindly to an existing populated
   project.** First compare its schema and migration history with
   `supabase/migrations`; reconcile the baseline safely and back up important
   data before applying changes. In particular, the username migration will
   stop if existing usernames collide when compared without regard to case or
   surrounding whitespace; resolve those duplicates before applying it.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npx tsc --noEmit
npm run build
npm run lint
```

The database tests use pgTAP and a disposable local Supabase stack. Install and
start Docker Desktop, then run:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
npx supabase stop
```

`db reset` deletes and rebuilds the **local** Supabase database from the
repository migrations and seed file. Do not run it against a remote project.
These tests exercise the signup profile trigger, username uniqueness and
immutability, owner access to drafts, and admin access to published posts and
category corrections. Admins cannot read another user's private drafts or use
moderation tools to correct or delete drafts.
They run only against the local Supabase stack; do not use `--remote` for tests.
GitHub Actions runs the database tests alongside TypeScript validation and the
production build. Browser-level signup and upload tests are not yet included.

The login page provides password reset at `/reset-password`; configure the
Supabase Auth redirect allowlist to include
`http://localhost:3000/auth/callback` during local development and
`https://your-domain/auth/callback` for each deployed domain. Signup and
password reset responses avoid confirming whether a particular email address
has an account.

## Before deploying your customized app

- Replace Starfish/sample copy, categories, links, and other branding.
- Review every Supabase migration, RLS policy, storage policy, and admin
  operation; test access with separate accounts.
- Set Auth redirect URLs for your deployed domain.
- Store server-only keys in your hosting provider's secret environment
  settings, not in client variables or source control.
- Run the app's build and relevant manual/automated tests against your own
  Supabase project.
- Add your own privacy, terms, support, backup, monitoring, and billing
  integrations as required by your product.

## License

The repository does not currently define a distribution license. Confirm and
include the intended license before selling or redistributing the template.
