# Starfish Product Readiness Checklist

This checklist is based on the current repository and the manual checks reported
so far. A feature marked implemented is not automatically production-verified;
the release checks below still need to pass against a clean Supabase project and
a deployed staging environment.

## Agreed initial scope

- **Product:** a reusable editorial SaaS starter template built with
  Next.js, Supabase, and Tiptap, sold through template marketplaces.
- **Primary customer:** a developer or business buying the source template and
  deploying/customizing it for their own product.
- **Billing:** the template seller is not a payment provider and does not charge
  the buyer's end users. A sample BYO-provider integration may be an optional
  future feature, but it is not required for the initial template release.
- **Application scope:** retain only the editorial/auth/admin capabilities that
  make a coherent starter. Do not add organization, invitation, or multi-tenant
  infrastructure unless a specific template requirement justifies it.

## Status key

- **Implemented** — the feature exists in the repository or has been manually
  exercised.
- **Partial** — some pieces exist, but the stated product capability is broader
  than what is implemented or verified.
- **Missing** — no implementation or repeatable verification was found.
- **Deferred** — intentionally outside the initial template release scope.

## Current feature inventory

| Area | Status | What exists / what remains |
|---|---|---|
| Marketplace-ready template packaging | Partial | Buyer-facing setup and scope documentation is now clearer. Demo data, release packaging, license, and marketplace requirements still need validation. |
| Domain-neutral identity | Partial | The homepage, metadata, footer, login, and development navbar sandbox use editorial/sample content. Admin category correction and the active post flows now use generic categories; the legacy `media_type` column remains synchronized for upgrade compatibility. Branding is not yet configurable. |
| Email/password authentication | Partial | Signup, login, confirmation callback, and password reset request/update flows exist. Deployed password recovery and sign-out/expired-session behavior still need end-to-end verification. Signup/reset responses avoid exposing whether an email is registered. |
| Creator profiles | Implemented | Profile editing, unique usernames chosen at signup, and avatar/cover images exist. Usernames are immutable after account creation; display names remain editable. Device uploads use Supabase Storage; the avatars bucket migration was added after the reported missing-bucket issue. |
| Editorial authoring | Implemented | Tiptap editor, draft autosave, draft editing, publishing, and post-image uploads exist. Draft editing was manually exercised after fixing the stale database column lookup. |
| Public publications | Implemented | Blog listing and individual post routes exist, with topic filtering and published content. |
| Comments and engagement | Implemented | Comments, replies, likes, reports, mentions, and notifications have application code and migrations. |
| Admin and moderation | Partial | Admin pages and user management/moderation actions exist. Category changes now have a durable audit log and author notification; other consequential admin actions still need audit coverage. |
| Supabase access control | Partial | RLS policies and storage ownership policies exist in migrations. pgTAP now covers anonymous/profile/comment visibility, owner and cross-account profile/comment behavior, notification privacy, private drafts, and storage upload ownership/listing; verify the latest migration on staging and continue broader lifecycle checks. |
| Billing integration | Optional / missing | No checkout, signed billing webhook, subscription state, or entitlements exist. These are not required for the initial template; if later included, deployments should bring their own provider accounts and secrets. |
| Team organizations | Out of initial scope | No organization membership or invitation system was found. Avoid implying multi-tenant/team support unless a future scope explicitly includes it. |
| Automated product/security tests | Partial | pgTAP covers signup, username guarantees, profile/comment/notification access, draft/category authorization, and storage ownership/listing against a clean local Supabase stack in CI. Browser-level signup and upload tests and broader moderation/lifecycle coverage remain. |
| Setup and deployment guidance | Partial | README provides basic Supabase setup, but clean-project migration instructions and a tested staging/deployment walkthrough remain to be verified. |
| Product claims and licensing | Partial | README and homepage no longer claim billing, production certification, enterprise/team support, or rights that are not established. The distribution license and marketplace listing requirements remain undecided. |

## Build plan

### 1. Lock the product definition

- [x] Define the product as a downloadable SaaS starter template sold on
  template marketplaces.
- [x] Exclude operating an in-app billing service from the initial product.
- [x] Defer any optional BYO-provider billing sample until the core template is
  coherent and sale-ready.
- [x] Define the first release feature set and explicitly list exclusions in
  the README.
- [ ] Choose a marketplace and check its current submission, packaging, and
  documentation requirements.
- [ ] Define the intended software license and have its terms reviewed before
  making commercial redistribution claims.
- [x] Update the README and homepage so every feature and commercial claim is
  either implemented and verified or clearly marked as not included.

**Done when:** a buyer can tell exactly what the template includes, what setup
is required, what provider accounts they need, what license applies, and what
is out of scope.

### 2. Make the existing application a coherent generic starter

- [x] Generalize the active admin category-correction workflow, audit log, and
  notification without removing existing post-category data.
- [ ] Inventory and remove or generalize remaining cinematic/TMDB-specific UI,
  legacy schema fields, taxonomy, dependencies, and dead code without breaking
  editorial functionality.
- [ ] Make remaining product branding buyer-configurable with neutral defaults.
- [ ] Keep account-owned content and profile behavior clear; avoid adding a
  separate workspace model without a concrete feature that needs it.
- [ ] Preserve the existing owner/admin access boundaries while refactoring.
- [ ] Review grants, RLS policies, admin-only operations, and storage policies
  against the intended access matrix.
- [ ] Test anonymous, owner, and second-account access for profiles, drafts,
  published posts, comments, notifications, and uploaded files.
- [x] Add automated database tests for signup profile creation, username
  uniqueness/immutability, and owner/admin draft and category-correction access.
- [x] Extend pgTAP authorization coverage to profiles, comments, notifications,
  and storage ownership/listing.
- [ ] Add browser-level signup and upload tests.

**Done when:** the template is domain-neutral, and a fresh account can only
manage its own private content and assets while public content is exposed
intentionally and the boundaries are repeatably tested.

### 3. Complete the advertised product capabilities

- [ ] Extend durable administrative audit events to consequential moderation
  and account actions beyond post-category changes.
- [ ] Verify profile, draft, publish, comments, moderation, notifications, and
  image lifecycle behavior end to end.
- [x] Add password recovery and document supported email/password auth flows.
- [ ] Verify confirmation and password recovery end to end on the deployed
  staging site; decide whether any additional login methods are needed.
- [ ] If billing becomes a product requirement, implement a provider integration
  that uses the deployer's own account, keys, and webhook configuration; never
  route their customers' payments through the template seller.

**Done when:** each advertised capability has an end-to-end acceptance test and
does not rely on manual database edits or undocumented provider settings.

### 4. Make purchase, setup, and release repeatable

- [ ] Apply migrations, including the category-correction migration, to a clean
  Supabase project and verify bucket settings, RLS, and migration history.
- [x] Document required public and server-only environment variables without
  providing real credentials.
- [x] Provide safe example configuration and a clean, step-by-step installation
  path that works for a buyer who has never used this repository.
- [ ] Include a demo/reset path or sample content strategy that does not ship
  real secrets or depend on the author's live Supabase project.
- [x] Add automated database tests to CI alongside type-check and production
  build.
- [ ] Resolve or explicitly track existing full-project lint errors.
- [ ] Deploy a staging instance and test signup, email confirmation, sessions,
  uploads, authorization, and error handling there. Billing tests are only
  needed if a provider integration is later added.
- [ ] Provide a recovery/backup and migration rollback or forward-fix policy.

**Done when:** a new buyer can follow the docs from purchase/download to a
working deployment on their own Supabase project, and CI plus the release
checklist catch regressions before launch.

## Release gate

Do not describe the template as production-vetted or feature-complete for sale
until the scope and claims are accurate, a fresh buyer setup and deployed
staging checks pass, and the critical owner/admin authorization tests run
automatically.
