---
title: "Multi-Region Cloud Training, Part 7: CD with Istio Traffic Policy"
date: 2025-10-17T09:16:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-07-cd/
---

Updating every pod in both regions at once exposes 100% of traffic to any regression in a new build. To separate deploying new pods from shifting user traffic onto them, we add an Istio `DestinationRule` and `VirtualService` to split traffic by weight and shed failing pods before they cause a cascading failure.

Standard Kubernetes `Service` load balancing distributes requests evenly across every ready pod (using random selection under `iptables`/`nftables` kube-proxy, or round-robin under `ipvs`), so traffic share is tied to replica count. Istio moves routing into Envoy sidecars, letting you hold 10% of requests on a new version regardless of how many replicas run.

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

## Adding a `v2` Deployment

In Part 5, our `echo` `Deployment` labeled pods with `app: echo` and `version: v1`. To test a 90/10 traffic split manually, add a second `Deployment` (`deploy/base/echo/deployment-v2.yaml`) with `version: v2` and `VERSION=v2`:

```yaml
# deploy/base/echo/deployment-v2.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo-v2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: echo
      version: v2
  template:
    metadata:
      labels:
        app: echo
        version: v2
    spec:
      containers:
        - name: echo
          image: ghcr.io/your-org/echo-api:v1
          env:
            - name: REGION
              value: unknown
            - name: VERSION
              value: v2
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            periodSeconds: 3
```

Add a matching `REGION` patch for `echo-v2` in `deploy/overlays/{us,eu}/echo/patch.yaml` if you want `v2` responses to report `region=us` and `region=eu` as well.

## DestinationRule: Connection Pooling and Outlier Detection

The `DestinationRule` defines the `v1` and `v2` subsets and attaches circuit-breaking limits. `connectionPool` caps concurrent connections and queued HTTP requests so a slow upstream cannot exhaust caller resources. `outlierDetection` ejects pods that return consecutive 5xx responses from the load-balancing pool for 30 seconds.

```yaml
# deploy/base/echo/dr.yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: echo
spec:
  host: echo.echo.svc.cluster.local
  trafficPolicy:
    connectionPool:
      http:
        http1MaxPendingRequests: 1000
        maxRequestsPerConnection: 100
      tcp:
        maxConnections: 1000
    outlierDetection:
      consecutive5xxErrors: 10
      interval: 5s
      baseEjectionTime: 30s
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

## VirtualService: Weighted Traffic Split

The `VirtualService` routes 90% of requests for `echo.echo.svc.cluster.local` to `v1` and 10% to `v2`:

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
            port:
              number: 80
          weight: 90
        - destination:
            host: echo.echo.svc.cluster.local
            subset: v2
            port:
              number: 80
          weight: 10
```

Wire the new files into `deploy/base/echo/kustomization.yaml` so Argo CD syncs them:

```yaml
# deploy/base/echo/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - deployment-v2.yaml
  - service.yaml
  - dr.yaml
  - vs.yaml
```

Note that we did not add an explicit `retries` block here. Istio's Envoy sidecars already default to 2 retries on connection failures and 503 stream resets; custom HTTP retry budgets are worth adding only after you verify the endpoint is idempotent.

## Verification

Commit and push the changes so Argo CD syncs both clusters. Start an ephemeral shell in the US cluster (`--restart=Never` ensures the pod exits cleanly when you leave `sh` instead of entering `CrashLoopBackOff`):

```bash
kubectl --context prod-us-east-1 -n echo run curl --rm -it --restart=Never \
  --image=curlimages/curl -- sh
```

Inside the pod, send 50 requests and count the versions returned:

```sh
for i in $(seq 1 50); do curl -sS http://echo.echo.svc.cluster.local; done | sort | uniq -c
```

Roughly 90% of responses should print `version=v1` and 10% `version=v2`.

Editing `VirtualService` weights in Git for every release gets tedious fast. Next, we replace the `Deployment` pair with an Argo `Rollout` so a controller steps through weights and checks Prometheus automatically.

[Previous: Part 6](/posts/multi-region-series-part-6-ci/) · [Index](/posts/multi-region-learning/) · [Next: Part 7.1](/posts/multi-region-series-part-7a-rollouts/)
