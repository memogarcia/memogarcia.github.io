---
title: "DataVault: Personal data infrastructure for AI agents"
date: 2026-11-13T16:51:00+09:00
draft: true
---

> (or get paid to access your data)

As AI agents become more capable, doing useful personal work requires access to sensitive context: financial records, employment history, medical information, emails, and purchases.

Today, that information is fragmented across multiple platforms. Giving an agent access often means trusting an individual AI provider with broad permissions.

DataVault is an idea for an independent permission and data-access layer between individuals and AI agents. Users store their personal information in a local-first encrypted vault and grant agents temporary, narrowly scoped access for specific tasks.

When intelligence becomes abundant, trusted access to personal context becomes increasingly valuable.

[Better Me](/posts/i-built-the-app-of-my-dreams/) is already one data vault implementation. It keeps papers, medicines, and Apple Health readings encrypted on my iPhone, with no account, no cloud sync, and no external AI. When I prepare a report, I choose the dates and sections the doctor sees. DataVault extends that local-first model beyond health records, replacing manual report sharing with scoped, time-limited permissions for AI agents.

## How it works

1. **Private data storage.** Users maintain an encrypted personal data vault, stored locally or in user-controlled infrastructure.
2. **Agent requests.** An AI agent requests access to specific information needed to complete a task.
3. **Granular authorization.** The user approves exactly which information can be accessed, for what purpose, and for how long.
4. **Controlled execution.** The agent receives restricted access or task-specific results without necessarily obtaining the underlying raw data.
5. **Audit trail.** Users can inspect which agents accessed which information and when.
6. **Revocation.** Users can revoke future access at any time, though previously disclosed information cannot necessarily be retrieved.

## Example: finding car insurance

Suppose a user asks an AI agent to find better car insurance.

Instead of sharing their entire financial profile, the user authorizes access only to:

- Vehicle registration details
- Relevant driving history
- Approximate location
- A limited 24-hour access window

The agent uses those permitted fields to compare insurance offers without holding unrestricted access to the user's personal records.

## Potential business model

### Phase 1: Consumer product

Start with a privacy-focused subscription, roughly $5 to $15/month. It covers encrypted personal data storage, scoped permissions for AI agents, access logs, revocation controls, and integrations with popular agent platforms.

### Phase 2: Developer infrastructure

Offer an API and SDK so AI application developers can request user-authorized data access. Potential revenue comes from developer subscriptions, API usage, or managed secure execution.

### Phase 3: Consented data marketplace

This is where getting paid for your data comes in. Users could optionally permit approved computations over selected personal data. Companies would pay for aggregated insights or permitted queries rather than unrestricted access to raw datasets. Users receive compensation, while DataVault takes a transaction fee.

Phase 3 has the steepest requirements: strong privacy safeguards, explicit consent, and a viable market for the resulting information.

## Competitive advantage

If an independent vault gains traction, its edge comes from neutrality and trust. An established privacy reputation matters when asking users to consolidate sensitive records, and a standalone layer can support cross-platform integrations that individual model providers have little reason to prioritize.

Over time, shared permission and secure-access infrastructure can reinforce a growing network of users and compatible AI agents, with potential network effects if approved data queries become valuable.

## Major risks

- **Platform integration.** Apple, Google, and AI providers could integrate similar features directly.
- **Willingness to pay.** Users may resist paying for data management.
- **Security failures.** Any serious breach would severely damage trust.
- **Downstream misuse.** Preventing misuse after data has already been disclosed is difficult.
- **Marketplace uncertainty.** Data marketplace economics and regulatory compliance remain uncertain.

## Where to start

An initial MVP stays local-first and focuses on five components:

1. Encrypted storage for documents and structured personal data
2. An SDK for agents to request individual permissions
3. Time-limited access tokens
4. Audit logs
5. Revocation of future access

That leaves the critical validation question open: will users adopt an independent permissions layer instead of relying on the permissions provided by individual AI platforms?
