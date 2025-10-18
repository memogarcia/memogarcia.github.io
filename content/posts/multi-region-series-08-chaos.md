---
title: "Multi region cloud training Lab 8/9: Chaos Testing"
date: 2025-10-18T09:17:00-07:00
draft: false
---

Problem: Validate resilience under pod kills and regional impairment.

Assumptions/Constraints

- Cost note: Two clusters simulate regions.
- Install Chaos Mesh or Litmus Chaos, one per cluster.

ASCII Diagram

```
 [Chaos Mesh]
    |
    +--> PodChaos: kill one pod in app=echo
    |
    +--> NetworkChaos: add 200ms delay to ns=echo

 Effects:
   - Envoy retries + multiple replicas keep SLI green
   - p99 rises during NetworkChaos window
```

Steps (Chaos Mesh)

1) Install the operator.
2) Create a PodChaos to kill app pods.
3) Create a NetworkChaos to add latency.

Example

```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm upgrade --install chaos-mesh chaos-mesh/chaos-mesh -n chaos-testing --create-namespace --set dashboard.create=true
```

Pod kill

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata: { name: kill-echo, namespace: chaos-testing }
spec:
  action: pod-kill
  mode: one
  duration: '1m'
  selector:
    namespaces: [ "echo" ]
    labelSelectors: { app: echo }
```

Network latency

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata: { name: delay-echo, namespace: chaos-testing }
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

Verification/DoD

- Service responds during pod kills due to replicas and retries.
- Added latency increases p99 within tolerance or triggers alerts.

Previous: [Lab 7](/posts/multi-region-series-07-cd/) · Next: [Lab 9](/posts/multi-region-series-09-load/)
