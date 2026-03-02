---
title: "Multi-Region Cloud Training: CI with GitHub Actions"
date: 2025-10-17T09:15:00-07:00
draft: false
aliases:
  - /posts/multi-region-series-06-ci/
---

We have a GitOps pipeline waiting to deploy our app, but how does the new image actually get built and telling Argo CD to deploy it? 

The classic anti-pattern is having a developer build a Docker image on their laptop, push it with the `latest` tag, and then run `kubectl rollout restart`. This breaks the GitOps contract and makes debugging impossible because `latest` means something different every day.

Instead, we want our Continuous Integration (CI) system to handle the build, and then programmatically commit the new image tag back to our repository. This gives us an auditable trail of exactly what version is running at any given time.

### The CI/CD Handoff

Here is the flow we are going to build:

```text
 [Developer Pushes Code]
           │
           ▼
 [GitHub Actions CI]
           │
           ├─> 1. Builds Docker image
           ├─> 2. Pushes to GHCR with commit SHA as tag
           │
           ▼
 [Git Repo] <─ 3. CI commits new tag to IMAGE_TAG file
           │
           ▼
 [Argo CD] <─ 4. Notices Git change and syncs to clusters
```

### Local Parity with Taskfile

One of the most frustrating things in software engineering is when a build works on your machine but fails in CI. To fix this, we want CI to run the *exact same commands* we run locally. 

Remember the `Taskfile.yml` we created in Part 1? We're going to use it directly inside our GitHub Action. 

### The Workflow

Let's look at the GitHub Actions workflow. We use the commit SHA (`${{ github.sha }}`) as our image tag. This is crucial: every image must be uniquely identifiable.

```yaml
# .github/workflows/ci.yml
name: ci
on:
  push:
    branches: [ main ]
    # Only run this workflow if the application code actually changed
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
          
      # Install the Task runner to ensure local parity
      - uses: arduino/setup-task@v1
      
      - name: Build and push
        run: |
          # We pass the Git SHA as the TAG variable to our existing tasks
          TAG=${{ github.sha }} task docker:build docker:push
          
      - name: Record tag for GitOps
        run: |
          # Write the new tag to a specific file
          echo ${{ github.sha }} > deploy/base/echo/IMAGE_TAG
          
          # Commit the change back to the repository
          git config user.name "GitHub Actions" 
          git config user.email "actions@github.com"
          git add deploy/base/echo/IMAGE_TAG 
          git commit -m "chore: bump echo image to ${{ github.sha }}" 
          git push
```

### The GitOps Bridge

You might be wondering: *Why write to an `IMAGE_TAG` file instead of just using `sed` to update the `Deployment.yaml` directly?*

Updating the `Deployment.yaml` with a bash script is brittle. What if the indentation changes? What if there are multiple containers in the pod? 

Instead, Kustomize has a built-in feature for this. We can update our base `kustomization.yaml` to read the image tag from that specific file:

```yaml
# deploy/base/echo/kustomization.yaml
resources:
  - deployment.yaml
  - service.yaml
images:
  - name: ghcr.io/your-org/echo-api
    # This tells Kustomize to swap the 'latest' tag with whatever is in this file
    newTag: "$(cat IMAGE_TAG)"
```

*(Note: The exact syntax for this depends on how you wrap Kustomize in your build process, but the concept remains: separate the volatile tag data from the static structural YAML).*

### Verification

Push a change to your `app/main.go` file. Within a minute or two:
1. You should see the GitHub Action run successfully.
2. A new commit will appear in your repository titled `chore: bump echo image...`.
3. If you check Argo CD, it will detect this new commit, render the Kustomize manifests with the new tag, and seamlessly deploy the updated image to both the US and EU clusters.

We now have a fully automated, multi-region deployment pipeline. But what happens if the new image contains a bug? In the next section, we'll use Istio to protect ourselves with traffic shaping and connection pooling.

[Previous: Part 5](/posts/multi-region-series-part-5-app/) · [Continue to Part 7: CD with Istio Traffic Policy](/posts/multi-region-series-part-7-cd/)
