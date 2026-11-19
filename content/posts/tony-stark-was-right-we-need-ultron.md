---
title: "Tony Stark was right, we need Ultron"
date: 2026-11-19T14:04:00+09:00
draft: true
---

> Once an AI agent detects an attack, what can it do that I could not already set up beforehand?

Tony Stark wanted a suit of armor around the world. I have been thinking about a smaller version of that for my company: a defensive layer around our services and confidential data that watches for anomalies and responds to attackers in real time.

My first thought was to wire up models like GLM or DeepSeek to inspect logs and traffic continuously.

There is an immediate problem with that. LLMs are not free. Streaming every audit log and metric into a model 24/7 will burn through a budget fast.

A more practical version is a layered system where cheap deterministic rules run all the time, and the LLMs wake up only when needed:

1. **Scheduled cron sweeps.** Every few hours, or once a day, an agent reviews a summary of access patterns and recent changes to look for slow, quiet activity that threshold alerts miss.
2. **On-demand investigations.** When a deterministic check fires (an unusual login or unexpected outbound traffic), an agent spins up, gathers context across services, and decides whether the signal is noise or an intrusion.

If I can afford 24/7 monitoring later, great. Starting with cron plus on-demand triggers keeps token costs under control while still putting an investigator on call.

That part is mostly plumbing.

The question I keep getting stuck on comes right after detection.

## What happens after detection?

Suppose the on-demand agent runs, correlates the logs, and concludes that a malicious attack is underway.

Now what?

Before an attack happens, I can already lock down static boundaries: least-privilege IAM, firewalls, rate limits, short-lived tokens, and network segmentation. None of that requires an LLM. You set those up ahead of time.

So what can my agents do *after* an attack starts that I could not already do before?

Bring the systems offline?

Pulling the plug stops an attacker, sure. It also stops every real user and internal workflow at the same time. If taking production down is the only move my defender knows, that feels like a very expensive way to cause my own outage.

## Where live judgment actually helps

Static controls have to stay broad enough that normal work keeps moving. Attackers live inside that gap, using stolen credentials, allowed ports, or legitimate endpoints in unusual combinations.

You cannot write a pre-attack firewall rule for a token that has not been leaked yet, or for a valid service account that suddenly starts exporting a table it rarely touches.

A live agent can respond to context that only exists during the incident:

1. **Surgical revocation.** Kill one compromised session, API key, or service token without rotating credentials for everyone else.
2. **Targeted quarantine.** Move a single suspicious container or host into an isolated network policy (blocking outbound traffic while keeping the process alive) so the attacker loses access and you keep memory and disk state for forensics.
3. **Scoped degradation.** Pause a bulk data export, switch a sensitive endpoint to read-only, or require step-up verification for one account while the rest of the system keeps running.
4. **Adaptive blocking and decoys.** Rate-limit or block a specific caller or destination domain, or route suspected attack traffic into a honeypot to see what they are after.
5. **Ready-made triage.** Assemble the timeline, affected records, and recent deploys into one report before a human even opens a laptop.

Every one of these narrows the blast radius and buys time without taking the whole company offline.

## The Ultron problem

There is a reason the movie went badly five minutes after Tony turned Ultron on.

Wanting automated defense made sense. The failure was handing unchecked authority to a system that could decide the cleanest way to eliminate threats was to destroy what it was supposed to protect.

Giving a defensive LLM write access to production creates a smaller version of the same trap:

- **False positives become self-inflicted outages.** A noisy deployment or an unusual batch job looks suspicious. The model overreacts and starts killing pods or revoking admin tokens.
- **Attackers can weaponize your defender.** Once someone realizes that a specific traffic pattern makes your agent shut down a service or lock accounts, they can trigger your own defense to force a denial of service.
- **Prompt injection hides in telemetry.** If an attacker knows an LLM reads HTTP headers or error logs, they will eventually embed instructions inside them. Give that investigating agent broad remediation permissions and a crafted log line turns into a control plane.

## Drawing the line on authority

If I build this, the hardest decision is which actions the agent can run on its own.

Splitting by reversibility and blast radius feels like a reasonable starting point:

- **Autonomous:** Gather evidence, correlate logs, page a human, and run narrow, reversible containment (revoke one session, block one IP, pause a bulk export, quarantine one pod).
- **Human-approved:** Wide or destructive actions like taking core services offline or rotating root keys.

Even with that split, the boundary blurs fast. Quarantine the wrong pod and you can still break a critical path. Wait for a human to approve a shutdown and the confidential data might already be out the door.

Right now, the monitoring loop (deterministic triggers, cron sweeps, and on-demand GLM or DeepSeek investigations) feels like the easy part to build. I still do not have a clean answer for how much of the kill switch I am willing to hand over to an agent.
