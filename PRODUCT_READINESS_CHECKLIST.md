# Starfish Product Readiness Checklist

This checklist is based on the current repository and the manual checks reported
so far. A feature marked implemented is not automatically production-verified.
The database suite has passed against a disposable local Supabase stack, and a
staging deployment using a separate Supabase project already exists. The
remaining release checks below concern any unverified staging flows, not
recreating that project or deployment.

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
| Email/password authentication | Partial | Signup, login, confirmation callback, and password reset request/update flows exist. Signup, email confirmation, password recovery, and session behavior were tested on staging. Sessions persist through token refresh unless a maximum lifetime or inactivity timeout is configured. Signup/reset responses avoid exposing whether an email is registered. |
| Creator profiles | Implemented | Profile editing, unique usernames chosen at signup, and avatar/cover images exist. Usernames are immutable after account creation; display names remain editable. Device uploads use Supabase Storage; the avatars bucket migration was added after the reported missing-bucket issue. |
| Editorial authoring | Implemented | Tiptap editor, draft autosave, draft editing, publishing, and post-image uploads exist. Draft editing was manually exercised after fixing the stale database column lookup. |
| Public publications | Implemented | Blog listing and individual post routes exist, with topic filtering and published content. |
| Comments and engagement | Implemented | Comments, replies, likes, reports, mentions, and notifications have application code and migrations. |
| Admin and moderation | Partial | Admin pages and user management/moderation actions exist. Category changes now have a durable audit log and author notification; other consequential admin actions still need audit coverage. |
| Supabase access control | Partial | RLS policies and storage ownership policies exist in migrations. pgTAP now covers anonymous/profile/comment visibility, owner and cross-account profile/comment behavior, notification privacy, private drafts, and storage upload ownership/listing; verify the latest migration on staging and continue broader lifecycle checks. |
| Billing integration | Optional / missing | No checkout, signed billing webhook, subscription state, or entitlements exist. These are not required for the initial template; if later included, deployments should bring their own provider accounts and secrets. |
| Team organizations | Out of initial scope | No organization membership or invitation system was found. Avoid implying multi-tenant/team support unless a future scope explicitly includes it. |
| Automated product/security tests | Partial | pgTAP covers signup, username guarantees, profile/comment/notification access, draft/category authorization, and storage ownership/listing against a clean local Supabase stack in CI. Browser-level signup and upload tests and broader moderation/lifecycle coverage remain. |
| Setup and deployment guidance | Partial | README provides basic Supabase setup, and the staging deployment and key user flows have been verified. Clean-project buyer migration instructions and a documented setup walkthrough still need verification. |
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
- [x] Verify password recovery and session behavior on the existing staging
  site (confirmed by the user on 2026-11-18). Supabase access tokens expire
  and refresh automatically; no maximum session lifetime or inactivity timeout
  has been selected.
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
- [x] Verify TypeScript validation and the production build locally on
  2026-11-18.
- [x] Clear the 2026-11-18 lint baseline (11 errors and 14 warnings across
  `src/app/blog/[slug]/page.tsx`, `src/app/blog/page.tsx`,
  `src/components/BlogComments.tsx`, `src/components/Navbar.tsx`,
  `src/components/WritePostForm.tsx`, and `src/utils/blogService.ts`).
  `npm run lint`, TypeScript validation, and the production build now pass.
- [x] Run the database suite on a disposable Supabase stack. On 2026-11-18,
  all 21 migrations applied successfully to a separate temporary project and
  all 65 pgTAP tests passed. The usual `supabase db reset` workflow is
  destructive to its local database, so do not run it against a local stack
  unless its data is confirmed disposable.
- [x] Deploy a staging instance using a separate Supabase project (already
  completed; do not recreate it).
- [x] Verify signup, email confirmation, sessions, uploads, authorization, and
  error handling on the existing staging deployment (confirmed by the user on
  2026-11-18). Billing tests are only needed if a provider integration is
  later added.
- [ ] Before release, restore the temporary email-send rate limit used for
  password-reset testing to the intended production limit in local and hosted
  Supabase settings.
- [ ] Provide a recovery/backup and migration rollback or forward-fix policy.

**Done when:** a new buyer can follow the docs from purchase/download to a
working deployment on their own Supabase project, and CI plus the release
checklist catch regressions before launch.

### 5. Prepare for marketplace sale

Envato's [author application update](https://help.author.envato.com/hc/en-us/articles/53981083605913-Author-applications-are-paused)
said on 2026-11-06 that it was not accepting new author accounts and that
Theme and Code categories were not currently planned to reopen. It also says
AI-generated content is not accepted. Since parts of this project have
AI-assisted changes, confirm whether the policy affects this item before
pursuing Envato. Recheck the current rules before relying on Envato as the
launch channel; preparation does not guarantee marketplace access or approval.

- [x] Keep preparations platform-neutral until the sales channel is selected.
- [ ] Choose the initial sales channel and confirm the correct category. Envato
  distinguishes ThemeForest web themes/templates from CodeCanyon code/scripts;
  confirm the category for this full-stack Next.js starter before tailoring the
  listing.
- [ ] Complete seller onboarding when the chosen platform permits it. The
  seller must provide any required identity, business, tax, and payout details.
- [ ] Prepare the downloadable release ZIP with a clear folder structure;
  exclude secrets, `.env.local`, dependencies, build output, and unrelated
  development files; test setup from a fresh extraction.
- [ ] Create clear beginner-oriented English installation, configuration,
  customization, troubleshooting, and feature documentation. Envato's
  [Theme](https://help.author.envato.com/hc/en-us/articles/360000470826-Themes-Item-Preparation-Technical-Requirements)
  and
  [Code](https://help.author.envato.com/hc/en-us/articles/360000471583-Code-Item-Preparation-Technical-Requirements)
  item guidance requires an English HTML or PDF help file; CodeCanyon also
  requires publicly accessible online documentation.
- [ ] Prepare an accurate live demo where appropriate, plus marketplace-ready
  screenshots/preview images and a cover/thumbnail that match the actual
  product. Follow the selected platform's
  [presentation requirements](https://help.author.envato.com/hc/en-us/articles/360000424863-Item-Presentation-Requirements)
  and test the demo and every preview link.
- [ ] Prepare the listing: category, concise title, plain-language feature
  description, requirements/limitations, tags, pricing, and disclosure of
  preview-only assets, following the platform's
  [item information requirements](https://help.author.envato.com/hc/en-us/articles/360000471066-Item-Information-and-Metadata-Requirements).
- [ ] Verify commercial rights, licenses, and required attributions for all
  code, fonts, icons, images, demo data, and preview assets; remove or replace
  anything without appropriate redistribution rights.
- [ ] Decide whether to offer marketplace item support. If an Envato Market
  item is marked supported, the author commits to at least six months of
  support; review Envato's
  [support guidance](https://help.author.envato.com/hc/en-us/articles/360000471703-Item-Support-Best-Practices)
  and define a realistic support channel and response time before opting in.
- [ ] Review the selected platform's current author terms, item rules, review
  requirements, and applicable buyer license terms before submission. For
  Envato, review its [author terms](https://help.author.envato.com/hc/en-us/articles/41371538488473-Envato-Market-Author-Terms)
  and [review guidance](https://help.author.envato.com/hc/en-us/articles/360000471923-How-to-Get-Your-Items-Through-Review-at-Envato).

## Release gate

Do not describe the template as production-vetted or feature-complete for sale
until the scope and claims are accurate, a fresh buyer setup and deployed
staging checks pass, and the critical owner/admin authorization tests run
automatically.
