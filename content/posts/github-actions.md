---
title: "My issue with Github Actions"
date: 2024-05-03T00:03:30+01:00
draft: false
---

GitHub actions are a problem because they lock you by the balls and you cannot reproduce your pipelines.

Getting to depend on all those small `Actions` saves 5 minutes today, only to make migrations immensely painful tomorrow. 

Build, package, and release software should be written as standalone scripts that in principle could even run in the developer's machine. Moving them to CI is just changing the machine that will run the scripts.