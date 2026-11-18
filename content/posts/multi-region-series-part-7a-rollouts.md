---
title: "Multi-Region Cloud Training, Part 7.1: Progressive Delivery with Argo Rollouts"
date: 2025-10-17T09:17:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-07a-rollouts/
---

Shifting Istio `VirtualService` weights by hand for every release does not scale. Here we replace the `Deployment` setup from Parts 5 through 7 with **Argo Rollouts**, which steps through canary weights (`10% -> 25% -> 50% -> 100%`), queries Prometheus for canary 5xx errors, and aborts automatically if the check fails.

## Prerequisites: Prometheus, Envoy Scraping, and Argo Rollouts

The `AnalysisTemplate` below queries `istio_requests_total` from Prometheus in the `observability` namespace. By default, `kube-prometheus-stack` does **not** scrape Istio Envoy sidecars (`:15090/stats/prometheus`), so you also need a `PodMonitor` labeled `release: kube-prometheus-stack` (see [deploy/istio/podmonitor.yaml](https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/istio/podmonitor.yaml)).

Install Prometheus, the Envoy `PodMonitor`, Kiali, and the Argo Rollouts controller in both clusters using the repo `Taskfile.yml`:

```bash
task obs:install:all
task rollouts:install:all
```

Install the local `kubectl` plugin to watch rollout progress from the terminal:

```bash
brew install argoproj/tap/kubectl-argo-rollouts
```

## Migrating From `Deployment` to `Rollout`

Argo Rollouts manages pods via a `Rollout` resource and switches two `Service` selectors (`echo-stable` and `echo-canary`) by pod template hash as revisions progress. Because this replaces the `Deployment` from Part 5, delete the old `echo` and `echo-v2` deployments before applying the Rollouts stack (or use `task rollouts:apply:all`, which deletes `deploy/echo` first). If you wired the EU east-west `VirtualService` in Part 3, update its destination host from `echo.echo.svc.cluster.local` to `echo-stable.echo.svc.cluster.local`.

The full manifests live under `deploy/rollouts/` in this repo:

### Services (`deploy/rollouts/base/services.yaml`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: echo-stable
  namespace: echo
spec:
  selector:
    app: echo # Argo Rollouts adds rollouts-pod-template-hash
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: echo-canary
  namespace: echo
spec:
  selector:
    app: echo # Argo Rollouts adds rollouts-pod-template-hash
  ports:
    - port: 80
      targetPort: 8080
```

### VirtualService (`deploy/rollouts/base/virtualservice.yaml`)

This `VirtualService` keeps baseline weights at `100 / 0` on the `primary` route and lets Argo Rollouts mutate those weights during a rollout. A separate `ab-test` route pins requests carrying `x-user-type: beta` directly to `echo-canary`.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: echo-rollouts
  namespace: echo
spec:
  hosts:
    - "echo-stable.echo.svc.cluster.local"
  gateways: ["mesh"]
  http:
    - name: ab-test
      match:
        - headers:
            x-user-type:
              exact: beta
      route:
        - destination:
            host: echo-canary.echo.svc.cluster.local
            port:
              number: 80
          weight: 100
    - name: primary
      route:
        - destination:
            host: echo-stable.echo.svc.cluster.local
            port:
              number: 80
          weight: 100
        - destination:
            host: echo-canary.echo.svc.cluster.local
            port:
              number: 80
          weight: 0
```

Keep `ab-test` out of `trafficRouting.istio.virtualService.routes` in the `Rollout` below. Argo Rollouts should manage the weighted `primary` route only; `ab-test` is a header-only route that always sends 100% of matching traffic to `echo-canary`.

### Rollout (`deploy/rollouts/base/rollout.yaml`)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: echo
  namespace: echo
spec:
  replicas: 4
  selector:
    matchLabels:
      app: echo
  template:
    metadata:
      labels:
        app: echo
    spec:
      containers:
        - name: echo
          image: ghcr.io/your-org/echo-api:1.0.0
          ports:
            - containerPort: 8080
  strategy:
    canary:
      canaryService: echo-canary
      stableService: echo-stable
      trafficRouting:
        istio:
          virtualService:
            name: echo-rollouts
            routes: ["primary"]
      steps:
        - setWeight: 10
        - pause: { duration: 60 }
        - analysis:
            templates:
              - templateName: success-rate
        - setWeight: 25
        - pause: { duration: 60 }
        - setWeight: 50
        - pause: { duration: 60 }
```

The version checked into [deploy/rollouts/base/rollout.yaml](https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/rollouts/base/rollout.yaml) uses an inline `python:3.12-alpine` HTTP server so you can run the lab without pushing a custom image first, and the regional overlays (`deploy/rollouts/overlays/{us,eu}/patch.yaml`) inject `REGION=us` and `REGION=eu` via a JSON patch targeting `kind: Rollout`.

### AnalysisTemplate (`deploy/rollouts/base/analysis.yaml`)

Scope the PromQL query to `destination_service_name="echo-canary"`. Filtering only by `destination_workload_namespace="echo"` mixes 90% healthy stable traffic with 10% canary traffic at the first step, which would let a canary fail nearly 10% of its own requests while keeping the namespace-wide rate above 99%.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: echo
spec:
  metrics:
    - name: non-5xx-rate
      interval: 30s
      count: 3
      # Treats empty or zero-traffic windows as passing so an idle lab cluster does not abort.
      # In production, drop isNaN(result[0]) and `or vector(1)` so silent canaries fail.
      successCondition: isNaN(result[0]) || result[0] >= 0.99
      failureLimit: 1
      provider:
        prometheus:
          address: http://kube-prometheus-stack-prometheus.observability.svc.cluster.local:9090
          query: |
            (
              sum(rate(istio_requests_total{reporter="destination", destination_workload_namespace="echo", destination_service_name="echo-canary", response_code!~"5.."}[1m]))
              /
              sum(rate(istio_requests_total{reporter="destination", destination_workload_namespace="echo", destination_service_name="echo-canary"}[1m]))
            ) or vector(1)
```

### Preventing Argo CD `selfHeal` From Fighting Argo Rollouts

In Part 2, our `ApplicationSet` enabled `automated.selfHeal: true`. If Argo CD watches `virtualservice.yaml` (which stores `weight: 100 / 0` in Git) with `selfHeal: true` and no diff exclusions, Argo CD immediately reverts the weights every time Argo Rollouts shifts traffic.

Switch your `ApplicationSet` to [deploy/apps/rollouts-appset.yaml](https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/apps/rollouts-appset.yaml), which points to `deploy/rollouts/overlays/{{.metadata.labels.region}}`, ignores `.spec.http[].route[].weight` on `VirtualService`, and sets `RespectIgnoreDifferences=true`:

```yaml
      ignoreDifferences:
        - group: networking.istio.io
          kind: VirtualService
          jqPathExpressions:
            - .spec.http[].route[].weight
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
          - RespectIgnoreDifferences=true
```

## Verification

Trigger a new rollout by bumping the image tag in your overlay (or editing the `Rollout` template) and pushing to Git.

Watch the rollout in US. Note that `kubectl` requires global flags (`--context`, `-n`) **after** the plugin name (`argo rollouts`):

```bash
kubectl argo rollouts get rollout echo --context prod-us-east-1 -n echo --watch
```

While the canary step is paused, send traffic from a sidecar-injected pod inside the cluster (`gateways: ["mesh"]` applies only to meshed callers) to test the header route and feed metrics into Prometheus:

```bash
kubectl --context prod-us-east-1 -n echo run curl --rm -it --restart=Never \
  --image=curlimages/curl -- curl -sS -H 'x-user-type: beta' http://echo-stable.echo.svc.cluster.local
```

If the canary non-5xx rate stays at or above 99%, Argo Rollouts promotes through `25%` and `50%` to `100%`. If it drops below 99%, the controller aborts and resets `primary` back to `100 / 0`.

Next, we inject pod kills and network latency with Chaos Mesh.

[Previous: Part 7](/posts/multi-region-series-part-7-cd/) · [Index](/posts/multi-region-learning/) · [Next: Part 8](/posts/multi-region-series-part-8-chaos/)
