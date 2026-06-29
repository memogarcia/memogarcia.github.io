---
title: "SaaS Template"
date: 2026-06-29T00:00:00+09:00
draft: false
---

How many tokens does "building a SaaS project" cost and how many of those are non-requirements? The parts you need but are not core to the product.

I have asked my trusted codex to build SaaS foundations several times already. Auth, tenant isolation, billing, transactional email, database migrations, structured logging, feature flags and so on. Every new project starts with the same same intention, however each time is a different implementation.

This is why I decided to templateize the bits and pieces that I always need but sucks to recreate every time.

I'm starting with [saas-template-v1](https://github.com/memogarcia/saas-template)

The repo is a Next.js SaaS starter containing the reusable parts I keep needing:
- Next.js App Router and TypeScript.
- Monorepo boundaries with npm workspaces.
- Postgres with tenant-scoped tables and Row-Level Security (RLS).
- Redis and S3-compatible storage interfaces.
- Auth API routes and session cookies.
- Resend transactional email and Stripe billing.
- Structured JSON logs, OTLP metrics, and OTLP traces.
- Taskfile automation for local database setup and migrations.
- And more...

This has actually saved shit loads of tokens and time.

## The Auth and User Lifecycle

"We need auth" usually means login and logout. But it keeps out email verification, session revocation, rate limiting, and password reset flows.

When you build multi-tenant software, user management is CRUD plus consequences.

### What we shipped:
- **Cookie-based sessions**: HttpOnly, SameSite, and CSRF protection.
- **Verification flows**: Signup, email verification, password reset, and resend tokens.
- **Lifecycle API routes**: Login, logout, registration, and reset endpoints.
- **Password hashing**: Argon2id with tuned parameters. No bcrypt, no MD5, no plain SHA.
- **Session lifecycle**: Absolute and idle expiry, rotating IDs on privilege change, and a revoke-all-sessions path.
- **Enumeration prevention**: Login, reset, and signup return identical messages and timing, so an attacker cannot probe which emails exist.
- **Brute-force throttling**: Per-account and per-IP limits applied before the password is ever read.
- **MFA**: TOTP enrollment, hashed recovery codes, and scratch codes for the moment a device is lost.
- **Breached password check**: K-anonymity lookups against Have I Been Pwned at signup and on rotation.

### What the product must decide:
- **SSO and MFA**: At what point does client risk justify adding SAML or hardware keys?
- **Deletion policies**: When a user clicks "Delete Account," does the data vanish immediately, or is it soft-deleted for a 30-day grace period? What happens to shared tenant data, historic invoices, and audit logs?
- **Support-assisted recovery**: How does support verify identity when a user loses access to their email?
- **Social login**: Google and GitHub cut signup friction but force a decision about account linking and merge conflicts when the same email appears twice.
- **Session policy**: How long is "logged in" for a billing admin versus a read-only viewer? Sliding sessions feel friendly; absolute caps limit blast radius.

## Multi-Tenancy and Isolation

Multi-tenant SaaS needs a **HARD** boundary. If one tenant can read another's data, it means a lawsuit.

I use Postgres Row-Level Security (RLS) driven by `app.tenant_id` and `app.user_id` context. Before running reads or writes, the server sets these values inside the transaction.

### The isolation checklist:
- **Database context**: Setting tenant and user context before every query.
- **Indexes**: Composite indexes that include tenant identifiers to keep queries fast.
- **Tenants vs. Workspaces**: The schema allows one tenant (the billing entity) to own multiple workspaces (the collaboration boundaries).
- **Entitlements**: Enforcing plan limits (seats, usage, storage) on the server, not just hiding buttons in the React UI.
- **Tenant deletion**: Cascading deletes that clean up files, databases, and external records without hitting resource timeouts.
- **Invitations and roles**: Signed email invites plus a role hierarchy (owner, admin, member, viewer). Permissions are enforced server-side, never inferred from UI state.
- **Default-deny sharing**: Cross-tenant reads are impossible by default. Any sharing is an explicit, audited grant, never an opt-out.
- **Audit log**: Privileged actions append a tenant-scoped record with actor, target, and before/after state.
- **Onboarding**: Creating a tenant seeds default config, the first admin, and plan entitlements in one transaction. No half-created tenants.
- **Data export**: A signed job dumps tenant data as CSV or JSON on demand. Users should be able to leave.

## Database and Security Baseline

A SaaS needs a security posture before it has customers. I use Drizzle for typed queries, but SQL migrations stay the source of truth.

### The baseline:
- **Immutable migrations**: Once a migration runs in production, it is locked. Drift is fixed by shipping a new migration.
- **Secrets hygiene**: No API keys, session tokens, or machine credentials in Git.
- **Network security**: TLS everywhere, HSTS in production, and strict CORS allowlists.
- **Content Security Policy**: CSP headers with nonce support plumbed through Next.js middleware.
- **Rate limiting**: API-level limits on auth routes and resource creation endpoints.
- **Idempotency keys**: Required for webhook handlers and payment processing to prevent double-billing.
- **Boundary validation**: Every input is parsed through a schema (zod) at the edge. Handlers never see unvalidated data.
- **Audit trail**: Sensitive mutations append to an append-only table. You need it the first time a customer asks "who changed this."
- **Dependency scanning**: CI fails on high-severity advisories from `npm audit` or osv-scanner. Known-CVE code does not ship.
- **Encryption**: TLS in transit, encrypted volumes and S3 SSE at rest, field-level encryption for identifiers like email or tax IDs.
- **Migration review rules**: No destructive change without a backfill. Add the column, backfill, deploy the reads, then drop. Forward-only, always.

## Operational Plumbing

Day-two operations require plumbing that is painful to build during a launch.

### Transactional Email
The template hooks up Resend. In development, email sends are captured locally to avoid spamming real addresses.
- **Deliverability**: SPF, DKIM, and DMARC config rules.
- **Separation**: Transactional mail runs on a separate subdomain from marketing campaigns to protect sender reputation.
- **Bounce and complaint handling**: Resend webhooks feed a suppression list so you stop sending to addresses that rejected you. Sending to a known complainer tanks deliverability for everyone.
- **Unsubscribe**: A one-click `List-Unsubscribe` header and a working opt-out link. Required for bulk mail in most jurisdictions.
- **Templates**: MJML or react-email compiled to inline-CSS HTML, with a plaintext alternative. Plaintext is not optional for deliverability.

### Billing
Stripe integration handles checkout redirects, billing portal sessions, and signed webhooks.
- **Idempotent Webhooks**: We store provider events in an event log before processing them, preventing double-processing on network retries.
- **Downgrade paths**: What happens when a subscription fails? We map out grace periods and read-only states rather than shutting off access immediately.
- **Trials and dunning**: Trial start and end dates, card-required versus not, and an automated retry schedule for failed payments with customer emails.
- **Usage metering**: If pricing is metered, usage is recorded on the write path and reconciled nightly. Invoicing at request time is how you underbill.
- **Proration and tax**: Plan changes prorate. Stripe Tax handles VAT and GST so you do not build a tax engine you do not understand.

### Observability
I include structured JSON logging and OpenTelemetry (OTLP) metrics/traces, toggled via feature flags.
- **Attributable actions**: Logs include `tenant_id` and `user_id` context where safe.
- **Webhooks and queues**: Dedicated dashboards trace external callback latency and retry rates.
- **Error tracking**: A Sentry-class client captures exceptions with release and commit SHA attached. A stack trace without a release is a dead end.
- **Alerting with ownership**: Every page routes to a human and a rotation. An alert without an owner gets ignored until it has one, and that is how outages compound.
- **Trace sampling**: Head sampling for the common path, tail sampling for errors and slow spans, so traces stay affordable as traffic grows.

## Reliability and Support

Support is part of the product. If your engineers have to run raw SQL queries to reset a user's MFA or override a plan limit, you aren't ready for production.

### Operational workflows:
- **Backups**: Automated database dumps before migrations. A backup you have never restored is a rumor.
- **Admin tools**: Scoped, audited tenant search and plan overrides.
- **Impersonation**: If support needs to log in as a user to debug an issue, it must be time-bound, logged, and trigger a notification to the user.
- **Rollbacks**: The deployment pipeline must support zero-downtime rollbacks for both the application container and database schema changes.
- **Health endpoints**: Separate liveness and readiness probes. Liveness says the process is up; readiness says it can serve traffic, including after a dependency recovers.
- **Graceful shutdown**: SIGTERM drains in-flight requests and closes the database pool before the container exits. Hard kills drop user work.
- **Restore drills**: A backup is a rumor until you restore it into a fresh database and run the suite against it. Schedule these on a calendar, not only before a migration.
- **Status page**: A public page where incidents get posted. It sets expectations and absorbs support load while you are fixing the thing.

## Developer and User Experience

A template should reduce setup friction. It needs a single startup path and clear boundaries.

### UX baseline:
- **State handling**: Empty states, loading screens, and 404/500 error boundaries.
- **Accessibility**: Keyboard navigation and semantic HTML targets from day one.
- **Mobile layout**: Responsive views for settings and main dashboards.
- **Forms**: Inline validation, accessible error messages bound to inputs, and submit states that block double-submits.
- **Optimistic UI**: Skeletons for first paint, optimistic updates with rollback on error. The interface should not freeze while it waits on the server.

### Developer loop:
- **Product briefs**: Before writing code, fill out `PRODUCT.md` (target user, pain, first paid workflow).
- **Environment validation**: App environment variables are validated at startup. If a variable is missing, the process exits immediately with a clear error.
- **CI checks**: Lint, typecheck, unit tests, and build run on every PR, plus a preview deploy so reviewers see the change running.
- **Seed data**: One command loads demo tenants, users, and plans. A new contributor should have a working app in minutes, not an afternoon.

## AI Token Hygiene

This is the economics part. I want to spend prompts on the product, not on rebuilding foundations.

The workflow with an LLM agent looks like this:
1. Select the stack profile (`next-postgres` or `cloudflare-workers-d1`).
2. Fill out `PRODUCT.md`, `ARCHITECTURE.md`, and `DESIGN.md`.
3. Disable unused template features in `config/features.json`.
4. Define the first paid workflow.
5. Add the minimum required database tables and server routes.
6. Run template hygiene checks (`npm run template:check`).

Use this prompt to bootstrap your SaaS from the template:

```text
Bootstrap my SaaS from saas-template-next-js-v1.0.

Start by reading PRODUCT.md, ARCHITECTURE.md, and DESIGN.md.
PRODUCT.md defines the target user and the first paid workflow.
ARCHITECTURE.md defines the data model and integration boundaries.
DESIGN.md defines the visual language and component primitives.

Preserve the template boundaries. Do not widen auth, billing, or observability.
Do not add a new data layer, queue, or framework the template does not already use.
Implement only the first paid workflow described in PRODUCT.md.
Run `npm run template:check` before declaring the task done.
```

## Non-Requirements for v1.0

I deliberately kept these out of the starter. Each one has a real cost if you adopt it before the product asks for it.

- **Product-specific business domains**: The template stops at generic SaaS plumbing. Domain models live in the product, where they change weekly. Hardcoding them here freezes opinions that expire inside a sprint.
- **Custom data layers beyond Drizzle**: Drizzle is enough until you have a workload that proves otherwise: heavy analytics, a graph traversal, or a separate search index. A layer added on speculation becomes maintenance tax with no user value.
- **Enterprise SSO or MFA by default**: SAML and OIDC enterprise flows bring metadata dance, IdP debugging, and SCIM provisioning. Ship them when a contract requires it, not so the README looks complete.
- **Active-active multi-region**: This is a year of latency tuning, conflict resolution, and failover rehearsal for a customer base that does not exist yet. Single-region with tested backups wins until traffic and revenue justify the complexity.
- **Event sourcing or microservices**: Both are answers to organizational scale, not startup problems. A well-factored monolith deploys faster, onboards faster, and fails in fewer places. Split when a team boundary forces it.
- **SOC 2 evidence collection automation**: Compliance automation is valuable, but only after you know which controls your auditor will demand. Build evidence around the controls you actually run, not a checklist you downloaded.

A template should make important work easier. It should not become a museum of every idea you once had.

## Keeping the Foundation Boring

A template can easily become a trap. It can force every product into the same shape, carry stale opinions, and hide critical complexity behind defaults you never read.

Question every choice. Keep the foundation boring, and spend the saved attention on the specific value your customers actually pay for.
