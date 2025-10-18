---
title: "Multi region cloud training Lab 9/9: Load Generation and SLOs"
date: 2025-10-18T09:18:00-07:00
draft: false
---

Problem: Prove throughput and latency targets across clusters.

Assumptions/Constraints

- Cost note: Two clusters represent regions.
- Run `k6` as a Job inside each cluster to test in region and cross region paths.

ASCII Diagram

```
 [k6 Job in US] ---> http://echo.echo.svc.cluster.local (US svc)
 [k6 Job in EU] ---> http://echo.echo.svc.cluster.local (EU svc)

 Measure:
   - in region p95/p99
   - cross region p95/p99 (by hitting remote via gateway if desired)
```

Steps

1) Create a ConfigMap with a k6 script.
2) Run a Job that mounts it and reports.

Example

```javascript
// deploy/tools/k6/script.js
import http from 'k6/http';
import { sleep } from 'k6';
export const options = { vus: 200, duration: '3m' };
export default function() {
  const res = http.get('http://echo.echo.svc.cluster.local/');
  sleep(0.1);
}
```

```yaml
# deploy/tools/k6/job.yaml
apiVersion: batch/v1
kind: Job
metadata: { name: k6-echo, namespace: echo }
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: k6
          image: grafana/k6:0.51.0
          args: [ "run", "/scripts/script.js" ]
          volumeMounts:
            - name: scripts
              mountPath: /scripts
      volumes:
        - name: scripts
          configMap:
            name: k6-scripts
---
apiVersion: v1
kind: ConfigMap
metadata: { name: k6-scripts, namespace: echo }
data:
  script.js: |
    import http from 'k6/http';
    import { sleep } from 'k6';
    export const options = { vus: 200, duration: '3m' };
    export default function() { http.get('http://echo.echo.svc.cluster.local/'); sleep(0.1); }
```

Verification/DoD

- k6 completes with acceptable error rate and p95 latency.
- Repeat in both clusters. Compare in region and cross region p95 and p99.

Previous: [Lab 8](/posts/multi-region-series-08-chaos/)
Back to the index → [/posts/multi-region-learning/](/posts/multi-region-learning/)
