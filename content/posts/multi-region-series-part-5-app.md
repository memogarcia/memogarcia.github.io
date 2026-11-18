---
title: "Multi-Region Cloud Training, Part 5: Sample App and Overlays"
date: 2025-10-17T09:14:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-05-app/
---

Across regions, most of a workload's manifests stay identical (image, ports, selectors) while a small set of fields varies by cluster (environment variables, replicas, resource limits). Duplicating `deployment.yaml` per region guarantees drift as soon as someone updates one copy and forgets the other.

Here we build a small Go HTTP service and split its Kubernetes manifests into a shared Kustomize base plus per-region overlays.

## Sample App and Container Build

Create `app/main.go`. It prints both `REGION` and `VERSION` so we can verify region overlays now and `v1`/`v2` traffic splits in Part 7.

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
	version := os.Getenv("VERSION")
	if version == "" {
		version = "v1"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "ok region=%s version=%s\n", region, version)
	})
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	log.Println("starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

Initialize the module (`cd app && go mod init echo-api`) and add a minimal `app/Dockerfile` so `task docker:build` from Part 1 can build it:

```dockerfile
# app/Dockerfile
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod main.go ./
RUN CGO_ENABLED=0 go build -o /echo-api .

FROM alpine:3.20
COPY --from=build /echo-api /usr/local/bin/echo-api
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/echo-api"]
```

Build and push the initial image before committing the manifests (`REGISTRY=ghcr.io/your-org TAG=v1 task docker:build docker:push`).

## Base Manifests

Create `deploy/base/echo/` with three files: `deployment.yaml`, `service.yaml`, and `kustomization.yaml`.

Notice two deliberate details in `deployment.yaml`:

- `REGION` uses a plain string `value: unknown` rather than `valueFrom`. If the base used `valueFrom` and a Strategic Merge Patch added `value: us`, Kustomize would merge both keys into the same `env` item and Kubernetes would reject the Pod spec (`valueFrom` cannot be set alongside `value`).
- `serviceAccountName: aws-sa` is commented out so the manifest runs on local clusters if you skipped Part 4. Uncomment it if you configured IRSA or EKS Pod Identity.

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
      version: v1
  template:
    metadata:
      labels:
        app: echo
        version: v1
    spec:
      # Uncomment if you configured aws-sa in Part 4
      # serviceAccountName: aws-sa
      containers:
        - name: echo
          image: ghcr.io/your-org/echo-api:v1
          env:
            - name: REGION
              value: unknown
            - name: VERSION
              value: v1
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            periodSeconds: 3
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
    - name: http
      port: 80
      targetPort: 8080
```

Add the base `kustomization.yaml` so overlays can reference `deploy/base/echo`:

```yaml
# deploy/base/echo/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
```

## Regional Overlays

Each region gets an overlay using modern Kustomize syntax (`resources` and `patches`, replacing the deprecated `bases` and `patchesStrategicMerge` fields).

```yaml
# deploy/overlays/us/echo/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: echo
resources:
  - ../../../base/echo
patches:
  - path: patch.yaml
```

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

Create the matching EU overlay under `deploy/overlays/eu/echo/` with `value: eu`. You can render either overlay locally before committing to verify the merged YAML:

```bash
kubectl kustomize deploy/overlays/us/echo
```

## Verification

Commit and push `deploy/base/echo/` and `deploy/overlays/{us,eu}/echo/`. The `ApplicationSet` from Part 2 watches `deploy/overlays/{{.metadata.labels.region}}/echo` and syncs each overlay to its matching cluster.

Verify responses from inside each cluster using an ephemeral curl pod (the `alpine` app image does not bundle `curl`):

```bash
kubectl --context prod-us-east-1 -n echo run curl --rm -it --restart=Never \
  --image=curlimages/curl -- curl -sS http://echo.echo.svc.cluster.local
# ok region=us version=v1

kubectl --context prod-eu-west-1 -n echo run curl --rm -it --restart=Never \
  --image=curlimages/curl -- curl -sS http://echo.echo.svc.cluster.local
# ok region=eu version=v1
```

If you completed Part 3, you can also verify cross-cluster routing from US to EU now:

```bash
kubectl --context prod-us-east-1 -n echo run curl --rm -it --restart=Never \
  --image=curlimages/curl -- curl -sS http://echo.eu.mesh.local
# ok region=eu version=v1
```

Next, we automate image builds and tag updates in GitHub Actions.

[Previous: Part 4](/posts/multi-region-series-part-4-identity/) · [Index](/posts/multi-region-learning/) · [Next: Part 6](/posts/multi-region-series-part-6-ci/)
