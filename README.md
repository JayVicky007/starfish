# 🌟 Starfish Next.js SaaS Boilerplate
[![Project Starfish CI](https://github.com/JayVicky007/starfish)]

**Starfish** is a premium, multi-user, production-vetted Next.js 16 + Supabase + Tiptap Editorial SaaS boilerplate. It is engineered specifically as a commercial-grade launch template for digital distribution platforms like Lemon Squeezy, Stripe, and Gumroad, allowing you to bypass configuration fatigue and deploy enterprise-level content networks instantly.

---

## 🚀 Key Platform Capabilities

### ⚡ Professional Editorial Engine

- **Tailored Tiptap Framework:** A custom rich-text canvas equipped with asynchronous background auto-save tracking indicators, text alignment nodes, inline formatting, and custom case transformation macros (uppercase, capitalize, lowercase).
- **Advanced Asset Processing:** Integrated image injection utility with automatic boundary enforcement restricted to a strict 5MB platform size limit control.
- **Dynamic Content Lifecycle:** Separate organizational workspaces for managing public live deployments and private creator drafts natively.

### 🔐 Hardened Security & Multi-User Architecture

- **Supabase RLS Protection:** Hardened Row Level Security (RLS) database policies protecting profiles, posts, comments pipelines, and attachment assets.
- **Audited Administration Overrides:** Administrative trace panels allowing global topic modifications (`saas`, `ai`, `devops`, `design`) with real-time audit tracing logs and automated author notifications.
- **Ecosystem Moderation:** Interactive reporting queues for comment violation traces, account isolation/ban configurations, and absolute post-deletion cascades.

### 🌐 Enterprise-Grade Core Stack

- **Next.js 16 App Router & React 19:** Clean server components layouts optimized for structural server-side rendering performance.
- **Tailwind CSS v4:** Modern layout compilation leveraging high-performance utility class chains.
- **Resilient Dev Pipelines:** Client factory environment fallbacks unblocking local `npm run dev` and `npm run build` routines natively without needing functional production database credentials.

---

## 🛠️ The Technical Stack

| Technology Layer  | Vetted Framework Version | Purpose within Starfish Ecosystem                                              |
| :---------------- | :----------------------- | :----------------------------------------------------------------------------- |
| **Next.js**       | `v16.3.4` (App Router)   | Server component structure, data optimization, and API route layers            |
| **React**         | `v19.2.8`                | Concurrent UI compilation, lifecycle rendering loops, and forms state          |
| **Supabase SSR**  | `@supabase/ssr`          | Hardened session middleware, auth cookies management, and secure RLS           |
| **Tiptap Core**   | `v3.31.3`                | Custom WYSIWYG editor canvas, selection mapping, and handle plugins            |
| **Tailwind CSS**  | `v4`                     | High-conversion typography, layout variables, and multi-tier component styling |
| **Sanitize-HTML** | `v2.18.0`                | Server-side rich-text injection protection and alignment tracing schemas       |

## ⚙️ Core Configuration & Environment Mapping

Create a `.env.local` file inside your project root to align your local variables. Replace the placeholders below with your actual project keys from your dashboard provider.

```env
# Supabase Secure Access Client Nodes (Safe for Browser Bundle Exposure)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_public_anon_key_here

# Server-Side Operational Access (CRITICAL: Keep Secure - Never expose to Client)
SUPABASE_SERVICE_ROLE_KEY=your_secret_admin_service_role_key_here

# Monetization Webhook Routing Validation Keys (Server-Only Runtime)
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_verification_secret_here
```

---

## 🏎️ Getting Started Locally

Follow this systematic setup process to initialize the local creator workspace.

### 1. Provision Code Dependencies

Install your node modules using clean npm installation tracking locks:

```bash
npm ci
```

### 2. Configure Local Database Schema

Database configurations are managed via versioned migration traces in `supabase/migrations`. Spin up your local stack, authenticate your Supabase CLI node, and execute the migration pipeline:

```bash
# Log in to your remote account node
npx supabase login

# Link your local working tree directory to your active project ref
npx supabase link --project-ref YOUR_PROJECT_REFERENCE_ID

# Deploy schema, index definitions, and rate-limit triggers live
npx supabase db push
```

### 3. Initialize the Development Engine

Launch the dynamic compilation loop layer:

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** to view the live local workspace.

---

## 🔍 Directory Grid Topography

```text
.github/
  workflows/    -> Project Starfish Continuous Integration action runners
src/
  app/          -> Next.js 16 App Router pages, layouts, and system nodes
    admin/      -> Administrative taxonomies and audit trail traces
    api/        -> Server action paths and backend webhook vectors
    blog/       -> Reading canvases and paginated article layouts
  components/   -> Vetted UI modules, rich text editors, and theme providers
  types/        -> Type footprint casting blueprints
  utils/        -> Supabase factories, HTML sanitizers, and blog controllers
supabase/
  migrations/   -> Idempotent SQL setups, RLS definitions, and triggers
```

---

## 🚀 Production Deployment Pipeline

Project Starfish uses server-rendered layout components and dynamic Supabase state sync hooks. Deploy your repository into a production node designed for standard Next.js workloads (e.g., Vercel, AWS Amplify, or a standalone Node.js server container).

### Build and Compilation Routines

Always verify compilation baselines before pushing live configurations to production:

```bash
# Verify strict TypeScript footprint contracts across all modules
npm run type-check

# Compile production bundle output chunks
npm run build

# Boot local production web server container node
npm run start
```

---

## 🧪 Quality Assurance & CI Workflow Ledger

The application repository is configured with a strict automated continuous integration workflow pipeline mapped via GitHub Actions. On every code push or branch merge request to `main`:

- A clean virtual test node boots an isolated instance container.
- Node.js dependencies map directly out of the `package-lock.json` trace matrix.
- `npx tsc --noEmit` checks and verifies total project type-safety footprints.
- `npm run build` executes to guarantee 100% production compilation readiness before deploy gates trip open.

---

## 📈 Commercial Distribution Permissions

This boilerplate is packed commercially for individual creator deployment paths and unlimited multi-tier software agency product white-labeling:

- **Developer License:** Entitles a single developer to infinite production product runtime configurations.
- **Commercial Agency License:** Grants multi-user distribution permissions, custom theme bundling, and complete redistribution code access hooks across external client projects natively.

_Disclaimer: Framework versions match Next.js 16 + React 19 core dependencies configurations. Multi-user row-level data boundaries are initialized and locked._
