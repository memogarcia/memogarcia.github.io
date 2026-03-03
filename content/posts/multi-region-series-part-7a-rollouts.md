---
title: "Chapter 7.1: Multi-Region Cloud Training - Progressive Delivery with Argo Rollouts"
date: 2025-10-19T10:45:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-07a-rollouts/
---

In the previous section, we manually configured Istio to split traffic between two versions. While powerful, doing this by hand for every release is a fast track to burnout. 

We want an automated controller that says: *"Deploy the new version, send 10% of traffic to it, wait a minute, check Prometheus to see if the error rate spiked. If it looks good, increase to 50%. If it fails, instantly roll back to the old version."*

This process is called Progressive Delivery, and we're going to implement it using **Argo Rollouts**.

### Enter the Rollout Resource

Argo Rollouts replaces the standard Kubernetes `Deployment` object with a custom `Rollout` object. It natively understands how to talk to Istio to adjust traffic weights, and it can query metrics providers (like Prometheus) to make automated promotion decisions.

First, you'll need to install the Argo Rollouts controller in both of your clusters. We've added tasks for this:
```bash
task rollouts:install:all
```
*(Tip: Install the CLI plugin locally with `brew install argoproj/tap/kubectl-argo-rollouts` for an excellent terminal UI).*

### Redesigning the Architecture

To make this work, Argo Rollouts requires two distinct Kubernetes `Services`: a "stable" service and a "canary" service. The Rollout controller dynamically updates the pod selectors on these services as it progresses through the release.

```yaml
# services.yaml
apiVersion: v1
kind: Service
metadata: { name: echo-stable, namespace: echo }
spec:
  selector: { app: echo } # Rollout manages this selector
  ports: [ { port: 80, targetPort: 8080 } ]
---
apiVersion: v1
kind: Service
metadata: { name: echo-canary, namespace: echo }
spec:
  selector: { app: echo } # Rollout manages this selector
  ports: [ { port: 80, targetPort: 8080 } ]
```

Next, we update our Istio `VirtualService`. Instead of hardcoding the weights like we did in Part 7, we set them to 100/0. We are telling Istio the baseline state, and **Argo Rollouts will programmatically modify this VirtualService** in real-time during a release.

We've also added a cool feature here: an A/B testing route. Anyone sending the header `x-user-type: beta` will skip the weight logic entirely and get routed directly to the canary pods.

```yaml
# virtualservice.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: echo-rollouts, namespace: echo }
spec:
  hosts: [ "echo-stable.echo.svc.cluster.local" ]
  gateways: [ "mesh" ]
  http:
    # A/B Test: Force beta users to the canary
    - name: ab-test
      match:
        - headers:
            x-user-type:
              exact: beta
      route:
        - destination: { host: echo-canary.echo.svc.cluster.local, port: { number: 80 } }
          weight: 100
    # Primary Route: Argo Rollouts manages these weights
    - name: primary
      route:
        - destination: { host: echo-stable.echo.svc.cluster.local, port: { number: 80 } }
          weight: 100
        - destination: { host: echo-canary.echo.svc.cluster.local, port: { number: 80 } }
          weight: 0
```

### The Rollout Strategy

Now, the main event. We define our `Rollout` object. Notice the `strategy` block. We explicitly define the steps: set weight to 10%, pause for 60 seconds, run an automated Analysis, set weight to 25%, pause, and so on.

```yaml
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
        # Automated safety check
        - analysis:
            templates:
              - templateName: success-rate
        - setWeight: 25
        - pause: { duration: 60 }
        - setWeight: 50
        - pause: { duration: 60 }
```

### The Automated Safety Check (AnalysisTemplate)

How does Argo Rollouts know if the canary is healthy? We define an `AnalysisTemplate`. This tells the controller how to query Prometheus and what constitutes "success". 

In this case, we query Istio's built-in metrics. If the non-5xx success rate drops below 99% during the canary phase, the rollout will automatically abort and route 100% of traffic back to the stable pods.

```yaml
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

### Verification

To trigger a rollout, simply change the image tag in your Kustomize overlays and commit. Argo CD will sync the new template, and Argo Rollouts will take over.

Watch the magic happen using the CLI tool:
```bash
kubectl --context prod-us-east-1 -n echo argo rollouts get rollout echo --watch
```

While it's running, you can test the A/B routing header we configured earlier:
```bash
curl -sS -H 'x-user-type: beta' http://echo-stable.echo.svc.cluster.local
```

If the Prometheus metrics are healthy, the rollout will progress to 100% and the new version becomes "stable". If the app starts throwing 500 errors, the controller will abort and retreat to safety. We have achieved safe, automated, progressive delivery across multiple regions.

[Previous: Part 7](/posts/multi-region-series-part-7-cd/) · [Continue to Part 8: Chaos Testing](/posts/multi-region-series-part-8-chaos/)
