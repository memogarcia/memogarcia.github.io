---
title: "Istio VirtualServices: Production Basics"
date: 2025-09-03T00:00:00Z
draft: false
---

## Problem

You need safe, predictable traffic control in prod. VirtualServices + DestinationRules give version routing, timeouts/retries, and circuit breaking without touching code.

## Approach

1. Define versioned subsets in a `DestinationRule`.
2. Route via `VirtualService` with weights (canary → rollout).
3. Add `timeout`, `retries`, and outlier detection.
4. Shift weights, watch metrics, then cut over.


## Example (Config)

```yaml
# vs-dr.yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: svc
  namespace: prod
spec:
  host: svc.prod.svc.cluster.local
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    outlierDetection:
      consecutive5xx: 5
      interval: 5s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: svc
  namespace: prod
spec:
  hosts:
    - api.example.com
  gateways:
    - prod-gateway
  http:
    - match:
        - uri:
            prefix: "/"
      timeout: 3s
      retries:
        attempts: 2
        perTryTimeout: 1s
        retryOn: 5xx,connect-failure,refused-stream,reset
      route:
        - destination:
            host: svc.prod.svc.cluster.local
            subset: v1
            port:
              number: 80
          weight: 90
        - destination:
            host: svc.prod.svc.cluster.local
            subset: v2
            port:
              number: 80
          weight: 10
```

## Verification / DoD

- Traffic split roughly matches weights during canary; full cutover works
- Subsets map to pod labels (`version: v1|v2`) and mTLS is active

## Systems Note

Route by subsets, not by Deployment names. It keeps releases boring and configs stable.

## References

- Istio: Traffic Management (VirtualService, DestinationRule)
