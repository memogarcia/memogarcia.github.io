---
title: "Multi region cloud training Lab 5/9: Sample App and Overlays"
date: 2025-10-17T09:14:00-07:00
draft: false
---

Problem: Deploy a simple HTTP service with region specific config.

Assumptions/Constraints

- Cost note: Two clusters represent regions.
- Use Kustomize overlays keyed by region label.

ASCII Diagram

```
  Kustomize structure

  deploy/
    base/echo/           -> common Deployment, Service
    overlays/
      us/echo/          -> patch: REGION=us
      eu/echo/          -> patch: REGION=eu

  Argo CD picks overlay by cluster label and syncs to each cluster.
```

Steps

1) Create a tiny HTTP server.
2) Add base manifests and overlays.

Example app (app/main.go)

```go
package main
import (
  "fmt"; "log"; "net/http"; "os"
)
func main(){
  region := os.Getenv("REGION")
  http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request){
    fmt.Fprintf(w, "ok region=%s\n", region)
  })
  log.Fatal(http.ListenAndServe(":8080", nil))
}
```

Base (deploy/base/echo)

```yaml
# deploy/base/echo/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: echo }
spec:
  replicas: 3
  selector: { matchLabels: { app: echo } }
  template:
    metadata: { labels: { app: echo } }
    spec:
      serviceAccountName: aws-sa
      containers:
        - name: echo
          image: ghcr.io/your-org/echo-api:latest
          env:
            - name: REGION
              valueFrom:
                fieldRef: { fieldPath: metadata.namespace }
          ports: [ { containerPort: 8080 } ]
---
# deploy/base/echo/service.yaml
apiVersion: v1
kind: Service
metadata: { name: echo }
spec:
  selector: { app: echo }
  ports: [ { port: 80, targetPort: 8080 } ]
```

Overlays

```yaml
# deploy/overlays/us/echo/kustomization.yaml
bases: [ "../../../base/echo" ]
namespace: echo
patchesStrategicMerge:
  - patch.yaml
---
# deploy/overlays/us/echo/patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: echo }
spec:
  template:
    spec:
      containers:
        - name: echo
          env:
            - name: REGION
              value: us
```

Verification/DoD

- `kubectl --context prod-us-east-1 -n echo get deploy echo` shows 3 replicas.
- `kubectl --context prod-eu-west-1 -n echo exec -it deploy/echo -- curl -s echo.echo` prints `ok region=eu`.

Previous: [Lab 4](/posts/multi-region-series-04-identity/) · Next: [Lab 6](/posts/multi-region-series-06-ci/)
