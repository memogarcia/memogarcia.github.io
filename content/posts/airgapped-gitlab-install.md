---
title: "Installing GitLab in air-gapped mode"
date: 2022-10-03T19:03:30+01:00
draft: false
---

When installing GitLab in air-gapped mode using helm charts first you need to pull the required images for the target version to your private container registry.

But is not straightforward to find which container tags map to which GitLab version.

An easy way to find which tags you need is to print the `helm templates` first and get the values from there.

```bash
helm \
    -n gitlab \
    template \
    gitlab gitlab/gitlab \
    --version 6.4.1 \
    -f values.yml \
> gitlab-6.4.1.yml

cat gitlab-6.4.1.yml | grep image:
```