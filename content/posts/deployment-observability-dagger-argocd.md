---
title: "Deployment observability when splitting CI and CD"
date: 2026-03-13T17:07:00+09:00
draft: false
---

> You used to have a single place to look at your build and your deploy, now you have two systems.

GitHub Actions doing both CI and CD is simple. Push code, the workflow builds it, the workflow deploys it. One pipeline, one log, one place to check. The deploy step is right there after the build step. You can see the whole thing.

This simplicity is a trap. I [wrote about this before](/posts/github-actions/). You're coupling build logic to a vendor's runner infrastructure, and your deploy step is a `kubectl apply` with credentials stuffed into a secret. It works until it doesn't, and when it doesn't, you're debugging YAML inside a proprietary execution environment you can't reproduce locally.

So you split them. Dagger for CI because you can run the pipeline on your laptop. Argo CD for CD because it watches Git and reconciles state. Both are better tools for their respective jobs.

But now you have a new problem: where did my deployment go?

## The observability gap

With a single GitHub Actions workflow, the mental model was linear:

```
commit → build → test → deploy → done
```

With the split architecture, it becomes:

```
commit → Dagger builds + pushes image → CI commits new tag → Argo CD notices → Argo CD syncs → done (maybe)
```

The question "is my commit deployed?" now crosses three system boundaries. The Dagger pipeline succeeded. Did the tag update get committed? Did Argo CD pick it up? Did the sync succeed? Did the health check pass?

No single dashboard answers this anymore.

## What actually breaks

I've seen a few patterns when teams make this migration.

**The tag commit gets lost.** CI finishes, pushes the image, but the commit that updates the image tag fails because someone else pushed to main in the meantime. Dagger reports success. Argo CD sees nothing new. The developer thinks it's deployed.

**Argo CD syncs but the rollout fails.** The new image pulls fine, but the readiness probe fails. Argo CD marks the application as "Degraded." Nobody is watching Argo CD because the team is used to watching GitHub Actions.

**Sync delays look like failures.** Argo CD polls Git on an interval (default 3 minutes). A developer pushes, checks Argo CD 30 seconds later, sees the old version, and assumes something is broken. They restart things. Now there are two versions of the problem.

**Drift between what CI built and what CD deployed.** CI builds commit `abc123`. While Argo CD is syncing, someone pushes another commit, CI runs again, and the tag file gets updated to `def456`. Argo CD deploys `def456`, not `abc123`. Both developers think their commit is live. One of them is wrong.

## Making deployment traceable

The fix isn't one tool. It's stitching together the information that the single pipeline used to give you for free.

### 1. Give deployments a correlation ID

When Dagger builds an image, tag it with the Git SHA. When CI commits the tag update, include the SHA in the commit message. When Argo CD syncs, the Application status shows the commit it synced to. Now you can trace from source commit to running container.

This sounds obvious. People still skip it and use `latest` or incrementing build numbers that mean nothing outside CI.

### 2. Make Argo CD announce itself

Argo CD has notification support: Slack, webhooks, GitHub commit statuses. Set up a notification for `on-sync-succeeded` and `on-health-degraded`. When Argo CD finishes a sync, it posts to Slack with the commit SHA and the result. Now the team doesn't need to go look at the Argo CD UI.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  annotations:
    notifications.argoproj.io/subscribe.on-sync-succeeded.slack: deploys
    notifications.argoproj.io/subscribe.on-health-degraded.slack: deploys
```

Two annotations. The deploy channel now knows what Argo CD is doing.

### 3. Commit status as a deployment record

Argo CD can also write back a GitHub commit status. This puts a green checkmark (or red X) on the commit in GitHub, which is the place developers already look.

After the migration, the developer's workflow stays the same: push code, check the commit for a green checkmark. The mechanism behind that checkmark changed completely, but the interface didn't.
### 4. Dagger's own observability

One of the reasons to pick Dagger over raw GitHub Actions is that Dagger Cloud gives you pipeline traces. Each step is a node in a DAG with timing, caching, and output. If the CI step fails, you debug it in Dagger Cloud, not in GitHub's log viewer.

But this only covers the CI half. You still need Argo CD for the CD half. Accept that these are two separate systems with two separate observability surfaces.

### 5. A Grafana dashboard that ties it together

Dagger Cloud shows CI. Argo CD UI shows CD. Neither shows both. If you want one place to answer "what happened to my commit?", build a Grafana dashboard that pulls from both.

The idea is a deployment tracker. One row per commit, columns showing the state at each stage:

```
+---------+--------+------------+----------+------------+----------+
|         |        | Dagger     |          | Argo CD    | Health   |
| Commit  | Author | Build      | Tag Push | Sync       | Check    |
+---------+--------+------------+----------+------------+----------+
| abc123  | memo   | ok   42s   | ok       | ok   18s   | healthy  |
| def456  | alice  | ok   38s   | ok       | syncing    | pending  |
| 789fed  | bob    | FAIL       | --       | --         | --       |
+---------+--------+------------+----------+------------+----------+
```

Below that, time-series panels:

```
+------------------------------+  +------------------------------+
| CI Build Duration (p95)      |  | Time from Commit to Deploy   |
|                              |  |                              |
| 50s |       _.               |  |  5m |   ..                   |
| 40s |   _.-' '-.             |  |  4m |   || ..                |
| 30s |.-'       '-._          |  |  3m |.--''-''--              |
|     +--------------->        |  |     +--------------->        |
|      Mon  Tue  Wed  Thu      |  |      Mon  Tue  Wed  Thu      |
+------------------------------+  +------------------------------+

+------------------------------+  +------------------------------+
| Argo CD Sync Failures        |  | Deploy Frequency             |
|                              |  |                              |
|  3 |         ..              |  |  8 |      ..                  |
|  2 |   ..    ||              |  |  6 |   .. || ..               |
|  1 |   ||    ''              |  |  4 |.--''-''-''--             |
|    +--------------->         |  |    +--------------->          |
|     Mon  Tue  Wed  Thu       |  |     Mon  Tue  Wed  Thu        |
+------------------------------+  +------------------------------+
```

The data sources: Dagger Cloud exposes build metrics via its API. Argo CD exposes application state via its API and Prometheus metrics (`argocd_app_sync_total`, `argocd_app_health_status`). Git commit metadata comes from your Git provider's API or a webhook receiver.

The dashboard won't build itself. But once it exists, the team stops context-switching between three UIs to answer one question.

## The mental model shift

The single-pipeline model is a lie, but it's a useful one. Everything in one place. One status.

The split model is honest. CI and CD are different concerns, run by different tools, with different failure modes. But honesty has a cost: you have to explicitly build the observability that the monolithic pipeline gave you implicitly.

Three things minimum:

1. A correlation ID (Git SHA) that threads through both systems
2. Notifications from Argo CD to where the team already looks (Slack, GitHub)
3. Clear ownership of which failures belong to CI (Dagger) and which belong to CD (Argo CD)

If you don't do these, you'll end up with a more powerful architecture that nobody trusts. And a system nobody trusts is a system nobody uses.
