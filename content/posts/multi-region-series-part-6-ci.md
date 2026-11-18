---
title: "Multi-Region Cloud Training, Part 6: CI with GitHub Actions and Taskfile"
date: 2025-10-17T09:15:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-06-ci/
---

Right now, pushing a code change requires building an image by hand and editing the tag in Git. Pushing mutable tags like `latest` breaks traceability because you can no longer tell which commit is running in which cluster.

Here we wire GitHub Actions to run the same `task` targets we run locally, tag every image with `${{ github.sha }}`, and update `deploy/base/echo/kustomization.yaml` with `kustomize edit set image` so Argo CD rolls it out.

```text
 [Developer Pushes Code (app/**)]
               │
               ▼
     [GitHub Actions CI]
               │
               ├─> 1. task docker:build docker:push (tag = github.sha)
               ├─> 2. kustomize edit set image in deploy/base/echo
               │
               ▼
 [Git Repo] <─ 3. CI commits updated kustomization.yaml
               │
               ▼
 [Argo CD]  <─ 4. Detects commit and syncs US + EU overlays
```

## The GitHub Actions Workflow

Using the root `Taskfile.yml` from Part 1 keeps CI and local builds on the exact same `docker build` and `docker push` commands. Passing `REGISTRY` and `TAG` through the environment overrides the defaults in `Taskfile.yml`.

```yaml
# .github/workflows/ci.yml
name: ci
on:
  push:
    branches: [main]
    paths: ['app/**']

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: arduino/setup-task@v3
        with:
          version: 3.x

      - name: Build and push image
        env:
          REGISTRY: ghcr.io/${{ github.repository_owner }}
          TAG: ${{ github.sha }}
        run: |
          task docker:build docker:push

      - name: Install kustomize
        run: |
          curl -fsSL "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
          sudo mv kustomize /usr/local/bin/kustomize

      - name: Update Kustomize image tag
        working-directory: deploy/base/echo
        run: |
          kustomize edit set image \
            ghcr.io/your-org/echo-api=ghcr.io/${{ github.repository_owner }}/echo-api:${{ github.sha }}

      - name: Commit image bump
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add deploy/base/echo/kustomization.yaml
          git diff --cached --quiet || git commit -m "chore: bump echo image to ${{ github.sha }}"
          git push
```

## Why `kustomize edit set image`

Do not try to interpolate a separate `IMAGE_TAG` file inside `kustomization.yaml` with `$(cat IMAGE_TAG)`, and avoid regex `sed` scripts against `deployment.yaml`. Kustomize does not run shell commands (Argo CD runs `kustomize build` directly and would treat `$(cat IMAGE_TAG)` as a literal tag string), and `sed` breaks when YAML formatting changes.

`kustomize edit set image` updates the structured `images:` block in `deploy/base/echo/kustomization.yaml` cleanly:

```yaml
# deploy/base/echo/kustomization.yaml (after CI runs)
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
images:
  - name: ghcr.io/your-org/echo-api
    newName: ghcr.io/your-owner/echo-api
    newTag: 7f3c9a1...
```

Two practical caveats for production repos:

- If your default branch is `master` rather than `main`, update `on.push.branches` (and `targetRevision` in your Argo CD `ApplicationSet`).
- Direct `git push` requires that branch protection does not block `GITHUB_TOKEN`. On protected branches, open a PR or push using a GitHub App token with bypass permissions, and keep the `paths: ['app/**']` filter so CI commits do not re-trigger the workflow.

## Verification

Push a small change under `app/main.go`. Within a couple of minutes:

1. The `ci` workflow builds and pushes `ghcr.io/<owner>/echo-api:<sha>`.
2. A follow-up commit (`chore: bump echo image to <sha>`) appears on the branch with the updated `newTag` in `deploy/base/echo/kustomization.yaml`.
3. Argo CD detects the commit and rolls the new image out to `echo-prod-us` and `echo-prod-eu`.

Next, we add Istio connection pooling, outlier detection, and manual traffic splitting across versions.

[Previous: Part 5](/posts/multi-region-series-part-5-app/) · [Index](/posts/multi-region-learning/) · [Next: Part 7](/posts/multi-region-series-part-7-cd/)
