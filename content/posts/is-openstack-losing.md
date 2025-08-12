---
title: "Is OpenStack fighting a lost battle?"
date: 2022-10-20T00:03:30+01:00
draft: false
---

Update Jan 2023: [Is OpenStack Still Needed in 2022? - Thierry Carrez, Open Infrastructure Foundation](https://www.youtube.com/watch?v=xkEQElJaScM)

And why Kubernetes “won”.

I owe my career to OpenStack and to all its contributors. I have made excellent friends, I learned a lot from them and the project itself.

For that and more, thanks a lot OpenStack.

However…

Even though OpenStack has never been better, I can’t shake the feeling that is fighting a lost battle.

Why? because it tried to replace AWS (and the rest of the cloud providers) and compete directly with them.

The reality is that OpenStack couldn’t do it. And had (and is) playing a catch-up game with them.

It not only tried to replace them by being its own cloud environment but by bringing its own APIs into the game. This is a critical part because If you take a look at Terraform, Ansible, Pulumi and others, you could see that OpenStack is an after thought for them. whereas AWS, Azure, GCP and Kubernetes are first class citizens.

Obviously, OpenStack serves specific use cases, especially when you need total control of your data and your resources and where you need total flexibility to bring your services into production.

But.

How many people “play around” with OpenStack?

How many people are writing the next generation services on top of it?

How many people are using the non-core services?

How many people are writing blogs about building home-labs with it?

Is it because is “difficult” to install?

Is that the reason why it became `consulting-ware`?

Or, is it just an illusion and an echo chamber from the people I work with? Because most of them only talk about one thing… Kubernetes.

I think the reason Kubernetes “won” the mind-share of a lot of people is because 4 things:
1. The community is pushing it and everyone wants it (even though they don’t need it).
2. Is easy to install and experiment with.
3. Exciting things and technologies are happening on top and alongside it.
4. Better portability. Deploy something in your laptop, test it, change the kube-config and deploy the same thing (almost) to AWS.

Also, Kubernetes did not try to replace the cloud providers, it got integrate them with them. Learning from them and evolving with them. OpenStack on the other hand was living on its own island.

What could improve OpenStack’s adoption and mind-share?

* Rewrite it in Rust. /s
* Implement transparent APIs from AWS, Azure, GCP for OpenStack, so we can reuse Pulumi and Terraform.
* Make it easier to install it.
* Make it easier to work with Prometheus stacks, Service mesh and other cloud native tools.
* Make it less `consulting-ware`… whatever that means.