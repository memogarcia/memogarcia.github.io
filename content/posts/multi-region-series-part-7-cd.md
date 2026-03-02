---
title: "Multi-Region Cloud Training: CD with Istio Traffic Policy"
date: 2025-10-17T09:16:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-07-cd/
---

Continuous Deployment is great until you automatically deploy a critical bug to every region simultaneously. If our Argo CD pipeline instantly updates 100% of our pods to a broken version, our global availability drops to zero.

To prevent this, we need to decouple *deployment* (starting the new pods) from *release* (sending user traffic to those pods). 

Since we already have Istio installed for our cross-cluster mesh, we can leverage its Envoy proxies to control the flow of traffic with extreme precision. We'll implement traffic splitting to test new versions safely, and we'll add connection pooling to protect our services from cascading failures.

### The Istio Routing Model

In Kubernetes, a standard `Service` uses random round-robin load balancing across all available pods. Istio intercepts this process. Instead of talking to the Service directly, we define a **VirtualService** (the routing rules) and a **DestinationRule** (the pool of target pods and the policies applied to them).

```text
                 VirtualService
             +-------------------+
 Request ───>│ 90% ─> subset v1  │
             │ 10% ─> subset v2  │
             +-------------------+
                    │
                    ▼
        DestinationRule (subsets + policies)
        - subset v1 (matches pods with label version=v1)
        - subset v2 (matches pods with label version=v2)
        - policy: connectionPool, outlierDetection
```

### DestinationRule: Protecting the Service

The `DestinationRule` is where we define our subsets (versions) and apply resilience policies. 

One of the most dangerous things in a microservice architecture is a "retry storm"—when a downstream service slows down, upstream services retry aggressively, overwhelming the system and causing a cascading outage. We can prevent this with Istio's connection pooling and outlier detection.

```yaml
# deploy/base/echo/dr.yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata: 
  name: echo
spec:
  host: echo.echo.svc.cluster.local
  trafficPolicy:
    # Protect against connection spikes
    connectionPool:
      http: 
        http1MaxPendingRequests: 1000
        maxRequestsPerConnection: 100
      tcp: 
        maxConnections: 1000
    # Automatically eject failing pods from the load balancing pool
    outlierDetection:
      consecutive5xxErrors: 10
      interval: 5s
      baseEjectionTime: 30s
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
```

### VirtualService: Splitting the Traffic

With our subsets defined, we use a `VirtualService` to control the traffic split. 

Imagine we have deployed `v2` of our application alongside `v1`. Instead of cutting over immediately, we can configure Istio to send 90% of traffic to the stable `v1` and a 10% "canary" fraction to the new `v2`.

```yaml
# deploy/base/echo/vs.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: 
  name: echo
spec:
  hosts: 
    - "echo.echo.svc.cluster.local"
  http:
    - route:
        - destination: 
            host: echo.echo.svc.cluster.local
            subset: v1
            port: { number: 80 }
          weight: 90
        - destination: 
            host: echo.echo.svc.cluster.local
            subset: v2
            port: { number: 80 }
          weight: 10
```

### Verification

Once you commit these manifests, Argo CD will sync them to both regions. 

If you have both `v1` and `v2` pods running, you can run a loop to generate traffic:

```bash
kubectl --context prod-us-east-1 -n echo run curl --rm -it --image=curlimages/curl -- sh
# Inside the pod:
while true; do curl -sS http://echo.echo.svc.cluster.local; sleep 0.1; done
```

You should see that roughly 1 out of every 10 requests is handled by the `v2` pods. 

While we can manually adjust these weights by committing changes to Git, doing this by hand for every release is tedious and error-prone. In the next section, we'll automate this entire process—the deployment, the traffic shift, the analysis, and the rollback—using Argo Rollouts.

[Previous: Part 6](/posts/multi-region-series-part-6-ci/) · [Continue to Part 7.1: Progressive Delivery with Argo Rollouts](/posts/multi-region-series-part-7a-rollouts/)
