---
title: "Saving tokens with a SaaS template"
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

## The production-readiness checklist

The rest of this post is the checklist I hand to an agent. Every item is written as a verifiable statement: an item gets checked only when you can point at the code, the config, or the passing test that proves it. "Probably fine" stays unchecked. An item that does not apply gets a written waiver with a reason, not a silent skip.

The rule for an agent walking this list: production ready means every item is either checked with evidence or waived in `PRODUCT.md`. Nothing else counts.

### Product definition

- [ ] `PRODUCT.md` names the target user, the pain, and the first paid workflow.
- [ ] `ARCHITECTURE.md` records the data model, the integration boundaries, and the stack profile.
- [ ] `DESIGN.md` defines the visual language and component primitives.
- [ ] The first paid workflow works end to end: signup, do the thing, pay.
- [ ] Every template feature the product does not use is disabled in `config/features.json`.

### Auth and user lifecycle

"We need auth" usually means login and logout. But it keeps out email verification, session revocation, rate limiting, and password reset flows. When you build multi-tenant software, user management is CRUD plus consequences.

- [ ] Sessions are HttpOnly, Secure, SameSite cookies with CSRF protection.
- [ ] Passwords hash with Argon2id and tuned parameters. No bcrypt, no MD5, no plain SHA.
- [ ] Signup, email verification, password reset, and token resend flows work end to end.
- [ ] Login, logout, registration, and reset endpoints exist and are rate limited.
- [ ] Sessions have absolute and idle expiry, and session IDs rotate on privilege change.
- [ ] A revoke-all-sessions path exists and is exposed to the user.
- [ ] Login, reset, and signup return identical messages and timing whether or not the account exists, so an attacker cannot probe which emails are registered.
- [ ] Brute-force throttling applies per account and per IP, before the password is ever read.
- [ ] MFA: TOTP enrollment, hashed recovery codes, and scratch codes for the moment a device is lost.
- [ ] New and rotated passwords are checked against Have I Been Pwned with k-anonymity lookups.
- [ ] Verification and reset tokens are single-use, expire, and are stored hashed.
- [ ] Account deletion follows a written policy (immediate wipe vs. 30-day soft delete) that covers shared tenant data, historic invoices, and audit logs.

Decisions to record before launch:

- [ ] SSO threshold: which client risk or contract size justifies SAML or hardware keys.
- [ ] Support-assisted recovery: how support verifies identity when a user loses email access.
- [ ] Social login: whether it exists, and the account-linking rule when the same email appears twice.
- [ ] Session length per role: a billing admin versus a read-only viewer, sliding versus absolute caps.

### Multi-tenancy and isolation

Multi-tenant SaaS needs a **HARD** boundary. If one tenant can read another's data, it means a lawsuit. I use Postgres RLS driven by `app.tenant_id` and `app.user_id` context, set inside the transaction before any read or write.

- [ ] Every tenant-scoped table has RLS enabled and forced, including for the table owner.
- [ ] The server sets tenant and user context inside the transaction before every query.
- [ ] A test proves a user in tenant A cannot read or write tenant B's rows through any API route.
- [ ] Composite indexes include the tenant identifier so scoped queries stay fast.
- [ ] Tenants (the billing entity) and workspaces (the collaboration boundary) are modeled separately.
- [ ] Plan limits (seats, usage, storage) are enforced on the server, not just hidden buttons in the React UI.
- [ ] Tenant deletion cascades through rows, files, and external records without hitting resource timeouts.
- [ ] Invitations are signed email invites with a role hierarchy (owner, admin, member, viewer) enforced server-side, never inferred from UI state.
- [ ] Cross-tenant sharing is default-deny. Any sharing is an explicit, audited grant, never an opt-out.
- [ ] Privileged actions append a tenant-scoped audit record with actor, target, and before/after state.
- [ ] Tenant creation seeds default config, the first admin, and plan entitlements in one transaction. No half-created tenants.
- [ ] A signed export job dumps tenant data as CSV or JSON on demand. Users should be able to leave.

### Database and migrations

I use Drizzle for typed queries, but SQL migrations stay the source of truth.

- [ ] Migrations that ran in production are immutable. Drift is fixed by shipping a new migration.
- [ ] Destructive changes follow expand-and-contract: add the column, backfill, deploy the reads, then drop. Forward-only, always.
- [ ] Migrations run in the deploy pipeline before new code serves traffic.
- [ ] A database backup runs automatically before every production migration.
- [ ] Rollback safety: the current schema still works with the previous app version.
- [ ] Connection pooling is configured with limits matched to the database plan.
- [ ] Slow-query logging is on, and the hot paths are checked for N+1 queries.
- [ ] A retention policy is written per table: what expires, what persists, what gets anonymized.

### Security baseline

A SaaS needs a security posture before it has customers.

- [ ] No API keys, session tokens, or machine credentials in Git, verified by Gitleaks or an equivalent secret scanner in CI.
- [ ] Secrets are injected through the environment or a secret manager, and rotation is documented for each one.
- [ ] TLS everywhere, HSTS in production.
- [ ] Strict CORS allowlist. No wildcard origins with credentials.
- [ ] CSP headers with nonce support plumbed through Next.js middleware.
- [ ] The remaining headers are set: `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`.
- [ ] Every input is parsed through a schema (zod) at the edge. Handlers never see unvalidated data.
- [ ] Rate limits cover auth routes and resource-creation endpoints.
- [ ] Idempotency keys are required for webhook handlers and payment processing.
- [ ] File uploads have size limits and content-type validation, and are served from an origin that never executes them.
- [ ] Encryption at rest: encrypted volumes, S3 SSE, field-level encryption for identifiers like email or tax IDs.
- [ ] Dependency scanning fails CI on high-severity advisories from `npm audit` and `osv-scanner`, with waivers tied to a CVE, version, and expiry date. Known-CVE code does not ship.
- [ ] Container images are scanned with Trivy, Grype, or an equivalent scanner if you ship containers.
- [ ] Sensitive mutations append to an append-only audit table. You need it the first time a customer asks "who changed this."
- [ ] Admin routes require re-authentication or step-up MFA.
- [ ] Any endpoint that fetches user-supplied URLs (webhooks, imports) is guarded against SSRF.

### Agent security sweep

Automated scanners catch the boring failures. The agent still owns the verdict.

- [ ] Semgrep runs against application code with security rules enabled. Every high-confidence finding is fixed or waived with a code pointer.
- [ ] Trivy scans the filesystem for vulnerabilities, secrets, and misconfiguration. If the project ships containers, the built image is scanned before release.
- [ ] Dependency scanning runs with `osv-scanner` and the package manager audit. Lockfile changes include scanner output in the PR notes.
- [ ] Secret scanning runs on the full repository history with Gitleaks or an equivalent tool when the agent first takes over the repo.
- [ ] IaC and deployment config are scanned with `trivy config`, Checkov, tfsec, or the repo's chosen equivalent.
- [ ] GitHub Actions are checked with zizmor or an equivalent workflow scanner for token permissions, unpinned actions, script injection, and unsafe pull request triggers.
- [ ] The agent performs a manual pass for auth, tenant isolation, IDOR, SSRF, webhook replay, file uploads, and payment state changes. Scanner output is input, not the final answer.
- [ ] `SECURITY_REVIEW.md` records commands, tool versions, findings, links to fixes, and links to any `PRODUCT.md` waivers.

### Billing

Stripe handles checkout redirects, billing portal sessions, and signed webhooks.

- [ ] Webhook signatures are verified, and provider events are stored in an event log before processing.
- [ ] Replayed or out-of-order webhook events cannot double-bill or double-provision. Tested, not assumed.
- [ ] Failed payments map to grace periods and read-only states, not an instant shutoff.
- [ ] Trials have explicit start and end dates, a card-required decision, and an automated dunning schedule with customer emails.
- [ ] Metered usage is recorded on the write path and reconciled nightly. Invoicing at request time is how you underbill.
- [ ] Plan changes prorate. Stripe Tax handles VAT and GST so you do not build a tax engine you do not understand.
- [ ] A Stripe test-clock run covers the full lifecycle: trial, convert, payment failure, dunning, cancel.
- [ ] Invoices carry the legal fields your jurisdictions require: company name, address, tax ID.

### Transactional email

The template hooks up Resend. In development, sends are captured locally to avoid spamming real addresses.

- [ ] SPF, DKIM, and DMARC records exist and verify.
- [ ] Transactional mail runs on a separate subdomain from marketing campaigns to protect sender reputation.
- [ ] Bounce and complaint webhooks feed a suppression list. Sending to a known complainer tanks deliverability for everyone.
- [ ] Bulk mail carries a one-click `List-Unsubscribe` header and a working opt-out link.
- [ ] Templates compile to inline-CSS HTML with a plaintext alternative. Plaintext is not optional for deliverability.
- [ ] Every auth email (verify, reset, invite) has been sent and opened on staging, links included.

### Background jobs and scheduled work

- [ ] The job queue retries with backoff, and failures land in a dead-letter state someone can see.
- [ ] Jobs are idempotent or guarded, so a retry cannot apply twice.
- [ ] Scheduled jobs are monitored: a missed run raises an alert.
- [ ] Long jobs checkpoint or chunk so a deploy does not lose work in flight.

### API behavior

- [ ] Errors return one consistent shape with a machine-readable code. Stack traces never leak to clients.
- [ ] Every list endpoint paginates. No unbounded queries.
- [ ] Mutations validate ownership (tenant, resource) server-side, never from the client payload.
- [ ] Every outbound call (Stripe, Resend, S3) has an explicit timeout. No default-infinite waits.
- [ ] 429 responses include `Retry-After`.

### Testing

This is where "it works on my machine" goes to die.

- [ ] Unit tests cover the business logic and pure functions.
- [ ] Integration tests run against real Postgres with RLS on, and real Redis. Mocking the data layer hides the exact bugs RLS exists to catch.
- [ ] An isolation suite proves cross-tenant denial for every tenant-scoped table.
- [ ] End-to-end tests cover the money paths: signup, login, the first paid workflow, checkout, cancel.
- [ ] Webhook handlers are tested with replayed, duplicated, and out-of-order events.
- [ ] Migration tests: a fresh database migrates from zero, and a copy of the production schema migrates forward.
- [ ] Auth edge cases are tested: expired session, revoked session, CSRF failure, throttled login.
- [ ] Email flows are asserted against the local capture, including link targets.
- [ ] A load test records baseline p95 latency and the max sustainable request rate on the hot paths.
- [ ] Failure injection: the app degrades sanely when Redis, S3, Stripe, or email is down. Tested, not assumed.
- [ ] The whole suite passes in CI, not just on a laptop.

### CI/CD

- [ ] Lint, typecheck, unit tests, and build run on every PR.
- [ ] Integration and end-to-end suites run on every PR, or at minimum before every deploy.
- [ ] Every PR gets a preview deploy so reviewers see the change running.
- [ ] Secret scanning, dependency audit, Semgrep, and Trivy run in the pipeline, with severity gates documented.
- [ ] Workflow and IaC scanners run when `.github/workflows`, Dockerfiles, Terraform, or Kubernetes manifests change.
- [ ] The pipeline is the only path to production. No manual deploys from laptops.
- [ ] Build artifacts are immutable and tagged with the commit SHA.
- [ ] `npm run template:check` passes.

### Deployment and release

- [ ] Deploys are zero-downtime: rolling or blue-green, health-checked before traffic shifts.
- [ ] Rollback restores the previous version in minutes, and the procedure has been executed at least once, not just written down.
- [ ] Feature flags gate risky changes. Flipping a flag does not require a deploy.
- [ ] Every deploy records SHA, time, and deployer, and posts somewhere humans read.
- [ ] Staging runs the same migrations, env validation, and services as production.
- [ ] Environment variables are validated at startup. A missing variable means immediate exit with a clear error.
- [ ] Dev, staging, and production have separate credentials and share nothing.

### Infrastructure

- [ ] Infrastructure is reproducible: IaC, or at minimum a setup script that has been run from scratch.
- [ ] TLS certificates auto-renew and expiry is monitored.
- [ ] Static assets go through a CDN with cache headers set deliberately.
- [ ] The database and object store are not reachable from the public internet.
- [ ] Capacity headroom for 10x current traffic is either automatic (autoscaling) or documented.
- [ ] Liveness and readiness probes are separate. Liveness says the process is up; readiness says it can serve traffic, including after a dependency recovers.
- [ ] SIGTERM drains in-flight requests and closes the database pool before the container exits. Hard kills drop user work.

### Observability

- [ ] Structured JSON logs include `tenant_id` and `user_id` context where safe.
- [ ] OTLP metrics and traces export, toggled via feature flags.
- [ ] A scrubber test asserts that passwords, tokens, and card numbers never appear in logs.
- [ ] Error tracking captures exceptions with release and commit SHA attached. A stack trace without a release is a dead end.
- [ ] Dedicated dashboards trace webhook and queue latency and retry rates.
- [ ] One dashboard shows the golden signals: latency, traffic, errors, saturation.
- [ ] Trace sampling: head sampling for the common path, tail sampling for errors and slow spans, so traces stay affordable as traffic grows.
- [ ] Product events (signup, activation, checkout) are captured so you can tell whether anyone uses the thing.

### Alerting and incident response

- [ ] Every page routes to a human and a rotation. An alert without an owner gets ignored until it has one, and that is how outages compound.
- [ ] Every alert links to a runbook: what it means and the first three commands to run.
- [ ] SLOs exist for the money paths (login, checkout, first workflow) and alerts fire on burn rate, not point failures.
- [ ] Uptime checks run from outside your own infrastructure.
- [ ] A public status page exists, and someone knows how to post to it. It sets expectations and absorbs support load while you are fixing the thing.
- [ ] The incident process is written: severity levels, who communicates, where the postmortem lands.

### Backups and disaster recovery

- [ ] Database backups run on a schedule, plus before every migration.
- [ ] A restore drill has been performed into a fresh database with the test suite run against it. On a calendar, not only before a migration. A backup you have never restored is a rumor.
- [ ] User files in object storage are versioned or backed up.
- [ ] RPO and RTO are written down, and the backup schedule actually meets them.
- [ ] Backups live in a separate account or region from production.
- [ ] Secrets and infrastructure config are recoverable if the primary account is lost.

### Support and admin

Support is part of the product. If your engineers have to run raw SQL queries to reset a user's MFA or override a plan limit, you aren't ready for production.

- [ ] Admin tools cover scoped, audited tenant search and plan overrides.
- [ ] Support can reset MFA, resend verification, and adjust seats through the admin UI, with audit records.
- [ ] Impersonation is time-bound, logged, and triggers a notification to the user.
- [ ] A support inbox exists and routes to a human.

### UX baseline

- [ ] Empty states, loading screens, and 404/500 error boundaries exist.
- [ ] Core flows work with keyboard navigation and semantic HTML.
- [ ] Settings and main dashboards render on mobile.
- [ ] Forms have inline validation, accessible errors bound to inputs, and submit states that block double-submits.
- [ ] Skeletons cover first paint, and optimistic updates roll back on error. The interface should not freeze while it waits on the server.
- [ ] Core flows pass an automated accessibility check (axe or equivalent) with no critical violations.

### Legal and compliance

- [ ] Privacy policy and terms of service are published and linked from signup.
- [ ] Cookie consent exists where your jurisdictions require it.
- [ ] GDPR basics: export on demand (covered above), deletion on request, and a subprocessor list.
- [ ] A DPA is ready if you sell to companies that will ask for one.
- [ ] The data residency decision is recorded, even if the answer is "single region."
- [ ] A monitored security contact exists (`security.txt`).

### Documentation

- [ ] The README gets a new contributor from clone to a running app with seed data in minutes: one command loads demo tenants, users, and plans.
- [ ] Runbooks exist for the top failure modes.
- [ ] Architecture decisions are recorded, even at one paragraph each.
- [ ] Support staff have docs for the admin tools.

### The launch gate

Before pointing DNS at it:

- [ ] Every item above is checked with evidence or waived with a reason in `PRODUCT.md`.
- [ ] A restore drill and a rollback have both been executed within the last month.
- [ ] The pager routes to a person who is awake this week.
- [ ] The load test passed at expected launch traffic plus headroom.

## AI Token Hygiene

This is the economics part. I want to spend prompts on the product, not on rebuilding foundations.

The workflow with an LLM agent looks like this:
1. Select the stack profile (`next-postgres` or `cloudflare-workers-d1`).
2. Fill out `PRODUCT.md`, `ARCHITECTURE.md`, and `DESIGN.md`.
3. Disable unused template features in `config/features.json`.
4. Define the first paid workflow.
5. Add the minimum required database tables and server routes.
6. Walk the production-readiness checklist and check items with evidence, or record waivers.
7. Run the agent security sweep and write `SECURITY_REVIEW.md`.
8. Run template hygiene checks (`npm run template:check`).

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

Then walk the production-readiness checklist top to bottom. Mark an item
done only when you can point to the code, config, or passing test that
proves it. If an item does not apply, record a waiver with a reason in
PRODUCT.md. The project is not production ready while any item is neither
checked nor waived.

Run the security sweep before declaring the task done: Semgrep for code,
Trivy for filesystem, IaC, and container images, `osv-scanner` plus the
package manager audit for dependencies, Gitleaks or equivalent for secrets,
and zizmor, Checkov, or tfsec where the repo uses workflows or IaC.
Fix findings or record waivers in PRODUCT.md, and summarize commands and
tool versions in SECURITY_REVIEW.md.

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
