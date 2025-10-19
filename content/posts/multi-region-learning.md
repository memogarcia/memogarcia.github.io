---
title: "Multi region cloud training"
date: 2025-10-17T09:00:00-07:00
draft: false
---

Train teams on multi region, high throughput, chaos tested GitOps without burning money.

Assumptions/Constraints

- Money note: We mock “multi region” with two Kubernetes clusters, not two AWS regions.
- You have two kube contexts reachable from your workstation.
- You control a container registry and a GitHub repo.
- Optional AWS: use IRSA or EKS Pod Identity in Lab 4.

Labs

- [Part 1 - Baseline Repo and Environments](/posts/multi-region-series-part-1-baseline/)
  Sets shared variables and `task` wrappers. Confirms contexts and versions.
- [Part 2 - GitOps with Argo CD](/posts/multi-region-series-part-2-argocd/)
  Installs Argo CD and deploys one app to both clusters with ApplicationSet.
- [Part 3 - Istio Multi Region Mesh](/posts/multi-region-series-part-3-istio/)
  Installs Istio with a single mesh across clusters and an east west gateway.
- [Part 4 - AWS Identity (IRSA and Pod Identity)](/posts/multi-region-series-part-4-identity/)
  Gives pods AWS creds with IRSA or Pod Identity. Includes when to choose which.
- [Part 5 - Sample App and Overlays](/posts/multi-region-series-part-5-app/)
  Deploys a tiny HTTP service with region specific overlays.
- [Part 6 - CI with GitHub Actions and Taskfile](/posts/multi-region-series-part-6-ci/)
  Builds and pushes images with CI that mirrors local `task` commands.
- [Part 7 - CD with Istio and Argo CD](/posts/multi-region-series-part-7-cd/)
  Adds connection pools, outlier detection, and traffic splitting.
- [Part 8 - Chaos Testing](/posts/multi-region-series-part-8-chaos/)
  Kills pods and injects latency to prove resilience.
- [Part 9 - Load and SLOs](/posts/multi-region-series-part-9-load/)
  Generates load with k6 and checks p95 and p99 across clusters.

How to Use

1) Set two contexts. Example: `prod-us-east-1` and `prod-eu-west-1`.
2) Work through Part 1 then follow in order. Each lab is self contained and runnable.
3) Swap in kind or k3d for local clusters to keep spend near zero.
4) In Part 4 choose one identity path. IRSA covers EKS, Fargate, and other clusters with an OIDC provider. Pod Identity is EKS only and requires Linux EC2 nodes.

ASCII Diagram (full architecture)

```
 [Dev Laptop]
     |  task, kubectl, helm
     v
 [GitHub Repo] -----> [GitHub Actions CI] ---> [Registry (GHCR/ECR)]
        |                    |                        |
        | manifests          | pushes image           |
        v                    v                        v
                   [GitOps Manifests (deploy/*)]
                            |
                            v
                     [Argo CD (control)]
                         /         \
                        v           v
                 +-----------------------+      +-----------------------+
                 |  Cluster: US         |      |  Cluster: EU         |
                 |  ns echo             |      |  ns echo             |
                 |  istiod              |      |  istiod              |
                 |  east-west gateway   |<====>|  east-west gateway   |
                 |  echo v1/v2 (sidecar)|      |  echo v1/v2 (sidecar)|
                 |  VS/DR (LB, retries) |      |  VS/DR (LB, retries) |
                 |  Chaos Mesh + k6     |      |  Chaos Mesh + k6     |
                 +-----------------------+      +-----------------------+

 Identity per pod (optional):
   [Pod + SA aws-sa]
      |  IRSA: OIDC token -> STS AssumeRoleWithWebIdentity -> creds
      |  Pod Identity: EKS agent -> STS AssumeRole -> creds
      v
   [AWS APIs]

 Notes: multi network meshID=training-mesh, trustDomain=corp.local; cross cluster via gateway + ServiceEntry.
```

Verification/DoD

- By the end of Lab 9, you can shift traffic, inject failure, and measure latency across two clusters.

Taskfile targets in this repo

- `task k:ver` prints cluster versions for both contexts.
- `task istio:install:all` installs Istio control plane in both clusters.
- `task istio:gw:all` installs an east west gateway in both clusters.
- `task argocd:install:all` installs Argo CD in both clusters.
- `task chaos:install:all` installs Chaos Mesh in both clusters.
- `task obs:install:all` installs Prometheus, Grafana, and Kiali in both clusters.

Source files

- Taskfile: https://github.com/memogarcia/memogarcia.github.io/blob/master/Taskfile.yml
- Istio values: https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/istio/values-istio.yaml
- Istio east west gateway values: https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/istio/gateway-eastwest-values.yaml
