---
title: "Chaos testing and disaster drills"
date: 2026-03-12T20:24:00+09:00
draft: true
---

> Your disaster recovery plan is a theory until you test it.

## Why bother

Every team has a runbook that says "in case of regional failure, failover to the secondary region." Very few teams have actually done it.

The gap between "we have a plan" and "we've practiced the plan" is where outages turn into catastrophes. I've watched teams discover during a real incident that their failover script had a hardcoded hostname from two migrations ago. That's not a tooling failure. That's a testing failure.

## Chaos testing vs. disaster drills

These are different things and people mix them up, but both are things I really enjoy doing.

**Chaos testing** is continuous. You inject failures into production (or staging) to see how the system responds automatically. Kill a pod. Drop a network link. Corrupt a config. Does the system self-heal? Does the alert fire? Does the auto-scaler react?

**Disaster drills** are scheduled exercises where the _team_ practices responding. The goal isn't to test the system. It's to test the humans and the process. Can the on-call engineer find the runbook? Does the escalation path work? Does the Incident Commander know what to declare?

You need both. Chaos testing validates architecture. Disaster drills validate organization.

## Starting chaos testing

Don't start by killing production databases. Start small.

**Week 1:** Kill a single pod in staging and watch what happens. Does Kubernetes reschedule it? Does the health check pass? How long does it take?

**Week 2:** Introduce 500ms of latency on one service. Which downstream services time out? Which ones retry? Which ones cascade?

**Week 3:** Revoke a service account's credentials. Does the error surface clearly, or does it show up as a mysterious 403 three hops downstream?

These are cheap experiments. If you can't survive them in staging, you definitely can't survive them in production.

### Tools

- **Chaos Monkey** (Netflix). The original. Randomly kills instances.
- **Litmus** (CNCF). Kubernetes-native. Good for pod-level and network-level faults.
- **Toxiproxy** (Shopify). Sits between services and simulates network conditions: latency, bandwidth limits, connection drops.
- **tc** (Linux traffic control). Free. Already on your machines. Ugly to configure but effective for network fault injection.

Pick the one that matches your stack. The specific tool matters less than actually running experiments.

## Disaster drills

### Tabletop exercises

No systems involved. Sit the team in a room (or a video call) and narrate a scenario:

"It's 3 AM. The primary database in us-east-1 is unreachable. Monitoring shows connections timing out. Your phone is buzzing. What do you do first?"

Go around the room. Let people talk through their response. You'll find gaps fast: nobody knows the failover procedure, or two people think they're the IC, or the runbook references a Slack channel that got archived.

Tabletops take 45 minutes and cost nothing. Run one quarterly at minimum.

### Live drills

Simulate a real failure. Kill a component, tell the on-call team it's a drill, and let them work through the incident process for real.

What to measure:

- How long until the right people are in the room?
- Did the IC establish communication and assign roles?
- Was the runbook accurate? Current? Findable?
- How long from detection to mitigation?

After the drill, run a retro the same way you would after a real incident. The drill is only useful if you act on what you find.

### A few things I've learned running these

People freeze the first time. That's normal and exactly why you practice.

The runbook is always out of date. Accept this. Build runbook review into the drill retro.

Don't surprise people with drills during high-stress periods. A disaster drill during a product launch is not training, it's sabotage.

Make drills safe. If someone makes a mistake, that's data, not blame. If people are afraid to fail during practice, they'll be afraid to act during a real incident.

## Game days

Game days are larger-scale disaster drills. Multiple teams, multiple failure scenarios, sometimes running for half a day.

Netflix calls theirs "Chaos Engineering days." Google ran what they called DiRT (Disaster Recovery Testing) since at least 2009. The patterns are similar:

1. Define the blast radius. What are you willing to break? What's off limits?
2. Have a kill switch. If the drill causes real customer impact, you need to stop immediately.
3. Assign observers. People whose job is to watch and take notes, not participate.
4. Write it up. What worked? What didn't? What do you fix before the next one?

## When to do what

| Practice | Frequency | Effort | What it tests |
|---|---|---|---|
| Chaos experiments (staging) | Weekly or continuous | Low | Architecture, auto-healing |
| Chaos experiments (production) | Monthly, controlled | Medium | Real-world resilience |
| Tabletop exercises | Quarterly | Low | Process, communication, gaps |
| Live drills | Twice a year | Medium | End-to-end incident response |
| Game days | Annually | High | Cross-team coordination |

## The uncomfortable part

Running these exercises means sometimes things break. That's the point. An engineering culture that can't tolerate controlled failure during practice won't handle uncontrolled failure during a real incident.

The goal isn't to prove the system is reliable. It's to find where it isn't, before your users do.
