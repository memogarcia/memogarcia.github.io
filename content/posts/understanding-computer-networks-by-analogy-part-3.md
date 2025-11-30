---
title: "Understanding Computer Networks by Analogy: Part 3 - Hotels as the Cloud"
date: 2025-10-18T22:39:16+09:00
draft: false
---

> Think of the cloud as a hotel: you rent a private floor, connect to the rest of the city through controlled doors, and use badges to decide who can go where.

License: CC BY-NC-ND 4.0

---

# Part Three: Hotels as the Cloud

## Chapter 10: Why Hotels?

For years, your company operated out of a building you owned. You knew every hallway. You controlled every lock. When the HVAC broke at two in the morning, someone on your team had to deal with it.

Then the company grew. Suddenly you needed capacity in three cities. You needed the ability to handle traffic spikes during product launches. You needed redundancy so that a single failure wouldn't take everything down.

Building your own infrastructure in three cities would take months. The capital expense would be enormous. The ongoing operations would require staff you don't have.

So you check into a hotel instead.

The hotel is operated by a major cloud provider: Amazon Web Services, Google Cloud, Microsoft Azure. They own the land, the buildings, the power systems, the security guards, the network infrastructure. You rent space from them.

Instead of purchasing a building, you rent a private floor. Instead of hiring maintenance staff, you let the hotel handle facilities. You focus on what happens inside your rooms: your applications, your data, your business logic. The building itself is someone else's problem.

The trade-off is control. You don't get to design the electrical system. You can't move walls. The hotel retains master keys for safety and management. But within your floor, you have significant autonomy. You design the layout, control access, decide what goes in each room.

This is the cloud model. Let's see how it maps to networking.

---

## Chapter 11: Your Private Floor

When you check into the cloud hotel, you don't get a random scattering of rooms across different floors. You get your own private floor, isolated from other guests, with a layout you design yourself.

This is your Virtual Private Cloud, your VPC.

A VPC is a logically isolated virtual network within a cloud region. You define the IP address range, which is like choosing your room numbering scheme. You create subnets, which are like dividing your floor into wings. You control the routing between those wings and to the outside world.

A typical floor plan might look like this:

You create a public wing facing the street. This is where you put resources that need to be reachable from the internet: web servers, API endpoints, load balancers. These rooms have windows to the outside world.

You create a private wing in the back. This is where you put resources that should never be directly reachable: application servers, databases, internal tools. These rooms have no windows. The only way in is through doors you control.

You might create additional wings for specific purposes: a wing for batch processing jobs, a wing for shared services, a wing for development environments. Each wing is a subnet with its own routing rules.

The beauty of a VPC is that while you're designing a logical floor plan, the cloud provider is handling the physical reality. Your "floor" might span multiple physical data centers for redundancy. The isolation between your VPC and someone else's VPC is enforced by the provider's networking fabric. You don't need to understand how they do it. You just need to trust that your floor is private.

### Choosing Your Address Space

When you create a VPC, you specify a CIDR block: the range of IP addresses available on your floor. A common choice is something like 10.0.0.0/16, which gives you 65,534 usable addresses. That's more than enough for most applications.

You then carve that range into subnets. Maybe 10.0.1.0/24 for your public wing (254 addresses), 10.0.10.0/24 for your application servers (254 addresses), and 10.0.20.0/24 for your databases (254 addresses). The specific numbers don't matter much. What matters is that you've created logical separation.

### A Technical Sidebar: Availability Zones

Most cloud providers divide regions into Availability Zones. An AZ is essentially a separate data center (or cluster of data centers) within a region. AZs have independent power, cooling, and network connections, so a failure in one AZ shouldn't affect others.

When designing a VPC, you typically create subnets in multiple AZs. Your web servers might run in AZ-a and AZ-b. Your databases might have a primary in AZ-a and a replica in AZ-b. This gives you resilience against single-AZ failures.

---

## Chapter 12: Doors to the World

Your private floor is isolated, but it can't be completely sealed. You need ways to communicate with the outside world. In cloud networking, these connections are gateways.

### The Main Entrance: Internet Gateway

An Internet Gateway is the hotel's main entrance for your floor. It's a two-way door between your VPC and the public internet.

When you want your web server to be publicly accessible, you do four things. You attach an Internet Gateway to your VPC. You update the route table in your public subnet so that internet-bound traffic goes through the gateway. You assign a public IP address to your web server. And you configure security rules to allow the specific traffic you want.

With those pieces in place, users from anywhere on the internet can reach your server. And your server can reach the internet.

### The Staff Exit: NAT Gateway

Your private wing has different requirements. The application servers there should never be directly reachable from the internet. They don't have public IP addresses. They don't appear in any public DNS records. But they still need to reach the outside world sometimes. They need to download software updates, call external APIs, fetch data.

For this, you use a NAT Gateway.

A NAT Gateway sits in your public subnet and provides outbound-only access for your private resources. Think of it as a staff exit at the back of the hotel. Your employees can walk out, conduct their business in the city, and return. But strangers on the street can't use that door to walk in.

When a private server sends a request through the NAT Gateway, the gateway records which internal address made the request. It rewrites the outgoing packets to show its own public IP as the source. When the response comes back, the gateway checks its records and forwards the response to the correct internal server. The external service never sees your private IP addresses.

### Private Service Doors: VPC Endpoints

Sometimes your servers need to access cloud services that the provider operates: object storage, managed databases, message queues. The naive approach would be to send that traffic out through the NAT Gateway, across the public internet, and back into the cloud provider's network. It works, but it's inefficient and potentially expensive.

VPC Endpoints provide a better path. They're private doors connecting your floor directly to the hotel's internal amenities. Traffic to supported services stays inside the cloud provider's network. It never touches the public internet. This is faster, cheaper, and more secure.

Two types of endpoints exist. Gateway endpoints work for specific high-volume services (like S3 on AWS). They appear as routing table entries: "traffic for this service goes through this endpoint." Interface endpoints work for a broader range of services. They appear as network interfaces with private IP addresses on your subnet. You talk to them the same way you'd talk to any other server on your floor.

---

## Chapter 13: Badges and Permissions

Locks on doors are only part of security. The deeper question is: who are you, and what are you allowed to do?

In a hotel, this is managed with badges and keycards. When you check in, you receive credentials. Those credentials determine which elevators you can use, which floors you can access, which rooms you can enter.

In the cloud, this system is called Identity and Access Management, or IAM.

IAM handles two related questions. Authentication asks "who are you?" Authorization asks "what are you allowed to do?"

Authentication might involve usernames and passwords, multi-factor tokens, or cryptographic keys. Authorization involves policies: documents that specify which actions are permitted on which resources under which conditions.

The principle of least privilege applies here. Every identity should have the minimum permissions needed to do its job. A web server that needs to read from one storage bucket should not have permission to delete objects from every bucket in the account. A developer who needs to deploy applications should not have permission to modify billing settings.

IAM identities include users (representing humans), groups (collections of users who share permissions), and roles (identities that can be assumed by users, applications, or services). Roles are particularly useful because they provide temporary credentials. A server can assume a role that grants it access to specific resources, and when the server terminates, the credentials automatically become invalid.

### Security Layers

Cloud networking provides multiple layers of security that work together.

Network ACLs operate at the subnet level. They're stateless rules that evaluate each packet independently. They're useful as a coarse filter: blocking entire IP ranges, for instance.

Security Groups operate at the instance level. They're stateful, meaning if you allow traffic in, the response is automatically allowed out. Security groups are the primary way to control what traffic can reach your servers.

IAM policies operate at the identity and resource level. Even if network traffic reaches your storage bucket, IAM determines whether the requesting identity has permission to read or write.

These layers overlap. A request might be allowed by the security group but denied by IAM policy, or vice versa. Defense in depth means applying appropriate controls at each layer.

---

You've designed your cloud floor. You have public and private wings, doors to the outside world, and a badge system controlling access. Your infrastructure is running.

But modern applications are complicated. They run on wireless networks where everyone shares the air. They need encryption to protect data in transit. They consist of dozens of services that talk to each other constantly.

Part Four explores these advanced topics: Wi-Fi, TLS, and service meshes.
