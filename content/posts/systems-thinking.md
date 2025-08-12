---
title: "Systems Thinking"
date: 2024-05-04T01:55:24+09:00
draft: false
---

## What is a system?

A set of pieces that work together to perform a function. When those pieces work together, emergence arises!

Emergence as a concept refers to the idea that the whole is greater than the sum of its parts. New properties and behaviors emerge at the system level that cannot be understood by analyzing the parts in isolation.

Systems thinking is bla bla bla, you can read it from [wikipedia](https://en.wikipedia.org/wiki/Systems_thinking). What I want to do is to focus on visualizing systems through the lenses of graph theory and how to incorporate game theory into the mix.

## Systems as Graphs

Every system can be modeled as a graph: nodes (components) connected by edges (relationships). Your Kubernetes cluster? Graph. Your CI/CD pipeline? Graph. Your team's communication patterns? Also a graph.

This perspective reveals structural patterns:

**Centrality**: Which components are most critical? In a microservices architecture, your API gateway has high betweenness centrality. Remove it and everything breaks.

**Clustering**: Where do tight coupling issues hide? Dense subgraphs often indicate areas ripe for refactoring.

**Path lengths**: How many hops from problem to solution? Long paths suggest potential bottlenecks.

Think about your last production incident. The failure probably cascaded along edges you didn't expect, through nodes you forgot existed.

## Game Theory in System Design

Systems aren't just connected, they're competitive. Each component optimizes for its own objectives, creating tensions:

**Nash Equilibrium**: Your monitoring system generates alerts (good for reliability) while developers optimize for feature velocity (fewer checks). The equilibrium? Just enough monitoring to prevent major outages.

**Prisoner's Dilemma**: Team A could share their internal tools with Team B, but maintaining documentation takes effort. Both teams end up building duplicate solutions.

**Zero-Sum vs Positive-Sum**: Resource allocation feels zero-sum (CPU for Team A means less for Team B), but good architecture creates positive-sum outcomes (better caching helps everyone).

## Practical Applications

**Incident Response**: Map your system dependencies as a graph. Identify critical paths and single points of failure. Game theory helps predict where teams will cut corners under pressure.

**Architecture Reviews**: Don't just check if components work. Analyze the incentive structures. Are you rewarding behaviors that strengthen or weaken the overall system?

**Team Organization**: Conway's Law isn't just observation, it's graph theory in action. Your communication patterns become your system architecture. Design both intentionally.

## System Structure Visualization

```
           System as Graph + Game Theory

    ┌─────────────────────────────────────────────────────────┐
    │                  System Layer                           │
    │  ┌─────────┐      ┌─────────┐      ┌─────────┐          │
    │  │Component│◄────►│Component│◄────►│Component│          │
    │  │    A    │      │    B    │      │    C    │          │
    │  │         │      │ (Critical      │         │          │
    │  │ Team 1  │      │  Gateway)      │ Team 2  │          │
    │  └─────────┘      └─────────┘      └─────────┘          │
    │       │               │               │                 │
    │       ▼               ▼               ▼                 │
    │  ┌─────────┐      ┌─────────┐      ┌─────────┐          │
    │  │ Local   │      │ Global  │      │ Local   │          │
    │  │ Optim   │      │ Optim   │      │ Optim   │          │
    │  └─────────┘      └─────────┘      └─────────┘          │
    └─────────────────────────────────────────────────────────┘
                               │
                               ▼
    ┌─────────────────────────────────────────────────────────┐
    │              Game Theory Dynamics                      │
    │                                                         │
    │  Nash Equilibrium:  [Reliability ↔ Velocity]           │
    │  Prisoner's Dilemma: [Share Tools ↔ Hoard Knowledge]    │
    │  Zero-Sum:          [Resources ↔ Competition]           │
    │  Positive-Sum:      [Architecture ↔ Collaboration]     │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
                               │
                               ▼
    ┌─────────────────────────────────────────────────────────┐
    │               Emergent Behaviors                        │
    │                                                         │
    │  • System resilience > sum of component reliability     │
    │  • Failure cascades along unexpected paths              │
    │  • Team communication shapes system architecture        │
    │  • Incentive misalignment creates technical debt        │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```

The most resilient systems aren't the ones with perfect components. They're the ones where the graph structure and incentive alignment work together to handle failure gracefully.

Remember: You're not just building software. You're designing emergent behaviors in complex adaptive systems. Plan accordingly.

