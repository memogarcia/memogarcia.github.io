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

Cloud computing changes the ownership model, not the need for networking discipline.

You are still building networks. You are still making routing and security decisions. You are simply doing it inside infrastructure owned and operated by a provider.

The hotel analogy helps because it separates two responsibilities:

- The provider runs the property.
- You define the parts you rent and the rules inside them.

---

## Chapter 10: The Hotel Tower

Imagine you stop running your own building and move into a large hotel complex.

You no longer manage the concrete, the generators, the chillers, or the physical security perimeter. The provider does that. What you manage is your logical space inside the property: your networks, your instances, your services, and your policies.

That tradeoff is the core of cloud infrastructure.

You give up direct access to physical devices. In exchange, you gain a faster way to provision networks, add capacity, and spread systems across failure domains without buying the underlying hardware yourself.

This is why cloud discussions often sound abstract. The cables and switches still exist. They are simply hidden behind APIs, route tables, and service controls.

### A practical scene

Suppose your team needs to launch a new environment for staging by the end of the day.

In a traditional data center model, you might need spare hardware, switch ports, rack space, firewall changes, and a maintenance window. In a cloud model, you can often create the network, the instances, and the security policy in minutes.

That does not remove networking work. It compresses the time in which you can make a networking mistake.

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

What stays constant is the design goal: avoid putting all critical components in one failure domain when you can spread risk across more than one.

### A design pattern that survives the analogy

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

The idea is straightforward:

- Internal hosts initiate outbound traffic.
- The egress component rewrites source addressing as needed.
- Return traffic is mapped back to the originating internal flow.

This allows patching, package downloads, API calls, and similar outbound activity while keeping the internal host from being directly addressable from the public internet.

### Provider service endpoints

Many cloud workloads need to access managed services such as object storage, queues, or key management.

Without a private endpoint, that traffic may still remain on the provider's backbone in practice, but it often follows a public-style addressing path or a NAT/internet egress model from your point of view. Private endpoints give you a clearer and more explicit private path, along with tighter policy control.

That is the operational benefit:

- clearer routing
- more predictable security posture
- less dependence on general-purpose internet egress

### A failure case worth keeping in mind

If a private instance cannot download packages, the cause might be:

- no route to the egress path
- a broken NAT configuration
- DNS failure
- a security rule blocking the return traffic

The symptom "cannot reach the internet" is not a diagnosis. In cloud environments, it is often a route-table or identity detail two layers away from where you first look.

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

Suppose an application server cannot read from an object storage bucket.

The failure might be:

- no network path to the service endpoint
- DNS resolving to the wrong target
- egress blocked by security rules
- missing IAM permission such as `s3:GetObject`

All of those can produce a user report that sounds identical: "the app cannot reach storage."

That is why cloud troubleshooting needs two parallel questions:

1. Can the network path reach the service?
2. Does the caller have permission to do the thing it is attempting?

### Temporary credentials

One of the most valuable cloud patterns is using roles or service accounts to issue temporary credentials rather than storing long-lived secrets in source code or instance images.

This reduces the blast radius of leaks and makes rotation more manageable. It also gives you cleaner audit trails because the identity is explicit.

### Where the analogy bends

Badges and guards are useful pictures, but cloud authorization often happens deep inside service APIs, not at a literal doorway. The right lesson to keep is that network access and permission checks are separate systems that often fail independently.

At this point, you have a cloud tower with internal layout, public and private paths, and layered controls over both network traffic and identity.

The next step is to look at cases where the clean hallway picture starts to blur: wireless networking, encryption, and dense service-to-service traffic.
