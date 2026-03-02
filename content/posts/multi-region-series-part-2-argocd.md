---
title: "Multi-Region Cloud Training: GitOps with Argo CD"
date: 2025-10-17T09:11:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-02-argocd/
---

If you're managing multiple clusters, applying manifests by hand with `kubectl apply` quickly becomes a nightmare. You lose track of what is deployed where, configuration drift sets in, and rolling back a bad change turns into an archeological dig through your terminal history.

The solution is GitOps. We want our GitHub repository to be the absolute single source of truth. If a manifest isn't in main, it doesn't run in the cluster. Period.

To achieve this, we're going to use Argo CD. We'll set it up as a control plane that watches our repository and automatically syncs changes out to both our US and EU clusters.

### The ApplicationSet Approach

We could manually create an Argo CD `Application` resource for every app in every cluster, but that scales poorly. Instead, we'll use an `ApplicationSet`. This allows us to define a template: "For every cluster that matches this label, deploy this application."

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

### Labeling and Registration

First, Argo CD needs to know our clusters exist and what "region" they represent. We do this by applying a label directly to the `kube-system` namespace, which is a common pattern for identifying cluster-wide metadata.

```bash
# Label the clusters so our ApplicationSet can target them
kubectl --context prod-us-east-1 label ns kube-system region=us --overwrite
kubectl --context prod-eu-west-1 label ns kube-system region=eu --overwrite
```

Next, assuming you have Argo CD running in a control cluster (or one of your regions acting as the control plane), you need to register these clusters. This gives Argo CD the credentials it needs to deploy resources on your behalf.

```bash
argocd cluster add prod-us-east-1 --name prod-us --yes
argocd cluster add prod-eu-west-1 --name prod-eu --yes
```

### Writing the ApplicationSet

Now for the magic. We define an `ApplicationSet` that uses the cluster generator. It looks at all the clusters Argo CD knows about, grabs their `region` label, and uses that to figure out which Kustomize overlay to apply.

Save this as `deploy/apps/echo-appset.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: echo-multicluster
  namespace: argocd
spec:
  generators:
    # Target all registered clusters
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
        # Here is the clever part: we dynamically inject the region label
        # to pick the correct overlay (e.g., overlays/us/echo or overlays/eu/echo)
        path: deploy/overlays/{{metadata.labels.region}}/echo
      syncPolicy:
        automated: 
          prune: true
          selfHeal: true
```

### Verifying the Deployment

Once you apply that ApplicationSet to your control cluster, Argo CD takes over. You can verify it worked by checking the application list:

```bash
argocd app list
```

You should see two applications, `echo-prod-us` and `echo-prod-eu`, and their status should be `Sync OK`. You can also check the clusters directly to confirm the `echo` namespace was created. 

We now have a continuous deployment pipeline that automatically targets multiple regions based on cluster labels. Next, we'll tackle the hardest part of multi-region architecture: cross-cluster networking with Istio.

[Previous: Part 1](/posts/multi-region-series-part-1-baseline/) · [Continue to Part 3: Istio Multi Region Mesh](/posts/multi-region-series-part-3-istio/)
