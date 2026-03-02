---
title: "Multi-Region Cloud Training: Sample App and Overlays"
date: 2025-10-17T09:14:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-05-app/
---

We have our GitOps pipeline, our cross-cluster mesh, and secure IAM roles. Now, we actually need something to deploy. 

When deploying applications across multiple regions, you almost always run into the configuration drift problem. Ninety percent of your deployment manifest is identical (the container image, the ports, the health checks), but ten percent needs to be highly specific to the region (environment variables, database connection strings, resource limits).

Copying and pasting the entire `Deployment.yaml` into two different folders is a terrible idea. When you inevitably need to update a label or add a sidecar, you'll forget to update one of the copies. 

Instead, we'll use **Kustomize**. Kustomize allows us to define a shared "base" configuration and then apply region-specific "overlays" (patches) on top of it.

### The App: A Tiny HTTP Server

Let's start with the code. We just need a simple Go service that prints out the region it's running in. This will help us prove that our region-specific configuration is actually working.

```go
// app/main.go
package main

import (
  "fmt"
  "log"
  "net/http"
  "os"
)

func main() {
  region := os.Getenv("REGION")
  http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "ok region=%s\n", region)
  })
  
  fmt.Println("Starting server on :8080...")
  log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### The Base Configuration

Next, we define our base manifests. These are the building blocks that are true regardless of where the app runs. Notice that we leave the `REGION` environment variable somewhat generic here (falling back to the namespace name if nothing overrides it).

```yaml
# deploy/base/echo/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: echo
  template:
    metadata:
      labels:
        app: echo
    spec:
      serviceAccountName: aws-sa
      containers:
        - name: echo
          image: ghcr.io/your-org/echo-api:latest
          env:
            - name: REGION
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          ports:
            - containerPort: 8080
---
# deploy/base/echo/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: echo
spec:
  selector:
    app: echo
  ports:
    - port: 80
      targetPort: 8080
```

### The Regional Overlays

Here is where Kustomize shines. For our US deployment, we create an overlay. The `kustomization.yaml` tells Kustomize to start with the base folder, and then apply `patch.yaml` over the top of it.

```yaml
# deploy/overlays/us/echo/kustomization.yaml
bases:
  - "../../../base/echo"
namespace: echo
patchesStrategicMerge:
  - patch.yaml
```

Our patch is surgical. We don't need to redefine the replicas, the ports, or the service account. We just need to drill down to the specific `env` array and override the `REGION` value. Kustomize handles merging this cleanly into the base template.

```yaml
# deploy/overlays/us/echo/patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo
spec:
  template:
    spec:
      containers:
        - name: echo
          env:
            - name: REGION
              value: us
```
*(You would create an identical overlay structure for the `eu` region, setting the value to `eu`)*

### Verification

If you recall from Part 2, our Argo CD `ApplicationSet` is already looking for these overlay paths based on the cluster's region label. Once you commit this code, Argo CD will automatically sync the US overlay to the US cluster, and the EU overlay to the EU cluster.

To prove it worked, we can execute a curl command inside the clusters. 

In the US cluster, the pods should respond with `us`:
```bash
kubectl --context prod-us-east-1 -n echo exec -it deploy/echo -- curl -s echo.echo
# Output: ok region=us
```

And in the EU cluster, they should respond with `eu`:
```bash
kubectl --context prod-eu-west-1 -n echo exec -it deploy/echo -- curl -s echo.echo
# Output: ok region=eu
```

Our app is live, and our multi-region configuration strategy is clean, DRY (Don't Repeat Yourself), and manageable. 

[Previous: Part 4](/posts/multi-region-series-part-4-identity/) · [Continue to Part 6: CI with GitHub Actions](/posts/multi-region-series-part-6-ci/)
