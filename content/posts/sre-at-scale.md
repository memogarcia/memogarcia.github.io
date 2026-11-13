---
title: "SRE at scale"
date: 2026-03-12T19:50:00+09:00
draft: false
---

A 3-person team can run an incident in a Slack thread. A 300-person organization cannot.

At small scale, the person who gets paged probably wrote the code. They know what changed, who to ask, and how to roll back. In a larger organization, the on-call engineer often does not know which team owns the failing service. You spend more time finding the right owner than reading logs, and the same experienced engineers get pulled into outages they had nothing to do with.

Once an org grows past a handful of teams, keeping systems reliable depends on clear ownership and decisions agreed on before anything breaks.

## Incident coordination

Around 50 engineers, informal incident response stops holding up. Giving people explicit roles prevents everyone from stepping on each other:

- **Incident Commander (IC):** Owns coordination and keeps the response moving. Does not touch terminals or debug.
- **Technical Lead:** Knows the affected system and leads the investigation.
- **Communications Lead:** Keeps stakeholders and customers updated so the other two can focus.

Automate channel creation, paging, and status page updates so nobody burns the start of an outage on setup. During the call, the IC's main job is holding a steady cadence, including saying "I don't know yet, we will update in 15 minutes" and keeping that promise.

### Severity as a coordination signal

Severity levels should tell you how many people need to drop their work and join.

| Severity | Coordination scope |
|---|---|
| Sev 1 | All hands, executive awareness, customer impact |
| Sev 2 | Cross-team coordination |
| Sev 3 | Single team |
| Sev 4 | Normal backlog priority |

If your severity definitions do not map cleanly to escalation and staffing, people will argue about labels when they should be fixing the problem.

### Order of operations during an outage

Restore service and align the room before digging into root causes:

1. **Mitigate.** Roll back, flip a feature flag, or redirect traffic to stabilize the service.
2. **Communicate.** Keep one channel as the source of truth. Silence creates extra pings and duplicate work.
3. **Scope.** Confirm what is affected and what is still healthy. That decides whether you escalate or contain the incident.
4. **Diagnose.** Investigate why it broke once users are unblocked.

## Keeping the system healthy between incidents

Incident processes fail when organizations skip the maintenance work around them.

- **On-call:** Use weekly rotations, since monthly shifts create burnout and dread. Pair a primary with a secondary so the primary can sleep through non-urgent noise or have backup during a long outage. Pay people for on-call; treating interruptions as free guarantees resentment. Track interrupt load too, because frequent pages point to broken software or understaffing.
- **Runbooks:** Keep runbooks short and test them in game days so you catch dead steps before a real outage.
- **Post-incident reviews:** A review exists to change the system. Keep it blameless so people surface real mistakes, and look for the contributing factors that lined up; complex outages rarely have a single root cause. Every action item needs an owner and a deadline. If follow-ups keep getting deferred, the review process has turned into paperwork.

## SLOs and error budgets as shared rules

In a small team, everyone feels when things have gotten flaky and agrees to slow down feature work. In a large org, product teams and platform teams pull in opposite directions unless reliability targets are written down.

Set the SLO before choosing the architecture. "99.9% of login requests complete in under 300ms over a 30-day window" gives engineers concrete constraints to design around. "The system should be reliable" leaves every team guessing.

Target availability dictates how much complexity you have to run:

| SLO | Monthly downtime budget | What it demands |
|---|---|---|
| 99% | ~7 hours | Monitoring and manual response |
| 99.9% | ~43 minutes | Automated alerts and fast rollbacks |
| 99.99% | ~4 minutes | Multi-region setup and automated failover |
| 99.999% | ~26 seconds | Active-active across regions with no single points of failure |

A 99.9% SLO leaves a 0.1% error budget to spend on releases and experiments. When that budget hits zero, feature releases pause and engineering shifts to reliability work.

That policy only holds if leadership and product agree to it before an outage burns the budget. Trying to negotiate a release freeze mid-crisis fails.

Four common ways teams break SLOs in practice:

- Setting 99.999% targets on services that do not need them, wasting months on unnecessary redundancy.
- Applying one target to everything, even though a login path and a batch job have very different tolerances.
- Defining targets nobody measures.
- Leaving an exhausted error budget unenforced.

Monitoring and paging tools are easy to buy. At scale, recovery speed comes down to clear ownership and giving on-call engineers authority to act without waiting for permission.
