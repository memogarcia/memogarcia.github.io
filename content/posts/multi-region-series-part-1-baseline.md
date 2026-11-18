---
title: "Multi-Region Cloud Training, Part 1: Baseline Repo and Environments"
date: 2025-10-17T09:10:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-01-baseline/
---

Working across two clusters makes it easy to run a command against the wrong context. Before installing Argo CD or Istio, we lock down cluster names, container image variables, and repeatable local commands.

**Cost note:** Running a true multi-region AWS setup for a training lab gets expensive fast. This series mocks two regions with two separate Kubernetes clusters (for example, local `kind` or `k3d` clusters) named `prod-us-east-1` and `prod-eu-west-1`.

## Starting Layout

```text
 [Dev Laptop]
    │  (task, kubectl)
    ▼
 [GitHub Repo]        [Container Registry]
        │                 │
        │ manifests       │ images
        ▼                 ▼
   (Next: Argo CD and Istio mesh)

 Contexts: prod-us-east-1, prod-eu-west-1
```

## Standardizing Commands with Taskfile

Instead of relying on your current `kubectl` context or ad-hoc shell scripts, wrap repeated commands in a root `Taskfile.yml`. Every command passes `--context` explicitly.

Variable order matters in Task v3: `GIT_SHA` must appear before `TAG`, and `TAG` before `IMAGE`, because root `vars` are evaluated top to bottom. Wrapping variables with `default` lets you override `REGISTRY`, `TAG`, or cluster contexts from the environment or CLI (`REGISTRY=ghcr.io/my-org TAG=v1 task docker:build`).

```yaml
# Taskfile.yml
version: '3'
vars:
  REGISTRY: '{{.REGISTRY | default "ghcr.io/your-org"}}'
  APP: '{{.APP | default "echo-api"}}'
  GIT_SHA: { sh: "git rev-parse --short HEAD || echo dev" }
  TAG: '{{.TAG | default .GIT_SHA}}'
  IMAGE: '{{.REGISTRY}}/{{.APP}}:{{.TAG}}'
  CTX_US: '{{.CTX_US | default "prod-us-east-1"}}'
  CTX_EU: '{{.CTX_EU | default "prod-eu-west-1"}}'

tasks:
  ctx:list:
    desc: "List available Kubernetes contexts"
    cmds:
      - kubectl config get-contexts
  k:ver:
    desc: "Check Kubernetes versions across both clusters"
    cmds:
      - kubectl --context {{.CTX_US}} version
      - kubectl --context {{.CTX_EU}} version
  docker:build:
    desc: "Build the application container"
    dir: app
    cmds:
      - docker build -t {{.IMAGE}} .
  docker:push:
    desc: "Push the application container to the registry"
    dir: app
    cmds:
      - docker push {{.IMAGE}}
```

Note that `kubectl version` no longer accepts `--short` (it was removed in Kubernetes 1.28; concise output is now the default).

## Verification

Confirm both contexts exist in your kubeconfig:

```bash
task ctx:list
```

You should see `prod-us-east-1` and `prod-eu-west-1`.

Next, confirm both API servers are reachable and authentication works:

```bash
task k:ver
```

Both contexts should print client and server versions. Next, we install Argo CD and wire both clusters to an `ApplicationSet`.

[Index](/posts/multi-region-learning/) · [Next: Part 2](/posts/multi-region-series-part-2-argocd/)
