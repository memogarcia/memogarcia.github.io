---
title: "Multi-Region Cloud Training: Load Generation and SLOs"
date: 2025-10-17T09:17:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-09-load/
---

We've reached the final stage of our multi-region deployment lab. We have GitOps, service meshes, dynamic IAM, progressive delivery, and chaos testing. But none of that matters if the application falls over the moment it receives real user traffic.

To prove our architecture is ready for production, we need to test it under load and measure our latency against our Service Level Objectives (SLOs). 

Instead of running a load testing tool from our laptops (which introduces internet latency and local network bottlenecks into the results), we are going to run our load generator directly inside the Kubernetes clusters.

### Enter k6

We'll use **k6** by Grafana. It's a modern, developer-friendly load testing tool that uses JavaScript to define test scenarios.

We want to run k6 as a Kubernetes `Job` in both the US and EU clusters. This allows us to measure two distinct paths:
1. **In-region latency:** The time it takes a US pod to talk to another US pod.
2. **Cross-region latency:** The time it takes a US pod to talk to an EU pod across our Istio East-West Gateway (using the cross-cluster DNS we set up in Part 3).

### Writing the k6 Script

We'll store our k6 script in a `ConfigMap` so the Job can mount it as a volume. 

The script is simple: we simulate 200 concurrent virtual users continuously hitting our service for 3 minutes.

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
    
    // Simulate 200 concurrent users for 3 minutes
    export const options = { 
      vus: 200, 
      duration: '3m' 
    };
    
    export default function() { 
      // Hit the local service
      http.get('http://echo.echo.svc.cluster.local/'); 
      sleep(0.1); 
    }
```

### Deploying the Load Generator

Now we define the Kubernetes `Job` that executes the script.

```yaml
# deploy/tools/k6/job.yaml
apiVersion: batch/v1
kind: Job
metadata: 
  name: k6-echo
  namespace: echo
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
```

### Verification and Analysis

Apply the ConfigMap and Job to your cluster. To view the results, follow the logs of the k6 pod:

```bash
kubectl --context prod-us-east-1 -n echo logs -l job-name=k6-echo -f
```

At the end of the 3 minutes, k6 will output a comprehensive summary. Look closely at the `http_req_duration` metric. This tells you your p95 and p99 latency. 

**The real test:** Update your `script.js` to point to `http://echo.eu.mesh.local` (your cross-cluster routing entry) instead of the local service. Run the Job again. 

Compare the p95 latency of the local request vs the cross-region request. This delta is the physical cost of the speed of light between your two data centers, plus the overhead of the Istio East-West Gateways encrypting and decrypting the traffic. 

If these numbers are within your defined Service Level Objectives (SLOs), congratulations. You have successfully architected, deployed, and verified a highly available, multi-region cloud application.

[Previous: Part 8](/posts/multi-region-series-part-8-chaos/)
[Back to the index →](/posts/multi-region-learning/)
