---
title: "How to use GitOps in a non-cloud-native environment"
date: 2022-03-04T02:05:30+01:00
draft: false
---

The rapid development and adoption of cloud-native stacks that brings a better developer experience, security, reproducibility and speed at which organizations deliver value are leaving more traditional stacks behind. Hence, there is more pressure from the markets, organizations and developers to bring those stacks into a more modern era. 

We often wonder whether the same techniques and toolchains of these modern stacks can be used to configure not-so-modern applications or infrastructures.

The answer is yes. 

But how can help our organizations to adopt these modern techniques and toolchains?

For example, the competitive landscape of tools and services that surrounds the services that provide value has made them simple to integrate with any modern stack, more often than not with a simple click. These tools and services provide out-of-the-box functionality that can be leveraged not only for customers but your operations teams. (i.e. monitoring, tracing, backup, etc).

The goal of these tools is to become easy to deploy, easy to configure, pluggable, and be as self-described as possible. They do so by leveraging **source control systems** and **CI/CD pipelines** to reduce the complexity between a change being made and production deployment.

Our goal is to leverage the same procedure.

However, what happens to applications and infrastructure that weren’t designed in such a way? can they still leverage a modern approach? Yes. Using **GitOps**.

GitOps is a way to implement continuous deployments toolchains for your applications/infrastructure, and it focuses on 3 main areas:

1. Developer centric experience
2. Infrastructure as code, store the state of your applications/infrastructure as configuration files
3. Reconciliation loops that make the desired state of your infrastructure as code (IaaC) match what’s deployed.

![gitops1](/img/automation-gitops.png)


And that’s it! At its core, a modern GitOps toolchain consists of these 3 steps which can be easily translated to any environment.

Now is easy to picture how can an application/infrastructure be modernized with GitOps.

### Developer centric experience
Developers can leverage their tooling and workflows to keep pushing changes to git repositories, using all or any git workflows they are familiar with. 

### Infrastructure as code
Now the state of your application/infrastructure is defined as configuration and stored in git some capabilities are starting to become more accessible:

1. Easy and fast error recovery, you can always redeploy to a known working state,
2. Self-documented deployments, your configuration is your deployment, unknown states coming from manual changes are minimized,
3. Redeployment in new environments is easier and can be automated,
4. Immutable application/infrastructure deployments,
5. Each commit is a deployment, each commit is value delivered.

### Reconciliation tools
Reconciliation tools take the desired state from git and make sure it matches your environment. These tools work mainly in two paradigms: 

1. Declarative infrastructure as code
2. Imperative infrastructure as code

Choosing declarative or imperative definitions for your infrastructure as code is more often than not, dictated by your organization and/or team and thus it can help you to narrow the options to choose reconciliation tools.

For example:

1. Declarative IaaC can use Argo CD to deploy and keep your environment synchronized in a single step using a reconciliatory loop. In this example, a tool like Argo CD will ensure that your environment is always in the desired state by observing both the desired state from your IaaC and what’s currently deployed.

![gitops2](/img/automation-declarative.png)

 
3. Imperative IaaC can use Jenkins to execute an Ansible playbook every time a commit is pushed to your git repository or periodically. Even though this is a more traditional approach, it can simulate a reconciliatory loop and give you the same result in your environment.

![gitops2](/img/automation-imperative.png)


## Why GitOps is important and what value does it bring to my organization?

Automation is a competency that any organization must master to bring order in this chaotic landscape. Once people, code, and tools are in place, new automation opportunities to modernize start to become more apparent to the organization. GitOps is just one of the ways to ensure control and confidence over how, when, and what you deliver.

FAQ.

1. Is my organization ready for GitOps? In short, **most probably yes**. 
2. Do I need specific tooling to modernize our current infrastructure? **No, Using GitOps doesn’t mean using a specific set of tools, is a framework for automation best practices.**