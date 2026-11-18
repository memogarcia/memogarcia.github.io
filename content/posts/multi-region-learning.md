---
title: "Multi-Region Cloud Training"
date: 2025-10-17T09:00:00-07:00
draft: false
---

Hands-on lab notes for practicing multi-region Kubernetes, GitOps, Istio cross-cluster routing, progressive delivery, chaos testing, and load testing without paying for two cloud regions.

## Assumptions and Constraints

- Cost boundary: this series mocks "multi-region" with two Kubernetes clusters (for example, `kind` or `k3d`), not two AWS regions.
- You have two kube contexts reachable from your workstation: `prod-us-east-1` and `prod-eu-west-1`.
- You control a container registry and a GitHub repository.
- Part 4 (AWS IAM) is optional if you are running local clusters.

## Labs

- [Part 1: Baseline Repo and Environments](/posts/multi-region-series-part-1-baseline/)
  Sets shared variables and `task` wrappers. Confirms cluster contexts and versions.
- [Part 2: GitOps with Argo CD](/posts/multi-region-series-part-2-argocd/)
  Installs Argo CD, registers both clusters with region labels, and deploys across them with an `ApplicationSet`.
- [Part 3: Istio Multi-Region Mesh](/posts/multi-region-series-part-3-istio/)
  Installs Istio across two networks with east-west gateways, mTLS routing, and `ServiceEntry` wiring.
- [Part 4: AWS Identity (IRSA vs Pod Identity)](/posts/multi-region-series-part-4-identity/)
  Grants pods temporary AWS credentials with IRSA or EKS Pod Identity, with the tradeoffs for each.
- [Part 5: Sample App and Overlays](/posts/multi-region-series-part-5-app/)
  Deploys a small Go HTTP service with region-specific Kustomize overlays.
- [Part 6: CI with GitHub Actions and Taskfile](/posts/multi-region-series-part-6-ci/)
  Builds and pushes images in CI using the same `task` commands you run locally, then updates the Kustomize image tag.
- [Part 7: CD with Istio Traffic Policy](/posts/multi-region-series-part-7-cd/)
  Adds connection pools, outlier detection, and weighted traffic splits across `v1` and `v2`.
- [Part 7.1: Progressive Delivery with Argo Rollouts](/posts/multi-region-series-part-7a-rollouts/)
  Replaces the `Deployment` with an Argo `Rollout` for automated canary steps, header-based routing, and Prometheus analysis.
- [Part 8: Chaos Testing](/posts/multi-region-series-part-8-chaos/)
  Schedules recurring pod kills and injects network latency with Chaos Mesh.
- [Part 9: Load Generation and SLOs](/posts/multi-region-series-part-9-load/)
  Runs k6 inside the cluster with SLO thresholds to compare in-cluster and cross-cluster p95 and p99 latency.

## How to Use

1. Configure two kube contexts (`prod-us-east-1` and `prod-eu-west-1`). Local `kind` or `k3d` clusters keep spend near zero.
2. Start at Part 1 and work in order. Parts 5 through 7 build a `Deployment`-based app under `deploy/overlays/`; Part 7.1 migrates it to `deploy/rollouts/` for Argo Rollouts.
3. In Part 4, pick one AWS identity path if you are on AWS. IRSA works on EKS, Fargate, and clusters with an OIDC provider. EKS Pod Identity is EKS-only and requires Linux EC2 nodes.

## Architecture

```text
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
                 |  Cluster: US          |      |  Cluster: EU          |
                 |  ns echo              |      |  ns echo              |
                 |  istiod               |      |  istiod               |
                 |  east-west gateway    |<====>|  east-west gateway    |
                 |  echo (sidecar)       | mTLS |  echo (sidecar)       |
                 |  VS/DR (pool/outlier) |      |  VS/DR (pool/outlier) |
                 |  Chaos Mesh + k6      |      |  Chaos Mesh + k6      |
                 +-----------------------+      +-----------------------+

 Identity per pod (optional, AWS):
   [Pod + SA aws-sa]
      |  IRSA: OIDC token -> STS AssumeRoleWithWebIdentity -> creds
      |  Pod Identity: EKS agent -> EKS Auth AssumeRoleForPodIdentity -> STS -> creds
      v
   [AWS APIs]

 Notes: multi-network meshID=training-mesh, trustDomain=corp.local;
 cross-cluster routing via east-west gateway, Gateway/VirtualService, and ServiceEntry.
```

## Verification

By the end of Part 9, you can sync region-specific manifests to two clusters, roll out an image with automated canary checks, inject pod kills and latency, and measure local versus cross-cluster latency against k6 thresholds.

## Taskfile Targets in This Repo

- `task k:ver` prints client and server versions for both contexts.
- `task istio:install:all` installs `istio-base` and `istiod` in both clusters.
- `task istio:gw:all` installs the east-west gateway in both clusters on port `15443`.
- `task argocd:install:all` installs Argo CD in both clusters.
- `task obs:install:all` installs `kube-prometheus-stack`, an Envoy `PodMonitor`, and Kiali in both clusters.
- `task rollouts:install:all` installs the Argo Rollouts controller in both clusters.
- `task rollouts:apply:all` applies the Rollouts overlays directly to both clusters.
- `task chaos:install:all` installs Chaos Mesh in both clusters.

## Source Files

- [Taskfile.yml](https://github.com/memogarcia/memogarcia.github.io/blob/master/Taskfile.yml)
- [deploy/istio/values-istio.yaml](https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/istio/values-istio.yaml)
- [deploy/istio/gateway-eastwest-values.yaml](https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/istio/gateway-eastwest-values.yaml)
- [deploy/istio/podmonitor.yaml](https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/istio/podmonitor.yaml)
- [deploy/apps/rollouts-appset.yaml](https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/apps/rollouts-appset.yaml)
