<!-- Agent: technical-architect
     When: @-include during project structure design (Section 5 of the architecture document).
     Purpose: Framework-specific annotated directory trees — suggested starting structures for the recommended stack — with feature-to-directory and spec-type-to-location mapping conventions.
     Output: Informs the Project Structure section (Section 5) of technical-architecture.md. -->

# Project Structure Templates

Framework-specific directory structure templates — a suggested starting structure for the recommended stack, written for the implementing team. Each template reflects the genuine conventions of its framework — not cosmetic variations of a generic skeleton. The architect selects the template matching the recommended frontend framework and adapts it to the project's feature list.

**When the recommended stack matches none of the three reference trees** (Next.js, SvelteKit, Nuxt), the architect writes the directory tree from the recommended framework's own documented conventions, honoring the design principles in Section 1 — it never forces one of these trees onto a framework with different conventions. The reference trees are examples of the discipline, not a bound on the stack.

---

## 1. Design Principles

These principles govern all project structures regardless of framework choice:

**Feature isolation.** Each Stage 3 feature (`FEAT-{NN}-{slug}`) maps to a directory in the source code. Feature code does not reach into another feature's directory except through explicitly shared modules.

**Shared infrastructure is explicit.** Components, utilities, and patterns used across features live in clearly named shared directories, not scattered inside feature folders.

**Convention over invention.** The directory structure follows the chosen framework's conventions. Custom directory structures are only introduced where the framework is silent (e.g., where to put business logic for Automation specs, or client modules for Integration specs).

**Flat where possible.** Prefer shallow nesting (2-3 levels) over deep hierarchies. A feature's components, pages, and utilities can be siblings in the feature folder.

---

## 2. Generic Skeleton

The framework-agnostic pattern all structures follow. Framework-specific templates in Section 3 adapt this skeleton to each framework's routing and file conventions.

```
{project-root}/
├── src/                             # All application source code
│   ├── {routing-dir}/               # Framework routing directory (framework-specific)
│   │   ├── {shared-layout}/         # Layout groups for navigation, headers
│   │   ├── {feat-01-slug}/          # Routes for Feature 01
│   │   ├── {feat-02-slug}/          # Routes for Feature 02
│   │   └── api/                     # API/server routes
│   ├── features/                    # Feature business logic (non-routing code)
│   │   ├── feat-01-{slug}/          # Logic for Feature 01
│   │   │   ├── components/          # Feature-specific UI components
│   │   │   ├── hooks/               # Feature-specific hooks/stores/composables
│   │   │   ├── actions/             # Automations, server actions, mutations
│   │   │   └── rules/               # Business rule implementations
│   │   └── feat-02-{slug}/          # Logic for Feature 02
│   ├── shared/                      # Cross-feature shared code
│   │   ├── components/              # Shared UI components (design system)
│   │   ├── hooks/                   # Shared hooks/utilities
│   │   ├── lib/                     # Data access, auth, config, helpers
│   │   │   ├── integrations/        # External-service client modules (Integration specs)
│   │   │   └── notifications/       # Delivery + message-template modules (Notification specs)
│   │   └── styles/                  # Design tokens, global styles
│   └── db/                          # Schema, migrations, seed data
├── public/                          # Static assets (images, fonts, favicon)
├── prisma/ (or drizzle/)            # ORM schema and migrations (if applicable)
├── package.json
├── tsconfig.json
└── {styling-config}                 # tailwind.config.js, etc.
```

---

## 3. Framework-Specific Templates

### 3.1 Next.js (App Router)

Next.js uses the `app/` directory with nested layouts, route groups, and file-based conventions. Server Components are the default rendering mode. API routes use Route Handlers.

```
{project-root}/
├── src/
│   ├── app/                                    # Next.js App Router — file-based routing
│   │   ├── layout.tsx                          # Root layout: html, body, font loading, providers
│   │   ├── globals.css                         # Global styles, Tailwind directives
│   │   ├── page.tsx                            # Landing/home page (route: /)
│   │   ├── loading.tsx                         # Root loading UI (skeleton/spinner)
│   │   ├── error.tsx                           # Root error boundary
│   │   ├── not-found.tsx                       # Global 404 page
│   │   │
│   │   ├── (app)/                              # Route group: shared app layout (nav, sidebar)
│   │   │   ├── layout.tsx                      # App shell: navigation + content area
│   │   │   │
│   │   │   ├── feat-01-{slug}/                 # Feature 01 routes
│   │   │   │   ├── page.tsx                    # List/index view (route: /feat-01-{slug})
│   │   │   │   ├── loading.tsx                 # Feature-level loading state
│   │   │   │   ├── error.tsx                   # Feature-level error boundary
│   │   │   │   ├── [id]/                       # Dynamic segment for detail views
│   │   │   │   │   ├── page.tsx                # Detail view (route: /feat-01-{slug}/[id])
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx            # Edit view (route: /feat-01-{slug}/[id]/edit)
│   │   │   │   └── new/
│   │   │   │       └── page.tsx                # Create view (route: /feat-01-{slug}/new)
│   │   │   │
│   │   │   └── feat-02-{slug}/                 # Feature 02 routes (same pattern)
│   │   │       ├── page.tsx
│   │   │       └── ...
│   │   │
│   │   └── api/                                # Route Handlers — API endpoints
│   │       ├── {entity}/
│   │       │   └── route.ts                    # GET (list), POST (create) for entity
│   │       └── {entity}/[id]/
│   │           └── route.ts                    # GET (single), PATCH (update), DELETE
│   │
│   ├── features/                               # Feature business logic (NOT routing)
│   │   ├── feat-01-{slug}/
│   │   │   ├── components/                     # Feature-specific React components
│   │   │   │   ├── {Entity}Form.tsx            # Form component for create/edit
│   │   │   │   ├── {Entity}Card.tsx            # Card/list-item component
│   │   │   │   └── {Entity}Filters.tsx         # Filter/search controls
│   │   │   ├── hooks/                          # Feature-specific React hooks
│   │   │   │   └── use{Entity}.ts              # Data fetching/mutation hook
│   │   │   ├── actions/                        # Server Actions (Next.js 'use server')
│   │   │   │   ├── create-{entity}.ts          # Create mutation
│   │   │   │   ├── update-{entity}.ts          # Update mutation
│   │   │   │   └── delete-{entity}.ts          # Delete mutation
│   │   │   └── rules/                          # Business rule implementations
│   │   │       └── {entity}-validation.ts      # Validation rules for this feature
│   │   └── feat-02-{slug}/
│   │       └── ...
│   │
│   ├── shared/                                 # Cross-feature shared code
│   │   ├── components/                         # Design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── hooks/                              # Shared React hooks
│   │   │   └── useToast.ts
│   │   ├── lib/                                # Utilities and infrastructure
│   │   │   ├── db.ts                           # Database client (Prisma instance)
│   │   │   ├── auth.ts                         # Auth/session helpers
│   │   │   ├── integrations/                   # External-service client modules
│   │   │   │   └── {service}.ts                # One client module per external service
│   │   │   ├── notifications/                  # Notification delivery modules
│   │   │   │   ├── {channel}.ts                # Delivery module per channel (email, push, ...)
│   │   │   │   └── templates/                  # Message templates
│   │   │   └── utils.ts                        # General utilities
│   │   └── styles/                             # Design tokens
│   │       └── tokens.css                      # CSS custom properties (if not Tailwind)
│   │
│   └── db/                                     # Seed data and DB utilities
│       └── seed.ts
│
├── prisma/                                     # Prisma ORM (if selected)
│   └── schema.prisma                           # Database schema
├── public/                                     # Static assets
├── package.json
├── tsconfig.json
├── next.config.js                              # Next.js configuration
└── tailwind.config.js                          # Tailwind configuration (if selected)
```

**Key Next.js conventions:**
- `page.tsx` defines a route segment — each directory in `app/` with a `page.tsx` becomes a URL
- `layout.tsx` wraps child routes — state persists across navigation within the layout
- `loading.tsx` shows during streaming/suspense — automatic loading states per route
- `error.tsx` catches errors in the subtree — per-route error boundaries
- `(app)/` is a route group — provides shared layout without adding a URL segment
- Server Actions (`'use server'`) replace traditional API calls for mutations
- Server Components (default) fetch data directly — no client-side data fetching needed for reads

---

### 3.2 SvelteKit

SvelteKit uses the `routes/` directory with `+page.svelte` conventions. Load functions (`+page.server.ts`) handle server-side data fetching. The `$lib` alias points to `src/lib/`.

```
{project-root}/
├── src/
│   ├── routes/                                 # SvelteKit file-based routing
│   │   ├── +layout.svelte                      # Root layout: html structure, nav, global UI
│   │   ├── +layout.server.ts                   # Root layout data (auth check, user session)
│   │   ├── +page.svelte                        # Landing/home page (route: /)
│   │   ├── +error.svelte                       # Global error page
│   │   │
│   │   ├── feat-01-{slug}/                     # Feature 01 routes
│   │   │   ├── +page.svelte                    # List/index view (route: /feat-01-{slug})
│   │   │   ├── +page.server.ts                 # Server load function: fetch list data
│   │   │   ├── +layout.svelte                  # Feature-level layout (optional breadcrumbs)
│   │   │   ├── [id]/                           # Dynamic parameter for detail views
│   │   │   │   ├── +page.svelte                # Detail view (route: /feat-01-{slug}/[id])
│   │   │   │   ├── +page.server.ts             # Server load: fetch single entity
│   │   │   │   └── edit/
│   │   │   │       ├── +page.svelte            # Edit view
│   │   │   │       └── +page.server.ts         # Load entity for editing + form action
│   │   │   └── new/
│   │   │       ├── +page.svelte                # Create view
│   │   │       └── +page.server.ts             # Form action: create entity
│   │   │
│   │   ├── feat-02-{slug}/                     # Feature 02 routes (same pattern)
│   │   │   └── ...
│   │   │
│   │   └── api/                                # API endpoints (REST-style)
│   │       ├── {entity}/
│   │       │   └── +server.ts                  # GET (list), POST (create)
│   │       └── {entity}/[id]/
│   │           └── +server.ts                  # GET (single), PATCH, DELETE
│   │
│   ├── lib/                                    # $lib alias — all non-routing code
│   │   ├── features/                           # Feature business logic
│   │   │   ├── feat-01-{slug}/
│   │   │   │   ├── components/                 # Feature-specific Svelte components
│   │   │   │   │   ├── {Entity}Form.svelte     # Form component
│   │   │   │   │   ├── {Entity}Card.svelte     # Card/list-item component
│   │   │   │   │   └── {Entity}Filters.svelte  # Filter controls
│   │   │   │   ├── stores/                     # Feature-specific Svelte stores
│   │   │   │   │   └── {entity}Store.ts        # Writable/derived stores for feature state
│   │   │   │   ├── actions/                    # Server-side mutations
│   │   │   │   │   ├── create-{entity}.ts      # Create logic
│   │   │   │   │   └── update-{entity}.ts      # Update logic
│   │   │   │   └── rules/                      # Business rule implementations
│   │   │   │       └── {entity}-validation.ts  # Validation rules
│   │   │   └── feat-02-{slug}/
│   │   │       └── ...
│   │   │
│   │   ├── components/                         # Design system components (shared)
│   │   │   ├── Button.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── Modal.svelte
│   │   │   └── ...
│   │   ├── server/                             # Server-only utilities
│   │   │   ├── db.ts                           # Database client (Prisma instance)
│   │   │   ├── auth.ts                         # Auth/session helpers
│   │   │   ├── integrations/                   # External-service client modules
│   │   │   │   └── {service}.ts                # One client module per external service
│   │   │   └── notifications/                  # Notification delivery modules
│   │   │       ├── {channel}.ts                # Delivery module per channel
│   │   │       └── templates/                  # Message templates
│   │   ├── utils/                              # Shared utilities (client + server)
│   │   │   └── format.ts                       # Formatting helpers
│   │   └── styles/                             # Design tokens
│   │       └── tokens.css                      # CSS custom properties
│   │
│   ├── app.html                                # HTML shell template
│   └── app.css                                 # Global styles, Tailwind directives
│
├── prisma/                                     # Prisma ORM (if selected)
│   └── schema.prisma
├── static/                                     # Static assets (SvelteKit uses static/, not public/)
├── package.json
├── tsconfig.json
├── svelte.config.js                            # SvelteKit configuration
├── vite.config.ts                              # Vite configuration
└── tailwind.config.js                          # Tailwind configuration (if selected)
```

**Key SvelteKit conventions:**
- `+page.svelte` defines a page — the `+` prefix distinguishes route files from components
- `+page.server.ts` runs server-side load functions — data fetching happens here, returned as props
- `+page.ts` runs universally (server + client) — use for client-safe data transforms
- `+layout.svelte` wraps child routes — nested layouts compose automatically
- `+server.ts` defines API endpoints — standalone server routes with GET/POST/PATCH/DELETE handlers
- `+error.svelte` catches errors per route segment
- `$lib` alias resolves to `src/lib/` — the standard location for all non-routing code
- Form actions in `+page.server.ts` handle mutations via progressive enhancement
- SvelteKit uses `static/` not `public/` for static assets

---

### 3.3 Nuxt 3

Nuxt uses `pages/` with auto-routing, `server/` for all backend logic, and auto-imports for composables. Layouts are defined separately in `layouts/`. The `composables/` directory is auto-imported globally.

```
{project-root}/
├── pages/                                      # Nuxt auto-routing — every .vue file is a route
│   ├── index.vue                               # Landing/home page (route: /)
│   │
│   ├── feat-01-{slug}/                         # Feature 01 routes
│   │   ├── index.vue                           # List view (route: /feat-01-{slug})
│   │   ├── [id].vue                            # Detail view (route: /feat-01-{slug}/[id])
│   │   ├── [id]/
│   │   │   └── edit.vue                        # Edit view (route: /feat-01-{slug}/[id]/edit)
│   │   └── new.vue                             # Create view (route: /feat-01-{slug}/new)
│   │
│   └── feat-02-{slug}/                         # Feature 02 routes (same pattern)
│       └── ...
│
├── layouts/                                    # Nuxt layouts — applied via definePageMeta
│   ├── default.vue                             # Default layout: nav, sidebar, content area
│   └── blank.vue                               # Blank layout: no nav (login, onboarding)
│
├── server/                                     # Nuxt server directory — all backend logic
│   ├── api/                                    # API endpoints (auto-registered)
│   │   ├── {entity}/
│   │   │   ├── index.get.ts                    # GET /api/{entity} — list entities
│   │   │   ├── index.post.ts                   # POST /api/{entity} — create entity
│   │   │   └── [id].get.ts                     # GET /api/{entity}/[id] — single entity
│   │   └── {entity}/
│   │       ├── [id].patch.ts                   # PATCH /api/{entity}/[id] — update
│   │       └── [id].delete.ts                  # DELETE /api/{entity}/[id] — delete
│   ├── middleware/                              # Server middleware (auth checks, logging)
│   │   └── auth.ts                             # Auth verification middleware
│   └── utils/                                  # Server-only utilities
│       ├── db.ts                               # Database client (Prisma instance)
│       ├── integrations/                       # External-service client modules
│       │   └── {service}.ts                    # One client module per external service
│       └── notifications/                      # Notification delivery modules
│           ├── {channel}.ts                    # Delivery module per channel
│           └── templates/                      # Message templates
│
├── components/                                 # Auto-imported Vue components
│   ├── shared/                                 # Design system components
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   ├── Modal.vue
│   │   └── ...
│   └── feat-01-{slug}/                         # Feature-specific components
│       ├── {Entity}Form.vue                    # Form component
│       ├── {Entity}Card.vue                    # Card/list-item component
│       └── {Entity}Filters.vue                 # Filter controls
│
├── composables/                                # Auto-imported composables (Vue Composition API)
│   ├── use{Entity}.ts                          # Feature-specific data fetching composable
│   ├── useAuth.ts                              # Auth state composable
│   └── useToast.ts                             # Toast notification composable
│
├── features/                                   # Feature business logic (non-auto-imported)
│   ├── feat-01-{slug}/
│   │   ├── actions/                            # Feature mutations and automations
│   │   │   ├── create-{entity}.ts              # Create logic
│   │   │   └── update-{entity}.ts              # Update logic
│   │   ├── rules/                              # Business rule implementations
│   │   │   └── {entity}-validation.ts          # Validation rules
│   │   └── utils/                              # Feature-specific utilities
│   │       └── {entity}-helpers.ts             # Formatting, transforms
│   └── feat-02-{slug}/
│       └── ...
│
├── middleware/                                  # Client-side route middleware (navigation guards)
│   └── auth.global.ts                          # Global auth guard — redirects if not logged in
│
├── assets/                                     # Processed assets (Vite handles these)
│   └── css/
│       └── main.css                            # Global styles, Tailwind directives
│
├── prisma/                                     # Prisma ORM (if selected)
│   └── schema.prisma
├── public/                                     # Static assets (served as-is)
├── package.json
├── tsconfig.json
├── nuxt.config.ts                              # Nuxt configuration
└── tailwind.config.js                          # Tailwind configuration (if selected)
```

**Key Nuxt 3 conventions:**
- `pages/` uses file-based auto-routing — `index.vue` for index routes, `[param].vue` for dynamic routes
- `layouts/` are separate from pages — applied via `definePageMeta({ layout: 'default' })` in page components
- `server/` contains all backend logic — `server/api/` for endpoints, `server/middleware/` for server middleware
- Nuxt server routes can use method suffixes: `index.get.ts`, `index.post.ts` for per-method handlers
- `components/` is auto-imported — any `.vue` file here is available globally without import statements
- `composables/` is auto-imported — any exported function is available globally without imports
- `middleware/` (root level) is client-side route middleware — different from `server/middleware/`
- Nuxt does NOT use `src/` — top-level directories are the convention
- `assets/` for Vite-processed files, `public/` for static files served as-is

---

## 4. Feature-to-Directory Mapping Convention

The architect produces one of these tables per project, mapping every Stage 3 feature folder to its suggested code location. The table varies by framework.

**Template (adapt columns per framework):**

| Stage 3 Feature | Route Directory | Logic Directory |
|-----------------|----------------|-----------------|
| `FEAT-01-{slug}/` | `{framework-route-dir}/{slug}/` | `{features-dir}/feat-01-{slug}/` |
| `FEAT-02-{slug}/` | `{framework-route-dir}/{slug}/` | `{features-dir}/feat-02-{slug}/` |
| ... | ... | ... |

**Framework-specific path patterns:**

| Framework | Route Directory Pattern | Logic Directory Pattern |
|-----------|------------------------|------------------------|
| Next.js | `src/app/(app)/feat-{NN}-{slug}/` | `src/features/feat-{NN}-{slug}/` |
| SvelteKit | `src/routes/feat-{NN}-{slug}/` | `src/lib/features/feat-{NN}-{slug}/` |
| Nuxt | `pages/feat-{NN}-{slug}/` | `features/feat-{NN}-{slug}/` |

**Note:** The architect fills in this table for every feature in the project. It is a suggested starting structure for the recommended stack — it gives the implementing team an unambiguous, convention-true home for every feature's code, which they are free to adapt to their own repository practices. When the recommended framework is not one of the three above, the architect derives the path patterns from that framework's own conventions.

---

## 5. Spec-Type-to-Location Mapping Convention

Maps each of the five Stage 3 spec types to its suggested code location. This gives the implementing team an unambiguous suggested home for each spec's implementation files.

| Spec Type | Primary Location | Secondary Location |
|-----------|-----------------|-------------------|
| **Screen** | Route directory (page/layout files) + feature components directory | -- |
| **Automation** | Feature `actions/` directory | `shared/lib/` if the automation is triggered by or affects multiple features |
| **Logic/Rule** | Feature `rules/` directory | `shared/lib/` if the rule is referenced by multiple features |
| **Integration** | Shared integration client directory (`shared/lib/integrations/` or the framework's server-utility equivalent) — one service/client module per external service | Feature `actions/` wrapper when only one feature's flows invoke the integration |
| **Notification** | Shared notification delivery directory (`shared/lib/notifications/` or the framework's server-utility equivalent) — a delivery module per channel plus a message-template directory | Feature `actions/` for feature-specific triggers that call into the shared delivery module |

**Framework-specific spec location examples:**

**Next.js:**

| Spec Type | Primary File(s) | Logic File(s) |
|-----------|-----------------|---------------|
| Screen (list) | `src/app/(app)/{slug}/page.tsx` | `src/features/feat-{NN}-{slug}/components/` |
| Screen (detail) | `src/app/(app)/{slug}/[id]/page.tsx` | `src/features/feat-{NN}-{slug}/components/` |
| Automation | -- | `src/features/feat-{NN}-{slug}/actions/{action}.ts` |
| Logic/Rule | -- | `src/features/feat-{NN}-{slug}/rules/{rule}.ts` |
| Integration | -- | `src/shared/lib/integrations/{service}.ts` |
| Notification | -- | `src/shared/lib/notifications/{channel}.ts`, templates in `src/shared/lib/notifications/templates/` |

**SvelteKit:**

| Spec Type | Primary File(s) | Logic File(s) |
|-----------|-----------------|---------------|
| Screen (list) | `src/routes/{slug}/+page.svelte`, `+page.server.ts` | `src/lib/features/feat-{NN}-{slug}/components/` |
| Screen (detail) | `src/routes/{slug}/[id]/+page.svelte`, `+page.server.ts` | `src/lib/features/feat-{NN}-{slug}/components/` |
| Automation | -- | `src/lib/features/feat-{NN}-{slug}/actions/{action}.ts` |
| Logic/Rule | -- | `src/lib/features/feat-{NN}-{slug}/rules/{rule}.ts` |
| Integration | -- | `src/lib/server/integrations/{service}.ts` |
| Notification | -- | `src/lib/server/notifications/{channel}.ts`, templates in `src/lib/server/notifications/templates/` |

**Nuxt:**

| Spec Type | Primary File(s) | Logic File(s) |
|-----------|-----------------|---------------|
| Screen (list) | `pages/{slug}/index.vue` | `components/feat-{NN}-{slug}/`, `composables/` |
| Screen (detail) | `pages/{slug}/[id].vue` | `components/feat-{NN}-{slug}/`, `composables/` |
| Automation | -- | `features/feat-{NN}-{slug}/actions/{action}.ts` |
| Logic/Rule | -- | `features/feat-{NN}-{slug}/rules/{rule}.ts` |
| Integration | -- | `server/utils/integrations/{service}.ts` |
| Notification | -- | `server/utils/notifications/{channel}.ts`, templates in `server/utils/notifications/templates/` |
