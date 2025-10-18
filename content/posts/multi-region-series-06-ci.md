---
title: "Multi region cloud training Lab 6/9: CI with GitHub Actions and Taskfile"
date: 2025-10-18T09:15:00-07:00
draft: false
---

Problem: Build, tag, and push images consistently.

Assumptions/Constraints

- Cost note: Using two clusters only.
- GHCR or ECR credentials set as repo secrets.

ASCII Diagram

```
 [GitHub Actions CI]
     |
     | docker build/push (Taskfile)
     v
 [Registry]
     |
     | write IMAGE_TAG file and commit
     v
 [Git Repo]
     |
     v
 [Argo CD notices change and syncs]
```

Steps

1) Use Taskfile in the workflow for local parity.
2) Push image and update a tag file for GitOps.

Example workflow (.github/workflows/ci.yml)

```yaml
name: ci
on:
  push:
    branches: [ main ]
    paths: [ 'app/**' ]
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
      - uses: arduino/setup-task@v1
      - name: Build and push
        run: |
          TAG=${{ github.sha }} task docker:build docker:push
      - name: Record tag for GitOps
        run: |
          echo ${{ github.sha }} > deploy/base/echo/IMAGE_TAG
          git config user.name ci && git config user.email ci@example
          git add deploy/base/echo/IMAGE_TAG && git commit -m "bump echo image" && git push
```

Verification/DoD

- Image appears in the registry with the commit tag.
- Commit updates `IMAGE_TAG` in the repo.

Previous: [Lab 5](/posts/multi-region-series-05-app/) · Next: [Lab 7](/posts/multi-region-series-07-cd/)
