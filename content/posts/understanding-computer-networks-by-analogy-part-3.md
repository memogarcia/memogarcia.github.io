---
title: "Understanding Computer Networks by Analogy: Part 3 - Hotels as the Cloud"
date: 2025-10-18T22:39:16+09:00
draft: true
---

> Think of the cloud as a hotel: you rent space inside someone else's property, define your own internal layout, and rely on a mix of network paths and identity rules to decide who can reach what.

License: CC BY-NC-ND 4.0

---

# Part Three: Hotels as the Cloud

Up to this point, you have owned the building. You decide the cabling, the switches, the floor plan, and the routers.

The hotel changes who owns the property. It does not spare you the networking work.

You still choose the tower layout, the floors, the routes, and the rules about who gets in. You are simply doing that work inside infrastructure owned and operated by a provider.

The hotel analogy helps because it separates two responsibilities:

- The provider runs the property.
- You define the parts you rent and the rules inside them.

---

## Chapter 10: The Hotel Tower

Imagine you stop running your own building and move into a large hotel complex.

You no longer touch the concrete, the generators, or the cage doors. The provider handles that. Your job starts where the API begins: your tower, your floors, your instances, your routes, and your rules.

If you have ever waited days for hardware, a firewall change, or a spare switch port, that shift feels real immediately.

You lose the comfort of seeing the hardware. In return, you can lay out a new environment in minutes instead of spending a week chasing approvals.

The cables and switches are still there. You simply meet them as route tables, security groups, and service controls.

### By the end of the day

Suppose you need a staging environment before the day ends.

In a data center, that request can turn into emails, rack diagrams, firewall tickets, and waiting for someone to tell you which switch port is free. In the cloud, you can usually stand up the network, the instances, and the security policy before lunch.

The work did not disappear. It only got faster to do well, and faster to do badly.

### Where the analogy bends

A cloud provider is not literally a hotel in one building. It is a global fleet of facilities, software control planes, and managed services. The hotel picture is useful because it teaches the responsibility boundary, not because it matches the underlying physical layout.

---

## Chapter 11: Designing Your Tower

Inside the hotel, you still need your own internal layout.

In AWS and Google Cloud you create a **VPC**. In Azure you create a **VNet**. The names differ, but the purpose is similar: define a logically isolated network space for your resources.

You start by choosing an address range, such as `10.0.0.0/16`. Then you divide that space into subnets according to role, trust level, and routing needs.

Typical patterns include:

- A **public subnet** for components that accept inbound internet traffic, often through a load balancer.
- A **private subnet** for application servers, workers, or databases that should not accept direct public inbound traffic.

The reason for the split is not style. It is control. Public-facing systems and internal systems usually need different reachability rules, different routing, and different monitoring expectations.

### Availability zones and failure domains

This is where you need precision.

Cloud providers divide regions into failure domains, commonly called **Availability Zones (AZs)**. The exact design varies by provider.

- In AWS, subnets are tied to a specific AZ.
- In GCP, subnets are regional.
- In Azure, behavior depends on the service and topology you choose.

So the hotel analogy bends here. You are no longer placing rooms on one literal floor in one literal building. You are defining a logical network that may span multiple physical facilities, with provider-specific rules about how resources map to those facilities.

Across providers, the naming changes. The design instinct does not: do not pile every critical component into one failure domain if you can spread the risk.

### One layout you will see often

If you run a public application with a database backend, a common layout is:

- Public entry points in multiple zones
- Application instances in private subnets
- Database instances or replicas distributed according to the service's high-availability model

That is the same mental move you would make in a physical environment: separate exposure levels and reduce single points of failure.

### Where the analogy bends

VPCs, VNets, subnets, and zones are software-defined abstractions backed by provider-specific infrastructure. The hotel tower picture is useful for isolation and layout. It becomes misleading if you assume one provider's details apply to all the others.

---

## Chapter 12: Doors to the World

An isolated tower is safe, but not very useful. Systems need paths in and out.

Cloud platforms provide those paths through different gateway and routing constructs.

### The public entrance

If a service must accept traffic from the public internet, you need a path for that traffic to reach the network that hosts the service.

In AWS, an **Internet Gateway (IGW)** is one of the components that makes this possible. But the presence of an IGW alone does not make a workload public. Reachability still depends on route tables, public IP assignment, security groups, network ACLs, and any load balancers or proxies in front.

That detail matters in troubleshooting. A workload can be inside a VPC with an IGW attached and still be unreachable from the internet because one of the other required conditions is missing.

### The outbound-only path

Private workloads often need outbound access without accepting inbound internet connections. A **NAT Gateway** or similar egress path solves that problem.

The flow is straightforward:

- Internal hosts initiate outbound traffic.
- The egress component rewrites source addressing as needed.
- Return traffic is mapped back to the originating internal flow.

This allows patching, package downloads, API calls, and similar outbound activity while keeping the internal host from being directly addressable from the public internet.

### Provider service endpoints

Many cloud workloads need to access managed services such as object storage, queues, or key management.

Without a private endpoint, that traffic may still remain on the provider's backbone in practice, but it often follows a public-style addressing path or a NAT/internet egress model from your point of view. Private endpoints give you a clearer and more explicit private path, along with tighter policy control.

The benefit is not cosmetic. It is easier to reason about:

- clearer routing
- more predictable security posture
- less dependence on general-purpose internet egress

### A failure case worth keeping in mind

If a private instance hangs on `apt update` or cannot pull a container image, start with the egress path:

- no route to the egress path
- a broken NAT configuration
- DNS failure
- a security rule blocking the return traffic

That failure gets reported as "no internet" almost every time. Usually the break is more specific than that.

### Where the analogy bends

Cloud gateways are not just physical doors. They are combinations of routing, addressing, and provider-managed services. The door picture helps with directionality. It does not replace the need to inspect the actual route tables and security policy.

---

## Chapter 13: Badges and Security Guards

Network reachability is only part of cloud security.

The other part is identity.

If networking answers "Can this packet get there?", identity and policy answer "Should this caller be allowed to do this operation?"

### IAM: who are you, and what may you do?

IAM stands for **Identity and Access Management**.

It governs identities such as users, roles, and service accounts, along with policies describing which API actions or service-level operations those identities may perform.

This is where many teams mix concepts.

IAM is not a replacement for routing or firewall rules. A packet that cannot reach the service will fail before IAM matters. And many services require both:

- network reachability
- valid identity and authorization

### Security groups and network ACLs

In AWS terms, two common network controls are:

- **Security Groups**: stateful rules attached to instances or interfaces
- **Network ACLs**: subnet-level stateless rules

You can think of them as different checkpoints, but remember what they actually inspect: packet attributes such as source, destination, protocol, and port.

IAM is different. It generally evaluates API calls and service permissions, not every packet on the wire.

### A realistic troubleshooting example

Suppose your application can read and write locally all day, then hangs the moment it tries to fetch an object from storage.

The failure might be:

- no network path to the service endpoint
- DNS resolving to the wrong target
- egress blocked by security rules
- missing IAM permission such as `s3:GetObject`

From the application's point of view, those failures can feel almost identical: timeout, access denied, missing object, vague SDK error.

So keep two questions on the table at the same time:

1. Can the network path reach the service?
2. Does the caller have permission to do the thing it is attempting?

### Temporary credentials

One of the most valuable cloud patterns is using roles or service accounts to issue temporary credentials rather than storing long-lived secrets in source code or instance images.

This reduces the blast radius of leaks and makes rotation more manageable. It also gives you cleaner audit trails because the identity is explicit.

### Where the analogy bends

Badges and guards are useful pictures, but cloud authorization often happens deep inside service APIs, not at a literal doorway. The right lesson to keep is that network access and permission checks are separate systems that often fail independently.

With that, the hotel picture is usable: you have a tower, paths in and out, and rules about who may act inside it.

The next trouble spots are the ones that blur the neat hallway picture: shared radio space, encrypted traffic, and dense service-to-service calls.
