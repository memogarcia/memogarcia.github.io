---
title: "Multi Region Cloud Training Lab: Part 7.1 - Progressive Delivery with Argo Rollouts"
date: 2025-10-19T10:45:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-07a-rollouts/
---

Problem: Safely test new versions with canary and A/B in each region using Argo Rollouts.

Assumptions/Constraints

- Two clusters act as regions. Use two kube contexts.
- Istio is installed. Namespace `echo` has `istio-injection=enabled`.
- Argo CD manages manifests, but you can `kubectl apply` to learn.
- You have Prometheus from Part 9 prereqs or `obs:install:*` tasks.

Steps

1) Install Argo Rollouts in each cluster.
   - `helm repo add argo https://argoproj.github.io/argo-helm && helm repo update`
   - `helm --kube-context prod-us-east-1 upgrade --install argo-rollouts argo/argo-rollouts -n argo-rollouts --create-namespace --wait`
   - `helm --kube-context prod-eu-west-1 upgrade --install argo-rollouts argo/argo-rollouts -n argo-rollouts --create-namespace --wait`
   - Tooling: `brew install argoproj/tap/kubectl-argo-rollouts`.
2) Ensure namespace and label exist: `kubectl --context <ctx> create ns echo || true && kubectl --context <ctx> label ns echo istio-injection=enabled --overwrite`.
3) Apply Services, VirtualService, Rollout, and AnalysisTemplate below (per region overlay).
4) Trigger a canary by changing the image tag and committing. Watch the rollout.
   - `kubectl --context <ctx> -n echo argo rollouts get rollout echo --watch`
5) A/B test by sending header `x-user-type: beta` to force traffic to canary.
6) Promote or abort based on metrics and checks.

Example

```yaml
# services.yaml
apiVersion: v1
kind: Service
metadata: { name: echo-stable, namespace: echo }
spec:
  selector: { app: echo }
  ports: [ { port: 80, targetPort: 8080 } ]
---
apiVersion: v1
kind: Service
metadata: { name: echo-canary, namespace: echo }
spec:
  selector: { app: echo }
  ports: [ { port: 80, targetPort: 8080 } ]
---
# virtualservice.yaml (Argo Rollouts adjusts these weights)
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: echo-rollouts, namespace: echo }
spec:
  hosts: [ "echo-stable.echo.svc.cluster.local" ]
  gateways: [ "mesh" ]
  http:
    - name: ab-test
      match:
        - headers:
            x-user-type:
              exact: beta
      route:
        - destination: { host: echo-canary.echo.svc.cluster.local, port: { number: 80 } }
          weight: 100
    - name: primary
      route:
        - destination: { host: echo-stable.echo.svc.cluster.local, port: { number: 80 } }
          weight: 100
        - destination: { host: echo-canary.echo.svc.cluster.local, port: { number: 80 } }
          weight: 0
---
# rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: echo, namespace: echo }
spec:
  replicas: 4
  selector:
    matchLabels: { app: echo }
  template:
    metadata:
      labels: { app: echo }
    spec:
      containers:
        - name: echo
          image: ghcr.io/your-org/echo-api:1.0.0
          ports: [ { containerPort: 8080 } ]
          readinessProbe:
            httpGet: { path: /health, port: 8080 }
            periodSeconds: 3
  strategy:
    canary:
      canaryService: echo-canary
      stableService: echo-stable
      trafficRouting:
        istio:
          virtualService:
            name: echo-rollouts
            routes: [ "primary", "ab-test" ]
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
---
# analysis.yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: success-rate, namespace: echo }
spec:
  metrics:
    - name: non-5xx-rate
      interval: 30s
      count: 3
      successCondition: result[0] >= 0.99
      failureLimit: 1
      provider:
        prometheus:
          address: http://kube-prometheus-stack-prometheus.observability.svc.cluster.local:9090
          query: |
            sum(rate(istio_requests_total{reporter="destination", destination_workload_namespace="echo", response_code!~"5.."}[1m]))
            /
            sum(rate(istio_requests_total{reporter="destination", destination_workload_namespace="echo"}[1m]))
```

Verification/DoD

- Watch canary: `kubectl --context <ctx> -n echo argo rollouts get r echo --watch`.
- Generate traffic inside the cluster:
  - `kubectl --context <ctx> -n echo run curl --rm -it --image=curlimages/curl -- sh`
  - `while true; do curl -sS http://echo-stable.echo.svc.cluster.local; sleep 0.2; done`
- A/B header test: `curl -sS -H 'x-user-type: beta' http://echo-stable.echo.svc.cluster.local` returns canary.
- Promotion succeeds when analysis passes. Abort rolls back to stable.

Previous: [Part 7](/posts/multi-region-series-part-7-cd/) · Next: [Part 8](/posts/multi-region-series-part-8-chaos/)
