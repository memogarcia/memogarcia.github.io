---
title: "Multi-Region Cloud Training, Part 8: Chaos Testing"
date: 2025-10-17T09:18:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-08-chaos/
---

Multiple replicas and traffic policies look reassuring in YAML, but you only find out how they behave by injecting faults while traffic is running. Here we install Chaos Mesh and run two experiments against the `echo` workload: scheduled pod kills and artificial network delay.

## Installing Chaos Mesh

Install Chaos Mesh in the US cluster (or in both clusters with `task chaos:install:all`):

```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm repo update

helm --kube-context prod-us-east-1 upgrade --install chaos-mesh chaos-mesh/chaos-mesh \
  -n chaos-testing \
  --create-namespace \
  --set dashboard.create=true \
  --set dnsServer.create=false \
  --set chaosDaemon.runtime=containerd \
  --set chaosDaemon.socketPath=/run/containerd/containerd.sock \
  --wait
```

If your cluster runs K3s, the containerd socket is usually `/run/k3s/containerd/containerd.sock`. The repo [Taskfile.yml](https://github.com/memogarcia/memogarcia.github.io/blob/master/Taskfile.yml) configures the socket path per cluster via `CHAOS_SOCKET_US` and `CHAOS_SOCKET_EU`.

## Experiment 1: Scheduled Pod Kills

A standalone Chaos Mesh `PodChaos` resource with `action: pod-kill` is a one-shot action that ignores `duration`: it deletes one pod immediately and stops. To kill one random `echo` pod every minute, wrap `PodChaos` in a `Schedule` CRD (`deploy/chaos/pod-kill.yaml`):

```yaml
# deploy/chaos/pod-kill.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: Schedule
metadata:
  name: kill-echo
  namespace: chaos-testing
spec:
  schedule: "@every 1m"
  concurrencyPolicy: Forbid
  type: PodChaos
  podChaos:
    action: pod-kill
    mode: one
    selector:
      namespaces: ["echo"]
      labelSelectors:
        app: echo
```

Apply it to US and run a request loop from an in-cluster pod:

```bash
kubectl --context prod-us-east-1 apply -f deploy/chaos/pod-kill.yaml

kubectl --context prod-us-east-1 -n echo run curl --rm -it --restart=Never \
  --image=curlimages/curl -- sh -c \
  'while true; do curl -sS -o /dev/null -w "%{http_code} %{time_total}s\n" http://echo-stable.echo.svc.cluster.local; sleep 0.2; done'
```

Watch `kubectl --context prod-us-east-1 -n echo get pods -w` in a second terminal. Because the `Rollout` (or `Deployment`) runs multiple replicas with readiness probes and Envoy retries transient connection resets by default, HTTP responses should remain `200` while Kubernetes replaces each terminated pod. Delete the schedule when finished (`kubectl --context prod-us-east-1 delete -f deploy/chaos/pod-kill.yaml`).

## Experiment 2: Network Latency Injection

Slow dependencies are harder to spot than dead pods because requests stay open and tie up client workers. Use `NetworkChaos` (`deploy/chaos/network-delay.yaml`) to inject a 200 ms delay with 50 ms of jitter into `echo` pods for one minute:

```yaml
# deploy/chaos/network-delay.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: delay-echo
  namespace: chaos-testing
spec:
  action: delay
  mode: all
  selector:
    namespaces: ["echo"]
    labelSelectors:
      app: echo
  delay:
    latency: "200ms"
    jitter: "50ms"
  duration: "1m"
```

Apply `deploy/chaos/network-delay.yaml` while the `curl` loop above is running. You should see `time_total` jump by ~0.2 s immediately and drop back down after one minute. Check Prometheus or Grafana (`istio_request_duration_milliseconds_bucket`) to confirm the latency spike shows up clearly in your p95 and p99 curves.

Notice an important boundary of our setup: latency alone will **not** fail over local US requests to EU. As noted in Part 3, our explicit `ServiceEntry` (`echo.eu.mesh.local`) is a separate hostname rather than an automatic failover pool for `echo-stable.echo.svc.cluster.local`, and `outlierDetection` ejects endpoints on consecutive 5xx errors rather than high latency. If you want automated regional failover under network degradation, you need cross-cluster endpoint discovery (`istioctl create-remote-secret`), client request timeouts that turn slow calls into 504s, and `outlierDetection` on the shared `DestinationRule`.

Next, we run sustained load with k6 inside the cluster and check latency against explicit SLO thresholds.

[Previous: Part 7.1](/posts/multi-region-series-part-7a-rollouts/) · [Index](/posts/multi-region-learning/) · [Next: Part 9](/posts/multi-region-series-part-9-load/)
