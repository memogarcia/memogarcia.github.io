---
title: "Multi-Region Cloud Training, Part 2: GitOps with Argo CD"
date: 2025-10-17T09:11:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-02-argocd/
---

Running `kubectl apply` by hand against two clusters leads to configuration drift and slow rollbacks. Here we set up Argo CD as a single control plane that watches Git and reconciles both clusters from cluster labels.

```text
 [GitHub Repo (manifests)]
          │
          ▼
   [Argo CD (control)]
        ╱      ╲
       ▼        ▼
 [Cluster US] [Cluster EU]
   (syncs us)   (syncs eu)
```

## Installing Argo CD and Registering Clusters

Install Argo CD in your control cluster (or both clusters using `task argocd:install:all` from the repo `Taskfile.yml`):

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

helm --kube-context prod-us-east-1 upgrade --install argocd argo/argo-cd \
  -n argocd --create-namespace \
  --set server.service.type=LoadBalancer \
  --wait
```

Log in with the Argo CD CLI before registering clusters (`argocd login <ARGOCD_SERVER>` using the initial password in secret `argocd-initial-admin-secret`, or port-forward `svc/argocd-server` locally).

Register both target clusters with an explicit `region` label. The `ApplicationSet` cluster generator reads labels from Argo CD's registered cluster Secrets in the `argocd` namespace, not from Kubernetes namespace labels.

```bash
argocd cluster add prod-us-east-1 --name prod-us --label region=us --yes
argocd cluster add prod-eu-west-1 --name prod-eu --label region=eu --yes
```

## Writing the ApplicationSet

Instead of maintaining a separate `Application` per cluster, an `ApplicationSet` templates one `Application` per registered cluster matching `region in [us, eu]` and selects its overlay path from `metadata.labels.region`.

Save this as `deploy/apps/echo-appset.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: echo-multicluster
  namespace: argocd
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
    - clusters:
        selector:
          matchExpressions:
            - key: region
              operator: In
              values: ["us", "eu"]
  template:
    metadata:
      name: 'echo-{{.name}}'
    spec:
      project: default
      destination:
        server: '{{.server}}'
        namespace: echo
      source:
        repoURL: https://github.com/your-org/your-repo
        targetRevision: main
        path: deploy/overlays/{{.metadata.labels.region}}/echo
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

A few details worth calling out:

- `goTemplate: true` with `missingkey=error` replaces the deprecated `fasttemplate` engine (`{{name}}`) and fails fast if a cluster is missing the `region` label.
- `CreateNamespace=true` ensures Argo CD creates the `echo` namespace on each target cluster before applying manifests.
- `path: deploy/overlays/{{.metadata.labels.region}}/echo` matches the `Deployment` overlays we build in Parts 5 through 7. In Part 7.1, when we migrate to Argo Rollouts, we switch to `deploy/rollouts/overlays/{{.metadata.labels.region}}` and add `ignoreDifferences` so `selfHeal: true` does not overwrite live traffic weights (see [deploy/apps/rollouts-appset.yaml](https://github.com/memogarcia/memogarcia.github.io/blob/master/deploy/apps/rollouts-appset.yaml) in this repo).

## Verification

Apply the `ApplicationSet` to your control cluster:

```bash
kubectl --context prod-us-east-1 -n argocd apply -f deploy/apps/echo-appset.yaml
```

List the generated applications:

```bash
argocd app list
```

You should see `echo-prod-us` and `echo-prod-eu`. Until we commit the overlay manifests in Part 5, both applications will show a sync error for the missing path; once Part 5 is pushed, their status should move to `Synced` and `Healthy`, and the `echo` namespace will exist in both clusters.

Next, we install Istio across both clusters and wire up cross-cluster traffic.

[Previous: Part 1](/posts/multi-region-series-part-1-baseline/) · [Index](/posts/multi-region-learning/) · [Next: Part 3](/posts/multi-region-series-part-3-istio/)
