---
title: "Multi-Region Cloud Training: Building the Baseline"
date: 2025-10-17T09:10:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-01-baseline/
---

Building systems across multiple regions is notoriously difficult. You have to navigate latency, configuration drift, and complex networking topologies. Before we dive into the fun stuff—like GitOps with Argo CD or cross-cluster routing with Istio—we need to establish a rock-solid foundation. 

In this lab series, we're going to build a realistic multi-region deployment from the ground up. 

**A quick note on cost:** Running a true multi-region architecture in AWS just for a training lab can get expensive quickly. To keep costs down while still learning the core concepts, we will mock our "regions" by using two separate Kubernetes clusters. Throughout this guide, we'll refer to our cluster contexts as `prod-us-east-1` and `prod-eu-west-1`.

### The Lay of the Land

Here is a high-level map of where we're starting. Over the next few chapters, we'll wire up Argo CD and Istio, but for now, we just have our local development environment, our GitHub repository, and a container registry.

```text
 [Dev Laptop]
    │  (task, kubectl)
    ▼
 [GitHub Repo]        [Container Registry]
        │                 │
        │ manifests       │ images
        ▼                 ▼
   (Soon: Argo CD and Istio mesh)

 Contexts: prod-us-east-1, prod-eu-west-1
```

### Standardizing with Taskfile

When you're constantly switching between clusters, it's incredibly easy to make a mistake and run a command in the wrong environment (we've all accidentally deployed to production instead of staging). To prevent this, we want to standardize our local commands so every step is repeatable and explicit. 

Instead of writing a collection of custom bash scripts that vary from project to project, we'll use a `Taskfile`. It wraps our common actions, explicitly defines our variables, and keeps our cognitive load low.

First, let's set up our `Taskfile.yml` at the root of our project. Notice how we explicitly map our US and EU cluster contexts here:

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
    desc: "List available Kubernetes contexts"
    cmds:
      - kubectl config get-contexts
  k:ver:
    desc: "Check Kubernetes versions across both regions"
    cmds:
      - kubectl --context {{.CTX_US}} version --short
      - kubectl --context {{.CTX_EU}} version --short
  docker:build:
    desc: "Build the application container"
    dir: app
    cmds:
      - docker build -t {{.IMAGE}} .
  docker:push:
    desc: "Push the application to the registry"
    dir: app
    cmds:
      - docker push {{.IMAGE}}
```

### Verifying the Foundation

With our Taskfile in place, let's make sure our environment is actually ready to go. Run the following command to check your contexts:

```bash
task ctx:list
```

You should see both `prod-us-east-1` and `prod-eu-west-1` in the output. 

Next, let's verify that we can talk to both clusters and that their versions match our expectations. This step ensures our authentication is working before we start trying to apply complex manifests.

```bash
task k:ver
```

If both clusters respond with their respective Kubernetes versions, our foundation is set. We have standardized our local tooling, defined our environments, and verified our access. 

In the next part, we'll introduce Argo CD and start deploying applications using GitOps so we never have to run `kubectl apply` manually again.

[Continue to Part 2: GitOps with Argo CD](/posts/multi-region-series-part-2-argocd/)
