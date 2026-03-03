---
title: "Chapter 8: Multi-Region Cloud Training - Chaos Testing"
date: 2025-10-17T09:17:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-08-chaos/
---

We've spent a lot of time building a resilient, multi-region architecture. We have multiple replicas, automated rollbacks, and cross-cluster routing. But architecture diagrams lie. The only way to know if your system is actually resilient is to break it on purpose.

This is Chaos Engineering. We are going to intentionally inject failures into our clusters to verify that our safety mechanisms actually work when things go wrong. 

To do this, we'll use **Chaos Mesh**, a powerful Kubernetes-native chaos engineering platform.

### Preparing for Chaos

First, we need to install the Chaos Mesh operator in one of our clusters (we'll use the US cluster for this test, but the concepts apply everywhere).

```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm upgrade --install chaos-mesh chaos-mesh/chaos-mesh -n chaos-testing --create-namespace --set dashboard.create=true
```

With the operator running, we define "Chaos Experiments" as Custom Resource Definitions (CRDs). The operator reads these manifests and executes the destructive actions.

### Experiment 1: The Pod Killer

The most basic test of resilience is ensuring your application can survive a pod suddenly dying. Kubernetes is designed to recreate pods, but what happens to the user traffic during that window?

We'll define a `PodChaos` experiment that randomly kills one pod in our `echo` deployment every minute.

```yaml
# pod-kill.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata: 
  name: kill-echo
  namespace: chaos-testing
spec:
  action: pod-kill
  mode: one
  duration: '1m'
  selector:
    namespaces: [ "echo" ]
    labelSelectors: 
      app: echo
```

**What to watch for:** 
When you apply this, start hitting your application with `curl` in a loop. You shouldn't see any dropped connections. Because we configured multiple replicas in Part 5, and Istio's connection pooling/retries in Part 7, the mesh should seamlessly route around the dead pod while Kubernetes spins up a replacement.

### Experiment 2: Regional Network Impairment

Pod kills are easy. Network degradation is much harder to handle. 

What happens if an entire AWS region starts experiencing severe network latency? If your application relies on synchronous calls, a 200ms delay can quickly exhaust your thread pools and crash your services.

We'll use a `NetworkChaos` experiment to simulate this. We will inject a massive 200ms delay (with 50ms of jitter) into all traffic within the `echo` namespace.

```yaml
# network-delay.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata: 
  name: delay-echo
  namespace: chaos-testing
spec:
  action: delay
  mode: all
  selector:
    namespaces: [ "echo" ]
  delay:
    latency: '200ms'
    jitter: '50ms'
  duration: '5m'
```

**What to watch for:**
This is where our multi-region setup shines. If the US region becomes severely impaired, and our local clients start timing out, we can rely on our Istio cross-cluster routing (from Part 3) to failover to the healthy EU region. 

You should also look at your monitoring dashboards. This kind of latency spike should immediately trigger your p99 latency alerts. If it doesn't, your observability stack needs tuning.

Chaos testing proves that our theoretical resilience is actually functional. In the final part of this series, we'll put our architecture under sustained load to prove it can handle production traffic.

[Previous: Part 7.1](/posts/multi-region-series-part-7a-rollouts/) · [Continue to Part 9: Load Generation and SLOs](/posts/multi-region-series-part-9-load/)
