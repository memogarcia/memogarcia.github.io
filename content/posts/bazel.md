---
title: "Bazel"
date: 2026-03-13T16:14:00+09:00
draft: false
---

> Why does my build work on my machine but not on yours?

If you've asked this more than once, the answer is almost always: your build system is lying to you. It's pulling in implicit state from the environment, from cached artifacts, from the order things happened to run last Tuesday. Make and most build tools are fine until they aren't, and you only find out they aren't during an incident.

Bazel's pitch is simple. Builds should be deterministic. Same inputs, same outputs, every time, on every machine.

## How it thinks

Bazel models builds as a directed acyclic graph. Every target declares its inputs and outputs explicitly. If nothing changed, nothing rebuilds. If one file changed, only the targets that depend on it rebuild. This sounds obvious. Most build tools claim to do this. Bazel actually enforces it by sandboxing each action so it can't read files it didn't declare as inputs.

That sandboxing is the key insight. It's not just an optimization. It's a correctness guarantee.

## BUILD files

Everything in Bazel starts with a `BUILD` file. You declare targets using rules:

```python
cc_binary(
    name = "server",
    srcs = ["server.cc"],
    deps = [
        "//lib:network",
        "//lib:config",
    ],
)
```

No glob patterns that silently pick up new files. No implicit dependencies. If it's not in the `BUILD` file, it doesn't exist to Bazel.

This is annoying at first. You have to declare everything. But it means anyone can read a `BUILD` file and know exactly what a target depends on without running anything.

## The workspace

A `WORKSPACE` file (or `MODULE.bazel` if you've moved to Bzlmod) defines external dependencies. Pinned versions. Pinned hashes. The goal is that checking out the repo at a given commit and running `bazel build //...` produces identical output regardless of who runs it or when.

In practice, achieving full hermeticity takes work. But the system pushes you in that direction instead of away from it.

## Remote caching and execution

This is where Bazel starts paying for itself on larger codebases.

**Remote caching.** Bazel hashes every action (inputs + command + environment). If someone on your team already built that exact action, Bazel downloads the result instead of rebuilding. CI builds a target, your laptop reuses the artifact. First builds are slow. Subsequent builds across the team are fast.

**Remote execution.** Send build actions to a cluster of workers instead of running them locally. Your laptop sends the action graph to a build farm. The farm executes actions in parallel, returns results. A 30-minute local build drops to 3 minutes.

Both rely on the hermeticity guarantee. If builds weren't deterministic, you couldn't trust a cached result or a remotely-executed action.

## Where it's painful

**Learning curve.** Bazel is not something you pick up in an afternoon. The concepts are straightforward but the ecosystem (Starlark, rule definitions, toolchains, platforms) takes time.

**Migration.** Moving an existing project to Bazel means writing `BUILD` files for everything. For large monorepos that grew organically, this is a significant investment. Tools like Gazelle help for Go and some other languages, but you'll still spend time on edge cases.

**Small projects.** If your repo has 10 files and builds in 2 seconds, Bazel is overhead. Use `make`, use `go build`, use whatever. The benefits scale with codebase size. Below a threshold, the investment doesn't pay off.

**Ecosystem gaps.** Google uses Bazel internally for almost everything. Outside Google, support varies by language. Go and Java are well-supported. Python and JavaScript are functional but rougher. Niche languages might require writing custom rules.

## When it makes sense

Monorepos with multiple languages. Large codebases where incremental builds matter. Teams where "works on my machine" is a recurring problem. CI pipelines where build times are measured in tens of minutes.

If your team is small, your codebase is one language, and builds take seconds, Bazel is probably not worth the setup cost. That's fine.

## The real value

The build graph as a source of truth is more powerful than just fast builds. You can query it. `bazel query 'rdeps(//..., //lib:config)'` tells you every target that depends on `config`. You can use `bazel cquery` for configured dependency analysis. You can enforce visibility rules so teams can't depend on each other's internals without explicit permission.

The build system becomes a map of your codebase's architecture. That map is always accurate because the build won't work if it isn't.
