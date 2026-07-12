---
title: "Saving tokens with a SaaS template"
date: 2026-06-29T00:00:00+09:00
draft: false
---

How many tokens does "building a SaaS project" cost and how many of those are non-requirements? The parts you need but are not core to the product.

I have asked my trusted codex to build SaaS foundations several times already. Auth, tenant isolation, billing, transactional email, database migrations, structured logging, feature flags and so on. Every new project starts with the same intention, however each time is a different implementation.

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

The rest of this post is the checklist I hand to an agent. Every item is written as a verifiable statement: an item gets checked only when you can point at the code, the config, or the passing test that proves it. "Probably fine" stays unchecked. An item that does not apply gets a written waiver with an owner, a reason, the accepted risk, and a review date.

The rule for an agent walking this list: production ready means every item is either checked with evidence or waived in `PRODUCT.md`. Nothing else counts.

This is a baseline, not a substitute for a threat model or legal advice. The product's data, customers, jurisdictions, and failure modes can add controls that no generic checklist can predict.

### Product definition

- [ ] `PRODUCT.md` names the target user, the pain, and the first paid workflow.
- [ ] `ARCHITECTURE.md` records the data model, the integration boundaries, and the stack profile.
- [ ] `DESIGN.md` defines the visual language and component primitives.
- [ ] The first paid workflow works end to end: signup, do the thing, pay.
- [ ] Every template feature the product does not use is disabled in `config/features.json`.
- [ ] Launch scope, explicit non-goals, success metrics, and the person responsible for each production service are written down.
- [ ] A data-flow diagram and threat model cover trust boundaries, sensitive data, privileged actors, and abuse cases.

### Auth and user lifecycle

"We need auth" usually means login and logout. But it keeps out email verification, session revocation, rate limiting, and password reset flows. When you build multi-tenant software, user management is CRUD plus consequences.

- [ ] Sessions use HttpOnly, Secure, SameSite cookies and explicit CSRF protection on state-changing requests.
- [ ] Passwords use Argon2id with parameters benchmarked on production hardware. Existing bcrypt hashes have a rehash-on-login migration plan. Fast hashes such as MD5 and plain SHA are never used for passwords.
- [ ] Password rules allow password managers, paste, Unicode, and long passphrases. They reject compromised and common values without arbitrary composition rules or forced periodic rotation.
- [ ] Signup, email verification, password reset, and token resend flows work end to end.
- [ ] Login, logout, registration, and reset endpoints exist and are rate limited.
- [ ] Sessions have absolute and idle expiry, and session IDs rotate on privilege change.
- [ ] Session secrets are high entropy, stored hashed server-side when persisted, and invalidated after password reset or account compromise.
- [ ] A revoke-all-sessions path exists and is exposed to the user.
- [ ] Login, reset, and signup return generic responses with materially indistinguishable behavior whether or not the account exists.
- [ ] Brute-force protection combines per-account and per-network throttling without trusting spoofable forwarding headers or allowing an attacker to lock out a victim indefinitely.
- [ ] Owners, administrators, billing users, and support staff use MFA. Passkeys or security keys are preferred; TOTP and single-use hashed recovery codes provide a documented fallback.
- [ ] New and rotated passwords are checked against a breached-password blocklist, using a privacy-preserving lookup when the check is remote.
- [ ] Verification and reset tokens are single-use, expire, and are stored hashed.
- [ ] OAuth and social-login account linking requires proof of control of both accounts or a fresh authenticated session. Matching an email address alone does not link accounts.
- [ ] Account deletion follows a written policy (immediate wipe vs. 30-day soft delete) that covers shared tenant data, historic invoices, and audit logs.

Decisions to record before launch:

- [ ] SSO threshold: which client risk or contract size justifies SAML or hardware keys.
- [ ] Support-assisted recovery: how support verifies identity when a user loses email access.
- [ ] Social login: whether it exists, and the account-linking rule when the same email appears twice.
- [ ] Session length per role: a billing admin versus a read-only viewer, sliding versus absolute caps.
- [ ] Authentication assurance: which roles require passkeys, security keys, TOTP, or only a password, and why.

### Multi-tenancy and isolation

Multi-tenant SaaS needs a **HARD** boundary. If one tenant can read another's data, it means a lawsuit. I use Postgres RLS driven by `app.tenant_id` and `app.user_id` context, set inside the transaction before any read or write.

- [ ] Every tenant-scoped table has RLS enabled and forced, including for the table owner.
- [ ] Application roles cannot bypass RLS. Policies cover reads and writes, and privileged database functions pin a safe `search_path`.
- [ ] The server sets tenant and user context with transaction-local settings before every query, fails closed when context is missing, and proves pooled connections cannot leak context between requests.
- [ ] A test proves a user in tenant A cannot read or write tenant B's rows through any API route.
- [ ] Composite indexes include the tenant identifier so scoped queries stay fast.
- [ ] Unique constraints, foreign keys, joins, caches, object keys, queue messages, and search indexes preserve the tenant boundary.
- [ ] Background jobs establish tenant context from a trusted payload and re-authorize the target resource before changing it.
- [ ] Tenants (the billing entity) and workspaces (the collaboration boundary) are modeled separately.
- [ ] Plan limits (seats, usage, storage) are enforced on the server, not just hidden buttons in the React UI.
- [ ] Tenant deletion is an authorized, resumable job that covers rows, files, caches, search indexes, backups, and external records according to the retention policy.
- [ ] Invitations are signed email invites with a role hierarchy (owner, admin, member, viewer) enforced server-side, never inferred from UI state.
- [ ] Cross-tenant sharing is default-deny. Any sharing is an explicit, audited grant, never an opt-out.
- [ ] Privileged actions append a tenant-scoped audit record with actor, target, reason, and before/after state. Audit access is restricted and tampering is detectable.
- [ ] Tenant creation seeds default config, the first admin, and plan entitlements in one transaction. No half-created tenants.
- [ ] An authorized export job produces a documented, encrypted, short-lived download of the tenant's data. Users should be able to leave.

### Database and migrations

I use Drizzle for typed queries, but SQL migrations stay the source of truth.

- [ ] Migrations that ran in production are immutable. Drift is fixed by shipping a new migration.
- [ ] A migration ledger stores the version and checksum. The runner takes a database lock so only one deploy can migrate at a time. It is idempotent: rerunning it never reapplies a completed migration.
- [ ] Each migration runs in a transaction when the operation and database support it. Non-transactional operations such as PostgreSQL `CREATE INDEX CONCURRENTLY` are isolated, detect and repair partial state such as an invalid index, and are safe to retry.
- [ ] Destructive changes follow expand-and-contract: add compatible schema, deploy compatible code, backfill, switch reads, verify, and remove the old schema in a later release.
- [ ] Large backfills are batched, throttled, observable, idempotent, and resumable from a checkpoint. They do not hold one transaction or table lock for the entire data set.
- [ ] Production DDL has explicit `lock_timeout` and `statement_timeout` values. It fails instead of blocking application traffic indefinitely.
- [ ] Large indexes are built concurrently. Large foreign keys and checks use `NOT VALID` followed by `VALIDATE CONSTRAINT` when PostgreSQL supports it.
- [ ] Constraints enforce invariants in the database: `NOT NULL`, unique keys, foreign keys, and checks exist wherever invalid state must never commit.
- [ ] Migrations run once in the deploy pipeline at the correct point for the expand-and-contract phase, never independently on every application replica.
- [ ] A sanitized production-like snapshot is migrated before release. The review records runtime, locks, table rewrites, query-plan changes, disk headroom, backfill reconciliation, and the recovery path.
- [ ] Rollback safety: each intermediate schema works with both the previous and current application version. Irreversible schema changes have a tested forward-fix plan.
- [ ] Continuous point-in-time recovery is enabled and restore-tested. High-risk migrations take an additional snapshot when the recovery plan calls for one.
- [ ] Connection pooling is configured with limits matched to the database plan.
- [ ] The application role cannot change schema. A separate migration role has only the extra privileges needed by the migration pipeline.
- [ ] Slow-query logging is on, and the hot paths are checked for N+1 queries.
- [ ] A retention policy is written per table: what expires, what persists, what gets anonymized.

### Security baseline

A SaaS needs a security posture before it has customers.

- [ ] Data is classified by sensitivity, collection is minimized, and the threat model maps each class to access, encryption, retention, and deletion controls.
- [ ] No API keys, session tokens, or machine credentials in Git, verified by Gitleaks or an equivalent secret scanner in CI.
- [ ] Secrets are injected through a secret manager, never exposed to preview builds or untrusted CI, and have an owner, expiry or rotation plan, and emergency revocation procedure.
- [ ] Application, database, cloud, and CI identities have separate least-privilege roles. Production access is time-bound and audited.
- [ ] TLS everywhere, HSTS in production.
- [ ] Strict CORS allowlist. No wildcard origins with credentials.
- [ ] CSP headers with nonce support plumbed through Next.js middleware.
- [ ] The remaining headers are set: `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`.
- [ ] Inputs are parsed through schemas at every trust boundary. Database queries are parameterized, output is encoded for its context, and mass-assignment fields are allowlisted.
- [ ] Rate limits and quotas cover auth, writes, exports, uploads, search, and expensive reads. Their behavior during Redis or limiter failure is explicit.
- [ ] Outbound payment and provider mutations use idempotency keys. Incoming webhooks deduplicate stable provider event IDs inside the same transaction as the state change.
- [ ] File uploads enforce byte and tenant quotas, inspect magic bytes rather than trusting MIME headers, randomize object names, scan risky content, reject archives that can exhaust resources, and are served from a non-executable origin.
- [ ] Encryption at rest is enabled for databases, object storage, queues, logs, and backups. Field-level encryption is used when the threat model requires it, with keys separated from ciphertext and a tested rotation path.
- [ ] Dependency scanning gates releases on exploitable high or critical findings. Waivers name the advisory, exposure, mitigation, owner, and expiry date.
- [ ] Container images are scanned with Trivy, Grype, or an equivalent scanner if you ship containers.
- [ ] Sensitive mutations append to a tamper-evident audit log with a retention policy. Secrets and unnecessary personal data never enter it.
- [ ] Admin routes require re-authentication or step-up MFA.
- [ ] Any endpoint that fetches user-supplied URLs validates every redirect and resolved address, blocks private and link-local ranges, limits protocols and response sizes, and uses egress controls to contain SSRF.
- [ ] A monitored security contact and `/.well-known/security.txt` exist, with a vulnerability intake and response process behind them.

### Agent security sweep

Scanners catch the boring failures. The agent still makes the call.

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

- [ ] Webhook signatures are verified against the raw request body with timestamp tolerance, and provider events are durably stored before asynchronous processing.
- [ ] Replayed or out-of-order webhook events cannot double-bill or double-provision. Tested, not assumed.
- [ ] Outbound Stripe mutations use idempotency keys derived from the business operation, not a random value regenerated on each retry.
- [ ] Subscription and entitlement changes use an explicit state machine. Access comes from reconciled provider state, never from a checkout redirect alone.
- [ ] Failed payments map to grace periods and read-only states, not an instant shutoff.
- [ ] Trials have explicit start and end dates, a card-required decision, and an automated dunning schedule with customer emails.
- [ ] Metered usage is recorded durably on the write path, deduplicated, and reconciled against Stripe before invoicing.
- [ ] Plan changes, upgrades, downgrades, refunds, credits, chargebacks, cancellations, and reactivation have defined and tested entitlement behavior.
- [ ] Tax collection, invoice fields, and merchant-of-record responsibility are reviewed for the jurisdictions served. Stripe Tax or another qualified provider calculates tax where applicable.
- [ ] A Stripe test-clock run covers the full lifecycle: trial, convert, payment failure, dunning, cancel.
- [ ] Invoices carry the legal fields your jurisdictions require: company name, address, tax ID.
- [ ] Hosted payment pages or tokenized fields keep card data out of application logs and databases. The resulting PCI scope is documented.
- [ ] Price and product identifiers are environment-specific config, and a reconciliation job detects drift between Stripe and local entitlements.

### Transactional email

The template hooks up Resend. In development, sends are captured locally to avoid spamming real addresses.

- [ ] SPF, DKIM, and DMARC records exist and verify.
- [ ] DMARC reports are monitored and the policy progresses toward enforcement after legitimate senders align.
- [ ] Transactional mail runs on a separate subdomain from marketing campaigns to protect sender reputation.
- [ ] Bounce and complaint webhooks feed a suppression list. Sending to a known complainer tanks deliverability for everyone.
- [ ] Marketing and other subscription mail carries one-click `List-Unsubscribe` and a working opt-out. Security and transactional mail is not mislabeled as marketing.
- [ ] Templates compile to portable HTML with a meaningful plaintext alternative.
- [ ] Every auth email (verify, reset, invite) has been sent and opened on staging, links included.
- [ ] Email contains no secrets or sensitive account data beyond the minimum. Links expire, are single-use where appropriate, and bind to the intended action.
- [ ] Email sends have a stable message key so retries do not send duplicate invoices, alerts, or lifecycle messages.

### Background jobs and scheduled work

- [ ] The job queue retries with backoff, and failures land in a dead-letter state someone can see.
- [ ] Jobs are idempotent or guarded, so a retry cannot apply twice.
- [ ] A transactional outbox or equivalent closes the gap between committing database state and publishing the job or event.
- [ ] Workers use leases or visibility timeouts with heartbeats. A crashed worker cannot leave a job permanently stuck or let two workers apply it concurrently.
- [ ] Retry limits distinguish transient from permanent failures, include jitter, and preserve enough context to diagnose and safely replay dead-lettered work.
- [ ] Scheduled jobs are monitored: a missed run raises an alert.
- [ ] Scheduled jobs define overlap, timezone, daylight-saving, and catch-up behavior.
- [ ] Long jobs checkpoint or chunk and respond to cancellation so a deploy does not lose work in flight.

### API behavior

- [ ] Errors return one consistent shape with a machine-readable code. Stack traces never leak to clients.
- [ ] Every request gets a correlation ID that reaches logs, traces, jobs, and downstream calls without trusting a client-supplied value blindly.
- [ ] Every list endpoint has a maximum page size and stable pagination. No unbounded queries.
- [ ] Mutations validate ownership (tenant, resource) server-side, never from the client payload.
- [ ] Concurrent mutations use database constraints, transactions, or optimistic concurrency so stale clients cannot silently overwrite state.
- [ ] Request bodies, query complexity, response sizes, and execution time have explicit limits.
- [ ] Every outbound call has an explicit timeout. Retries use backoff and jitter, honor provider limits, and occur only when the operation is safe to retry.
- [ ] Public APIs have a versioning and deprecation policy. Breaking changes have a measured migration window.
- [ ] Cache keys include tenant and authorization context, private responses are never cached publicly, and invalidation behavior is tested.
- [ ] 429 responses include `Retry-After`.

### Testing

If it passes only on your laptop, it does not pass.

- [ ] Unit tests cover the business logic and pure functions.
- [ ] Integration tests run against real Postgres with RLS on, and real Redis. Mocking the data layer hides the exact bugs RLS exists to catch.
- [ ] An isolation suite proves cross-tenant denial for every tenant-scoped table.
- [ ] End-to-end tests cover the money paths: signup, login, the first paid workflow, checkout, cancel.
- [ ] Webhook handlers are tested with replayed, duplicated, and out-of-order events.
- [ ] Migration tests cover a fresh database, every supported upgrade path, a recent production-like snapshot, retry after injected failure, and compatibility with the previous app version.
- [ ] Concurrency tests cover duplicate requests, simultaneous updates, queue redelivery, and conflicting billing or entitlement changes.
- [ ] Auth edge cases are tested: expired session, revoked session, CSRF failure, throttled login.
- [ ] Email flows are asserted against the local capture, including link targets.
- [ ] A load test records baseline p95 latency and the max sustainable request rate on the hot paths.
- [ ] Failure injection: the app degrades sanely when Redis, S3, Stripe, or email is down. Tested, not assumed.
- [ ] Contract tests detect incompatible changes at API, event, webhook, and provider boundaries.
- [ ] Backup restore and disaster-recovery exercises run the application test suite against the recovered environment.
- [ ] The whole suite passes in CI, not just on a laptop.

### CI/CD

- [ ] Lint, typecheck, unit tests, and build run on every PR.
- [ ] Integration and end-to-end suites run on every PR, or at minimum before every deploy.
- [ ] Applicable UI and integration changes get an isolated preview deploy with synthetic data and no production credentials.
- [ ] Secret scanning, dependency audit, Semgrep, and Trivy run in the pipeline, with severity gates documented.
- [ ] Workflow and IaC scanners run when `.github/workflows`, Dockerfiles, Terraform, or Kubernetes manifests change.
- [ ] Protected branches require passing checks and review. Production environments require explicit authorization from someone other than the change author when the risk warrants it.
- [ ] CI jobs use minimal token permissions, pin third-party actions by full commit SHA, and use short-lived OIDC credentials instead of stored cloud keys.
- [ ] Dependency installation is reproducible from the committed lockfile. Install scripts and dependency changes from untrusted pull requests cannot access secrets.
- [ ] The pipeline is the normal path to production. Any break-glass deploy is time-bound, audited, followed by reconciliation, and never runs from an unmanaged laptop.
- [ ] The exact tested artifact is promoted between environments. It is immutable, tagged with the commit SHA, and accompanied by an SBOM and provenance attestation.
- [ ] `npm run template:check` passes.

### Deployment and release

- [ ] Deploys are zero-downtime: rolling or blue-green, health-checked before traffic shifts.
- [ ] Risky releases use a canary, staged rollout, or equivalent blast-radius limit with automatic or operator-approved promotion criteria.
- [ ] Rollback restores the previous application artifact in minutes. Database rollback uses compatible schema or a tested forward fix, not an unsafe down migration.
- [ ] Feature flags gate risky changes. Each flag has an owner, safe default, expiry date, and cleanup task.
- [ ] Every deploy records SHA, time, and deployer, and posts somewhere humans read.
- [ ] Post-deploy smoke tests verify readiness, login, the first paid workflow, jobs, and critical provider callbacks before the release is marked complete.
- [ ] Staging runs the same migrations, env validation, and services as production.
- [ ] Environment variables are validated at startup. A missing variable means immediate exit with a clear error.
- [ ] Dev, staging, and production have separate credentials and share nothing.

### Infrastructure

- [ ] Infrastructure is reproducible: IaC, or at minimum a setup script that has been run from scratch.
- [ ] Infrastructure drift is detected, reviewed, and reconciled through the same change path as code.
- [ ] TLS certificates auto-renew and expiry is monitored.
- [ ] Domain registration, DNS, certificate, and CDN accounts use MFA, least privilege, renewal alerts, and a documented recovery owner.
- [ ] Static assets go through a CDN with cache headers set deliberately.
- [ ] Databases, queues, and internal services are private. Object storage blocks public access unless a specific asset is deliberately published through a controlled origin or CDN.
- [ ] Network ingress and egress are allowlisted where practical. Metadata services and cloud control planes are not reachable from untrusted workloads without controls.
- [ ] Resource requests, limits, autoscaling bounds, database capacity, and provider quotas are sized from load tests for expected peak traffic plus written headroom.
- [ ] Liveness and readiness probes are separate. Liveness says the process is up; readiness says it can serve traffic, including after a dependency recovers.
- [ ] SIGTERM drains in-flight requests and closes the database pool before the container exits. Hard kills drop user work.
- [ ] Base images, runtimes, databases, and managed services have patch and end-of-life owners. Unsupported versions cannot drift into production unnoticed.

### Observability

- [ ] Structured JSON logs include correlation and pseudonymous tenant context where safe. Raw email addresses and other direct identifiers are avoided.
- [ ] Logs, metrics, and traces propagate correlation across HTTP, jobs, and provider calls. Telemetry export failure does not take down the application.
- [ ] A scrubber test asserts that passwords, tokens, card numbers, request bodies, and sensitive query parameters never appear in telemetry.
- [ ] Error tracking captures exceptions with release and commit SHA attached. A stack trace without a release is a dead end.
- [ ] Dedicated dashboards trace webhook and queue latency and retry rates.
- [ ] One dashboard shows the golden signals: latency, traffic, errors, saturation.
- [ ] Metric labels and trace attributes have bounded cardinality. Tenant IDs and user IDs do not become unbounded metric dimensions.
- [ ] Trace sampling is written down and preserves errors and slow requests while keeping cost bounded.
- [ ] Telemetry retention, access, redaction, and deletion follow the data policy. Audit logs remain separate from debug logs.
- [ ] The telemetry pipeline is monitored for dropped spans, rejected metrics, delayed logs, and quota exhaustion.
- [ ] Product events (signup, activation, checkout) are captured so you can tell whether anyone uses the thing.

### Alerting and incident response

- [ ] Every page routes to a human and a rotation. An alert without an owner gets ignored until it has one, and that is how outages compound.
- [ ] Every alert links to a runbook: what it means and the first three commands to run.
- [ ] SLOs exist for the money paths (login, checkout, first workflow) and alerts fire on burn rate, not point failures.
- [ ] Paging alerts are actionable, tested, deduplicated, and reviewed for noise. Non-urgent conditions become tickets or dashboards.
- [ ] Uptime checks run from outside your own infrastructure.
- [ ] A public status page exists, and someone knows how to post to it. It sets expectations and absorbs support load while you are fixing the thing.
- [ ] The incident process is written: severity levels, incident command, evidence preservation, customer communication, breach notification, and where the postmortem lands.
- [ ] Incident exercises cover an account takeover, tenant data exposure, provider outage, bad deploy, and database recovery.

### Backups and disaster recovery

- [ ] Database backups provide point-in-time recovery, are encrypted, monitored, and retained on a schedule that meets the written RPO. A read replica is not counted as a backup.
- [ ] A restore drill has been performed into a fresh database with the test suite run against it. On a calendar, not only before a migration. A backup you have never restored is a rumor.
- [ ] User files in object storage are versioned or backed up.
- [ ] RPO and RTO are written down, and the backup schedule actually meets them.
- [ ] Backups live in a separate failure domain, with a separate account or region where the risk requires it. Production compromise cannot delete every recovery point.
- [ ] Backup retention honors legal holds and deletion obligations, including a documented path for data that ages out of immutable backups.
- [ ] Failover and restore procedures include DNS, certificates, queues, object storage, scheduled jobs, and reconciliation of work accepted near the failure.
- [ ] Secrets and infrastructure config are recoverable if the primary account is lost.

### Support and admin

Support is part of the product. If your engineers have to run raw SQL queries to reset a user's MFA or override a plan limit, you aren't ready for production.

- [ ] Admin tools cover scoped, audited tenant search and plan overrides.
- [ ] Support can reset MFA, resend verification, and adjust seats through the admin UI, with audit records.
- [ ] Support roles are least-privilege and time-bound. Sensitive actions require a reason and fresh authentication; high-risk billing or access changes require a second person when appropriate.
- [ ] Impersonation is disabled unless the product needs it. When enabled, it is time-bound, reason-gated, clearly visible, unable to reveal secrets, logged, and disclosed to the customer.
- [ ] A tested break-glass path restores administrative access without bypassing audit or becoming a permanent backdoor.
- [ ] A support inbox exists and routes to a human.
- [ ] Abuse, fraud, privacy, and security reports have separate escalation paths and response targets.

### UX baseline

- [ ] Empty states, loading screens, and 404/500 error boundaries exist.
- [ ] Core flows work with keyboard navigation and semantic HTML.
- [ ] Settings and main dashboards render on mobile.
- [ ] Forms have inline validation, accessible errors bound to inputs, and clear pending states. The server remains idempotent when a submit is repeated.
- [ ] Loading feedback matches the wait, avoids layout shifts, and preserves user input. Optimistic updates roll back or reconcile visibly on error.
- [ ] Core flows meet WCAG 2.2 AA through automated checks and manual keyboard, screen-reader, zoom, contrast, and reduced-motion testing.
- [ ] Dates, times, currencies, numbers, and billing periods are correct for supported locales and timezones.
- [ ] Destructive and irreversible actions explain their scope, require deliberate confirmation, and offer recovery where possible.

### Legal and compliance

- [ ] Privacy policy and terms of service are published and linked from signup.
- [ ] Acceptance records the policy version and time. Material changes have a notification and re-consent rule.
- [ ] The data inventory records purpose, legal basis, location, retention, owner, subprocessors, and cross-border transfers for each class of personal data.
- [ ] Cookie consent exists where required, defaults to necessary storage only, and withdrawing consent is as easy as granting it.
- [ ] Data-subject requests cover access, correction, export, deletion, restriction, and objection where applicable, with identity verification and response deadlines.
- [ ] A DPA, subprocessor list, transfer mechanism, and change-notification process are ready for business customers.
- [ ] The data residency decision is recorded, even if the answer is "single region."
- [ ] Sector and audience decisions are explicit: minors, health, finance, education, biometrics, and other regulated data are either supported with the required controls or prohibited.
- [ ] Open-source licenses, notices, trademarks, and third-party asset rights are reviewed before release.

### Vendors and dependencies

- [ ] Every critical vendor has an owner, data classification, least-privilege credentials, outage behavior, rate and quota limits, status-page link, and escalation path.
- [ ] Critical vendor failure modes are tested. The product queues, degrades, or fails clearly instead of losing accepted work.
- [ ] Vendor contracts and DPAs cover the data they receive. Unused integrations and credentials are removed.
- [ ] A vendor exit plan covers data export, credential revocation, DNS or webhook cutover, and the code path that must change.
- [ ] Direct and transitive dependencies have an update cadence, end-of-life policy, and owner. Abandoned packages are replaced before they become an emergency.

### Performance and cost

- [ ] Performance budgets exist for page load, API latency, database queries, queue delay, and job completion on the first paid workflow.
- [ ] Query plans and indexes are reviewed with production-shaped data. Indexes include tenant scope and unused indexes are measured before removal.
- [ ] Caches have explicit keys, TTLs, invalidation, stampede protection, size limits, and a correctness test for stale data.
- [ ] Tenant quotas and abuse limits bound database rows, storage, exports, jobs, email, and provider spend.
- [ ] Cloud, database, telemetry, email, and payment costs have budgets and anomaly alerts. A single tenant cannot create an unbounded bill unnoticed.
- [ ] Storage lifecycle rules expire temporary uploads, exports, logs, and abandoned multipart uploads according to retention policy.

### Documentation

- [ ] The README gets a new contributor from clone to a running app with seed data in minutes: one command loads demo tenants, users, and plans.
- [ ] Runbooks exist for the top failure modes.
- [ ] Architecture decisions are recorded, even at one paragraph each.
- [ ] Support staff have docs for the admin tools.
- [ ] API, event, webhook, and migration contracts are versioned and documented next to the code.
- [ ] On-call access, break-glass steps, restore commands, provider dashboards, and escalation contacts are tested by someone other than the author.
- [ ] Documentation names an owner and review trigger. A runbook that no longer matches production is a failure mode.

### The launch gate

Before pointing DNS at it:

- [ ] Every item above is checked with evidence or waived with a reason in `PRODUCT.md`.
- [ ] A restore drill and a rollback have both been executed within the last month.
- [ ] The pager routes to a person who is awake this week.
- [ ] The load test passed at expected launch traffic plus headroom.
- [ ] The threat model and security review have no unresolved critical finding. Every accepted risk has an owner and expiry date.
- [ ] Legal, privacy, billing, support, and incident owners approved the parts they operate.
- [ ] A production smoke test, synthetic transaction, backup alert, certificate alert, and provider webhook have each produced evidence in the real environment.

## AI Token Hygiene

This is the economics part. Every prompt spent rebuilding foundations is a prompt not spent on the product.

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

I deliberately kept these out of the starter. Each one costs you if you adopt it before the product asks for it.

- **Product-specific business domains**: The template stops at SaaS plumbing. Domain models change weekly and belong in the product. Hardcoding them here locks in opinions you outgrow fast.
- **Custom data layers beyond Drizzle**: Drizzle is enough until a workload proves otherwise. Heavy analytics or a separate search index would justify a new layer. Adding one on speculation is maintenance you pay for with no feature in return.
- **Enterprise SSO and SCIM by default**: SAML and OIDC bring IdP debugging and provisioning edge cases. Ship them when a contract requires it. Privileged accounts still use MFA from day one.
- **Active-active multi-region**: This buys you a year of failover work for customers you do not have. Single-region with tested backups is the right answer until traffic and revenue say otherwise.
- **Event sourcing or microservices**: These solve organizational scale, and a startup does not have that problem. A well-factored monolith deploys faster and fails in fewer places. Split when a team boundary forces it.
- **SOC 2 evidence collection automation**: Worth doing once you know which controls your auditor will demand. Build evidence around the controls you run.

A template should make the real work easier. Everything else is overhead.

## Keeping the Foundation Boring

A template can become a trap. It pushes every product into the same shape and hides complexity behind defaults you never read.

Question every choice. Keep the foundation boring, and spend the saved attention on the product.
