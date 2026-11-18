---
title: "Multi-Region Cloud Training, Part 9: Load Generation and SLOs"
date: 2025-10-17T09:19:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-09-load/
---

Running a load generator from a laptop mixes home ISP jitter and client-side bottlenecks into your measurements. Here we run **k6** as a Kubernetes `Job` inside the cluster with explicit SLO thresholds so we can compare two paths directly:

1. **In-cluster latency:** US pod calling `http://echo-stable.echo.svc.cluster.local/` (or `http://echo.echo.svc.cluster.local/` if you skipped Part 7.1).
2. **Cross-cluster latency:** US pod calling `http://echo.eu.mesh.local/` across the Istio east-west gateway from Part 3.

## k6 Script With SLO Thresholds

Store the script in a `ConfigMap` (`deploy/tools/k6/script-configmap.yaml`). The `thresholds` block turns your SLO targets into pass/fail checks (`p95 < 100 ms`, `p99 < 250 ms`, error rate `< 1%`); k6 exits non-zero if any threshold is breached.

```yaml
# deploy/tools/k6/script-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: k6-scripts
  namespace: echo
data:
  script.js: |
    import http from 'k6/http';
    import { sleep } from 'k6';

    export const options = {
      vus: 200,
      duration: '3m',
      thresholds: {
        http_req_duration: ['p(95)<100', 'p(99)<250'],
        http_req_failed: ['rate<0.01'],
      },
    };

    export default function() {
      http.get('http://echo-stable.echo.svc.cluster.local/');
      sleep(0.1);
    }
```

## Load Generator Job

Mount the `ConfigMap` into a `batch/v1` `Job` (`deploy/tools/k6/job.yaml`):

```yaml
# deploy/tools/k6/job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: k6-echo
  namespace: echo
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: k6
          image: grafana/k6:0.51.0
          args: ["run", "/scripts/script.js"]
          volumeMounts:
            - name: scripts
              mountPath: /scripts
      volumes:
        - name: scripts
          configMap:
            name: k6-scripts
```

**Istio sidecar note:** Because `k6-echo` runs in the `istio-injection=enabled` `echo` namespace, it gets an `istio-proxy` sidecar. We want that sidecar so k6 can resolve `echo.eu.mesh.local` and originate mTLS. On Istio 1.27+ with Kubernetes 1.28+ native sidecars, `istio-proxy` exits automatically when `k6` finishes. On older Istio versions, the Job pod stays `Running` after `k6` exits unless you shut the proxy down via `http://127.0.0.1:15020/quitquitquit` (or delete the Job once the summary finishes printing).

## Running and Comparing Both Paths

Apply the `ConfigMap` and `Job` to US:

```bash
kubectl --context prod-us-east-1 apply -f deploy/tools/k6/script-configmap.yaml
kubectl --context prod-us-east-1 apply -f deploy/tools/k6/job.yaml
```

Stream logs from the `k6` container explicitly with `-c k6` (omitting `-c k6` fails because the pod contains both `k6` and `istio-proxy`):

```bash
kubectl --context prod-us-east-1 -n echo logs -l job-name=k6-echo -c k6 -f
```

After 3 minutes, k6 prints `http_req_duration` (`avg`, `med`, `p(90)`, `p(95)`) and threshold pass/fail status.

Next, update `http.get(...)` in `deploy/tools/k6/script-configmap.yaml` to `http://echo.eu.mesh.local/` and re-apply the `ConfigMap`. Because Kubernetes `Job` specs are immutable once created, delete the previous `Job` before running it again:

```bash
kubectl --context prod-us-east-1 apply -f deploy/tools/k6/script-configmap.yaml
kubectl --context prod-us-east-1 -n echo delete job k6-echo --ignore-not-found
kubectl --context prod-us-east-1 apply -f deploy/tools/k6/job.yaml
kubectl --context prod-us-east-1 -n echo logs -l job-name=k6-echo -c k6 -f
```

Compare local versus cross-cluster `p(95)` and `p(99)`:

- On two local clusters (`kind` or `k3d`), the delta isolates the extra hop through the east-west gateway and mTLS termination/re-encryption.
- Across two real cloud regions, the delta is dominated by inter-region network RTT on top of that gateway overhead.

Adjust your SLO thresholds accordingly so in-region and cross-region paths are evaluated against realistic budgets.

[Previous: Part 8](/posts/multi-region-series-part-8-chaos/) · [Index](/posts/multi-region-learning/)
