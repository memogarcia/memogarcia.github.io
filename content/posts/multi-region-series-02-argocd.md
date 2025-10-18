---
title: "Multi region cloud training Lab 2/9: GitOps with Argo CD"
date: 2025-10-17T09:11:00-07:00
draft: false
---

Problem: Deploy one app to many clusters using a single source of truth.

Assumptions/Constraints

- Cost note: We mock regions with two clusters.
- Argo CD runs in each cluster or as a control cluster.
- Use ApplicationSet clusters generator.

ASCII Diagram

```
 [GitHub Repo (manifests)]
          |
          v
   [Argo CD (control)]
        /      \
       v        v
 [Cluster US] [Cluster EU]
    ns echo       ns echo
    apps synced   apps synced
```

Steps

1) Label clusters for region selection.
2) Register clusters in Argo CD.
3) Create a Project and ApplicationSet that targets both clusters.

Example

```bash
# Label cluster objects for selection
kubectl --context prod-us-east-1 label ns kube-system region=us --overwrite
kubectl --context prod-eu-west-1 label ns kube-system region=eu --overwrite

# Register clusters in Argo CD (run in control plane that hosts Argo CD CLI context)
argocd cluster add prod-us-east-1 --name prod-us --yes
argocd cluster add prod-eu-west-1 --name prod-eu --yes
```

ApplicationSet (deploy/apps/echo-appset.yaml)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: echo-multicluster
  namespace: argocd
spec:
  generators:
    - clusters: {}
  template:
    metadata:
      name: 'echo-{{name}}'
    spec:
      project: default
      destination:
        server: '{{server}}'
        namespace: echo
      source:
        repoURL: https://github.com/your-org/your-repo
        targetRevision: main
        path: deploy/overlays/{{metadata.labels.region}}/echo
      syncPolicy:
        automated: { prune: true, selfHeal: true }
```

Verification/DoD

- `argocd app list` shows two apps: `echo-prod-us`, `echo-prod-eu` in Sync OK.
- Each cluster has namespace `echo` created by Argo CD.

Previous: [Lab 1](/posts/multi-region-series-01-baseline/) · Next: [Lab 3](/posts/multi-region-series-03-istio/)
