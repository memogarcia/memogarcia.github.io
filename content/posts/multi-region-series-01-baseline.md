---
title: "Multi region cloud training Lab 1/9: Baseline Repo and Environments"
date: 2025-10-18T09:10:00-07:00
draft: false
---

Problem: Standardize local commands and name the moving parts so every step is repeatable.

Assumptions/Constraints

- Cost note: We mock “multi region” by using two Kubernetes clusters, not two AWS regions.
- App code in `app/`, manifests in `deploy/`.
- Kube contexts: `prod-us-east-1`, `prod-eu-west-1`.

ASCII Diagram

```
 [Dev Laptop]
    |  task, kubectl
    v
 [GitHub Repo]        [Registry]
        |                 |
        | manifests       | images
        v                 v
   (next chapters wire Argo CD and Istio)

 Contexts: prod-us-east-1, prod-eu-west-1
```

Steps

1) Create a Taskfile to wrap common actions.
2) Set environment variables for registry and app name.
3) Confirm contexts and Kubernetes versions.

Example (Taskfile.yml)

```yaml
version: '3'
vars:
  REGISTRY: "ghcr.io/your-org"
  APP: "echo-api"
  IMAGE: "{{.REGISTRY}}/{{.APP}}:{{.TAG}}"
  TAG: "{{.TAG | default .GIT_SHA}}"
  GIT_SHA: { sh: "git rev-parse --short HEAD" }
  CTX_US: "prod-us-east-1"
  CTX_EU: "prod-eu-west-1"
tasks:
  ctx:list:
    cmds:
      - kubectl config get-contexts
  k:ver:
    cmds:
      - kubectl --context {{.CTX_US}} version --short
      - kubectl --context {{.CTX_EU}} version --short
  docker:build:
    dir: app
    cmds:
      - docker build -t {{.IMAGE}} .
  docker:push:
    dir: app
    cmds:
      - docker push {{.IMAGE}}
```

Verification/DoD

- `task ctx:list` shows both contexts.
- `task k:ver` returns versions for both clusters.

Next: [Lab 2](/posts/multi-region-series-02-argocd/)
