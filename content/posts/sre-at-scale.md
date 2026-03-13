---
title: "SRE at scale"
date: 2026-03-12T19:50:00+09:00
draft: false
---

> The severity of an incident is not determined by the technology that failed, but by the number of people impacted by it.

A 3-person team can run an incident in a Slack thread. A 300-person organization cannot.

That gap is where SRE gets interesting.

## What changes

At small scale, the person who gets paged probably wrote the code. At large scale, the person who gets paged might not know which team owns the failing component.

Three things break:

1. Finding _who_ to call takes longer than finding _what_ broke.
2. You stop debugging systems and start synchronizing humans.
3. Your best engineers get pulled into incidents they didn't cause.

## Incident roles

When an org hits ~50 engineers, informal incident response stops working. I've seen this structure hold up:

- **Incident Commander (IC)**: Owns coordination. Does _not_ debug.
- **Technical Lead**: Closest to the failing system. They debug.
- **Communications Lead**: Keeps stakeholders updated so the other two can focus.

The IC's most useful skill is saying "I don't know yet, we'll update in 15 minutes" and meaning it.

## Severity is a coordination signal

Severity levels shouldn't measure how broken something is. They should tell you how many people to involve.

| Severity | Meaning |
|---|---|
| Sev 1 | All hands. Exec awareness. Customer impact. |
| Sev 2 | Cross-team coordination. |
| Sev 3 | One team handles it. |
| Sev 4 | Fix it when you get to it. |

If your severity levels don't map to coordination effort, rethink them.

## Priorities during an incident

Most orgs optimize for speed of resolution. Optimize for clarity of decision-making instead.

1. **Mitigate.** Rollback, feature-flag, redirect traffic. Get to stable. Don't debug yet.
2. **Communicate.** One channel, one source of truth. Silence is worse than bad news.
3. **Scope.** What's affected? What's not? This decides whether you escalate or contain.
4. **Diagnose.** Now you debug.

"Find the root cause" belongs in the post-incident review, not the war room.

## On-call

- Rotate weekly. Monthly rotations create dread.
- Compensate it. If you don't pay for it, you don't value it.
- Primary and secondary. The secondary exists so the primary can sleep.
- Track interrupt load. If a team gets paged too often, that's a staffing or architecture problem.

## Post-incident reviews

The point is to change the system, not to produce a document.

- Blameless, not actionless.
- Focus on contributing factors. Complex systems fail for multiple reasons at once. Picking one "root cause" feels tidy but it's usually incomplete.
- Action items need owners and deadlines. Without a deadline it's a wish.
- Track completion rates. Below 70% completion means the reviews aren't driving change.

## Runbooks

Write them. Keep them short. Test them.

If a runbook hasn't been used in 6 months, it's either unnecessary or untested.

## SLOs and error budgets

Most teams set SLOs after building the system. Do it the other way around. Let the SLO constrain the architecture.

"99.9% of login requests complete in under 300ms over a 30-day window." That's specific enough to design around. "The system should be reliable" is not an SLO, it's a wish.

### SLOs shape infrastructure

99.9% availability gives you ~43 minutes of downtime per month. Can you do maintenance windows? Only if they fit. Can you run single-region? Probably not.

99.99% gives you ~4 minutes. Now you need active-active multi-region and zero-downtime deploys.

| SLO | Monthly budget | What it demands |
|---|---|---|
| 99% | ~7 hours | Monitoring, manual response |
| 99.9% | ~43 minutes | Automated alerts, fast rollbacks |
| 99.99% | ~4 minutes | Multi-region, automated failover |
| 99.999% | ~26 seconds | Active-active, no single points of failure |

### Error budgets

If your SLO is 99.9%, your error budget is 0.1%. That budget is meant to be spent.

Budget remaining? Push riskier releases. Budget exhausted? Stop shipping features, focus on reliability. "We can't ship this feature because we burned our error budget on last week's outage" is a conversation that only works if you agreed on the policy _before_ the budget ran out.

When the budget hits zero: feature releases pause, engineering shifts to reliability. This has to be pre-agreed. If it's a heroic call made during a crisis, it won't stick.

### Common SLO mistakes

- Setting a 99.999% target on a service that doesn't need it. You'll waste months of engineering time.
- Not measuring. If you can't track it, the budget is fiction.
- Same SLO for everything. A batch job and a login page have different reliability needs.
- No consequences for burning the budget. A budget without enforcement is a suggestion.

## Practical things

1. Automate incident setup. Channel creation, paging, status page updates. Save human judgment for actual decisions.
2. Run game days. Your incident process shouldn't be tested for the first time during a real outage.
3. Measure time to recovery, not time between failures. You can't prevent everything. You can recover faster.
4. If an SLO doesn't drive engineering priorities, get rid of it.
5. On-call misery is a signal. If people dread the rotation, the system is telling you something.

## The culture part

I've seen teams with excellent monitoring and terrible incident response. I've seen teams with basic tooling that recover quickly because they communicate well and trust each other to act.

The difference is organizational, not technical. Information flow, decision-making authority, mutual trust. Those are harder to fix than dashboards.
