---
title: "Multi Region Cloud Training Lab: Part 7 - CD with Istio Traffic Policy and Argo CD"
date: 2025-10-17T09:16:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-07-cd/
---

Problem: Roll out new versions safely at high throughput.

Assumptions/Constraints

- Cost note: Two clusters act as regions.
- Istio sidecars injected. Namespace labeled with `istio-injection=enabled`.

ASCII Diagram

```
                 VirtualService
             +-------------------+
 Request ---> | 90% -> subset v1 |
             | 10% -> subset v2 |
             +-------------------+
                    |
                    v
        DestinationRule (subsets + policies)
        - subsets: v1 (labels version=v1), v2 (version=v2)
        - connectionPool, outlierDetection
```

Steps

1) Add VirtualService and DestinationRule with connection pools and outlier detection.
2) Let Argo CD sync them per region overlay.

Example

```yaml
# deploy/base/echo/dr.yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata: { name: echo }
spec:
  host: echo.echo.svc.cluster.local
  trafficPolicy:
    connectionPool:
      http: { http1MaxPendingRequests: 1000, maxRequestsPerConnection: 100 }
      tcp: { maxConnections: 1000 }
    outlierDetection:
      consecutive5xxErrors: 10
      interval: 5s
      baseEjectionTime: 30s
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
---
# deploy/base/echo/vs.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: echo }
spec:
  hosts: [ "echo.echo.svc.cluster.local" ]
  http:
    - route:
        - destination: { host: echo.echo.svc.cluster.local, subset: v1, port: { number: 80 } }
          weight: 90
        - destination: { host: echo.echo.svc.cluster.local, subset: v2, port: { number: 80 } }
          weight: 10
```

Verification/DoD

- Traffic splits 90 or 10 between versions. Adjust by commit and Argo CD applies.

Previous: [Part 6](/posts/multi-region-series-part-6-ci/) · Next: [Part 7.1](/posts/multi-region-series-part-7a-rollouts/)
