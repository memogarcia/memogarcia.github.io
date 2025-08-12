---
title: "The role of a systems architect"
date: 2022-10-14T0:03:30+01:00
draft: false
---

## Define the scope of your system

Start by asking this broad questions:

1. Why is your system required? This will help you find the reason why this system or organization exists
2. What is the goal of your system?

These two questions will help you understand your organization's requirements, use them as a starting place, then  clarify as much as you can those answers so you can start building a clear picture of what components might be needed and more importantly, which ones won't.

> Avoid ambiguous words when defining your scope, for example, _a maintainable solution_ … what is that?

## Identify what matters for your system.

What do you care the most in your system

1. Performance?
2. Resiliency?
3. Consistency?
4. Something else?

> What matters changes from system to system. Clarify the expectations with your organization as much as possible.

Don’t spend extra cost on performance, for example, if that’s not required.

## Define the system SLOs and let them define your architecture

An SLO (Service Level Objective) is an agreement between your team and the users of your system. Use this metric as a reference when implementing your architecture. For example, if your SLO is 99.9999% then it is clear that resiliency is a must. So spend extra effort making sure that your system can withstand disasters.

> Identify the key characteristics of your system and let that guide your architecture

## Make a solution able to adapt to changes and requirements.

If you can adapt quickly to change, predicting it becomes far less crucial.

Be aware that there is no such thing as the perfect architecture, but there are definitely bad architectures. Identify them as soon as possible.

## Organization structure

An architect should also organize teams, because a team structure should reflect the solution architecture.

> A system is the reflection of the organization that created it… so you must change your organization if you want something “different” or “new”.
