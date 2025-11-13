---
title: "Understanding Computer Networks by Analogy: Part 3 - Hotels as the Cloud"
date: 2025-10-18T22:39:16+09:00
draft: false

---

> Think of the cloud as a hotel: you rent a private floor, connect to the rest of the city through controlled doors, and use badges to decide who can go where.

License for this chapter: CC BY-NC-ND 4.0

---

## What This Chapter Covers

In Part 1, we treated your local network as a building you own and operate.  
In Part 2, we walked through the city, following your envelopes across the internet.

In this chapter, we move into a **hotel** – a shared, professionally managed building that represents a major cloud provider.

By the end of this chapter, you should be able to:

- Describe the **cloud model** using the hotel analogy.
- Explain what a **Virtual Private Cloud (VPC)** is and how subnets map to different wings of your floor.
- Distinguish between an **Internet Gateway**, a **NAT Gateway**, and **VPC Endpoints**, and know when to use each.
- Explain the role of **Identity and Access Management (IAM)** and the principle of least privilege.

---

## Chapter 3: Hotels as the Cloud

In the earlier chapters, you owned the entire building:

- You knew every hallway.
- You controlled every lock.
- You were responsible for fixing the plumbing at 2 a.m.

Now your business is growing:

- You need more capacity.
- You need presence in multiple cities.
- You do not want to build and operate a physical building in each place.

Owning dozens of buildings is expensive and slow. You need a different model.

You decide to **check in to the cloud hotel**.

---

## 3.1 Hotels and Serviced Offices: The Cloud Model

Think of a major cloud provider like Amazon Web Services (AWS), Google Cloud, or Microsoft Azure as a global chain of hotels.

Instead of buying land and constructing your own building from scratch, you:

- Rent space in one of their skyscrapers.
- Let the hotel staff manage:
  - Power and cooling.
  - Physical security.
  - Elevators, cabling, and hardware.
- Focus on running your own business inside the rooms and floors you rent.

You can choose from different levels of commitment:

- A single room for a weekend experiment.
- A cluster of rooms for a busy week-long conference.
- An entire floor with its own elevator bank if you need isolation and predictability.

The pricing seems simple: you pay for the rooms and services you use.  
In practice, the details matter:

- Extra services (room service, cross-city calls, special deliveries) show up on the bill.
- In cloud terms, this is data transfer, managed services, storage, and per-request charges.

The main advantage of the hotel model is **elasticity**:

- When demand spikes (a large conference arrives), the hotel can instantly allocate more rooms.
- When traffic falls, you release rooms and costs drop.
- You do not have to own a conference center just for a few peak days each year.

The trade-off:

- You no longer control the wiring behind the walls.
- You do not design the power grid or the elevator system.
- You get fine-grained controls at your own doors and hallways, but the hotel always retains master keys to run the building safely.

> **Key idea:** The cloud is a professionally managed hotel. You trade ownership for elasticity and pay-per-use pricing, while keeping strong control inside your own area.

---

## 3.2 Your Private Floor: The Virtual Private Cloud (VPC)

When you move into the cloud hotel, you do not want a random scatter of rooms across the building.  
You want a secure, isolated, and organized area – **your own private floor**.

In the cloud, this is your **Virtual Private Cloud (VPC)**.

- A VPC is a logically isolated virtual network you define inside a cloud region.
- You choose the IP address range (the room numbering scheme).
- You divide the floor into **subnets**, just as we divided our original building into floors and wings.

You might design the floor as follows:

- A **public wing**:
  - Lobby, reception, marketing offices.
  - Rooms that must be reachable from the hotel’s main entrance (public-facing web servers, APIs).
- A **private back-office wing**:
  - Accounting, internal tools, sensitive data.
  - No direct doors or windows to the outside world.
- A **shared-services wing**:
  - Internal databases, message queues, shared application services.
  - Accessible from other rooms on your floor, but not from the public street.

The elevator bank on your floor is still your connection to the rest of the world, just as in previous chapters.  
You decide:

- Which elevators stop on your floor.
- Which rooms can use which elevators.
- Which rooms have peepholes to the street (public IP addresses) and which stay fully private.

At this point the analogy bends slightly:

- A VPC is not necessarily a single physical floor.
- It is often carved out of multiple physical racks and data centers.
- The isolation is logical, enforced by the provider’s networking fabric and security systems.

> **Core concept:** A VPC is your private, secure floor in the cloud hotel. You design the layout with subnets and control all traffic entering and leaving using gateways and routing tables.

### Technical Deep Dive

- **VPC**
  - A logically isolated virtual network in a cloud provider’s region.
  - You control:
    - IP address range.
    - Subnets.
    - Route tables.
    - Network gateways.

- **Subnets**
  - A VPC is divided into one or more subnets.
  - Each subnet usually lives in a single Availability Zone for high availability.
  - Common patterns:
    - **Public subnet**: Routing table has a route to the Internet Gateway. Resources can be publicly reachable (if they have public IPs).
    - **Private subnet**: No route to the Internet Gateway. Resources are not directly reachable from the internet.

- **IP Addressing**
  - When you create a VPC, you choose a private IP range (e.g. `10.0.0.0/16`).
  - This defines the room numbers on your floor.
  - Subnets carve that space into smaller ranges, like wings.

### ASCII Diagram – A VPC Floor Plan

```text
+--------------------------------------------------------------------+
| Your Private Floor (VPC: 10.0.0.0/16)                              |
|                                                                    |
|  +---------------------------+  +--------------------------------+  |
|  | Public Wing (Subnet)      |  | Private Wing (Subnet)          |  |
|  | 10.0.1.0/24               |  | 10.0.10.0/24                   |  |
|  |                           |  |                                |  |
|  |  +-------------------+    |  |  +--------------------------+  |  |
|  |  | Web Server Room   |<------>|  | Application Server Room  |  |  |
|  |  | (Public IP)       |    |  |  | (Private IP)             |  |  |
|  |  +-------------------+    |  |  +--------------------------+  |  |
|  |         ^                 |  |              |                 |  |
|  +---------|-----------------+  +--------------|-----------------+  |
|            |                                   v                    |
|            |                      +--------------------------+      |
|            |                      |   Database Server Room   |      |
|            |                      |      (Private IP)        |      |
|            |                      +--------------------------+      |
|            |                                                        |
|  +---------v------------------+                                    |
|  | Main Elevator (Router)     |                                    |
|  |   - Route to Internet GW   |                                    |
|  |   - Route to Private Wing  |                                    |
|  +----------------------------+                                    |
|                                                                    |
+--------------------------------------------------------------------+
```

---

## 3.3 The Hotel’s Many Doors: Gateways and Endpoints

Your private floor is isolated, but it cannot be completely sealed off.  
In practice, you need to:

- Serve websites and APIs to the public internet.
- Download software updates and talk to external APIs.
- Use the hotel’s own internal services (like shared storage, managed databases, queues).

A building needs doors. In the cloud, your VPC needs **gateways** and **endpoints**.

### The Main Entrance: The Internet Gateway

An **Internet Gateway (IGW)** is the hotel’s main entrance for your floor:

- It is a **two-way door** between your VPC and the public internet.
- People from the outside can reach specific rooms on your floor.
- Rooms on your floor can initiate connections to the internet.

To make a web server publicly reachable:

1. Attach an Internet Gateway to your VPC.
2. Add a route in the public subnet’s route table that points internet-bound traffic to the IGW.
3. Give the web server a public IP (or an Elastic IP).
4. Configure a Security Group (door guard) to allow specific inbound traffic (for example, HTTPS on port 443).

If those pieces are in place:

- The city directory (DNS) can map a domain name to your public IP.
- Traffic flows from the internet, through the IGW, along your routing table, and up to the correct room.

### The Staff-Only Exit: The NAT Gateway

Rooms in your **private wing** have a different requirement:

- They must never be reachable directly from the public street.
- They still need to go out to fetch software updates, call external APIs, or download data.

For this, you use a **NAT Gateway**:

- Think of it as a **staff-only exit** at the back of the hotel.
- Only people who start inside your floor can use it.
- Outsiders cannot initiate a conversation through this door.

How it works conceptually:

- Workers from private rooms walk to the NAT exit and step out into the city.
- The guard at the door (the NAT Gateway) records:
  - Which room initiated which connection.
- When responses come back:
  - The guard checks the notes.
  - Sends the envelopes back to the correct internal room.

The external world only sees the NAT Gateway’s address, not the internal room numbers.  
This preserves privacy while still allowing outbound connectivity.

### The Private Service Door: VPC Endpoints

Sometimes your employees need to use the hotel’s own shared amenities:

- A huge storage warehouse (object storage like S3).
- A document archive (managed databases).
- Internal messaging systems (queues, notification services).

The naive approach:

- Leave your floor.
- Go down to the lobby.
- Walk out onto the public street.
- Walk back into the hotel through the public entrance to the warehouse.

It works, but:

- You expose yourself to the public street.
- You may pay for unnecessary public data transfer.
- It adds complexity to security and routing.

A **VPC Endpoint** is a **private service door** between your floor and the hotel’s internal amenities:

- Traffic to certain services never leaves the hotel’s interior network.
- Your data avoids the public internet entirely.
- This is better for security, and often cheaper and faster.

There are two main types:

1. **Gateway Endpoints**
   - Like a special high-speed tunnel from your floor’s main junction to a big shared utility (for example, S3 or DynamoDB).
   - You do not assign the utility a room on your floor.
   - Instead, your route table says: “All requests for this service go through this private tunnel.”

2. **Interface Endpoints**
   - Like installing a new private door directly on your hallway.
   - The cloud service gets a private IP on your floor.
   - It feels as if the service lives on your floor.
   - You can attach your own Security Group to that door.

> **Key takeaway:**  
> - Use the **Internet Gateway** for two-way public access.  
> - Use the **NAT Gateway** for one-way outbound access from private rooms.  
> - Use **VPC Endpoints** to reach the hotel’s own services without touching the public street.

---

## 3.4 Badges and Permissions: Identity and Access Management (IAM)

Locks on doors are only part of hotel security. The crucial question is:

> Who are you, and what are you allowed to do?

In a hotel, this is handled with **badges and keycards**.  
In the cloud, this is **Identity and Access Management (IAM)**.

IAM is the hotel’s internal security department:

- It issues identities (badges and keycards).
- It defines which identities can open which doors.
- It enforces the principle of **least privilege**:
  - Give each identity only the minimum permissions needed to do its job.

Examples in the hotel:

- The CEO might have a master keycard that opens almost any door.
- A developer might have access to the development wing, but not to finance.
- A cleaning robot (a service) might:
  - Only open doors to empty rooms.
  - Only operate between 3 a.m. and 5 a.m.
- A temporary contractor might have a badge that expires automatically at the end of the week.

In the cloud:

- Every user, application, and service has an **identity**.
- Each identity has **policies** attached to it.
- When a request reaches a door (for example, an API, a storage bucket, or a database):
  - The network guard (Security Group / firewall) checks:
    - Is traffic allowed from this hallway?
  - The IAM system checks:
    - Does this identity’s badge allow this action on this resource?

> **Checklist:**  
> - Start with the question: “Who is this?”  
> - Apply least privilege: give only the permissions that are truly needed.  
> - Treat powerful identities (master keys) with extreme care.

### Technical Deep Dive

- **IAM Components**
  - **User**
    - Represents a human being.
    - Has long-term credentials (passwords, access keys) if you choose to use them.
  - **Group**
    - A collection of users.
    - You attach policies to the group so all members share the same permissions.
  - **Role**
    - An identity that can be assumed by a user, application, or service.
    - Provides temporary credentials.
    - Typical use: give a server or function a role that allows it to access a specific storage bucket, without embedding static keys.
  - **Policy**
    - A JSON document that defines permissions:
      - Which actions are allowed or denied.
      - On which resources.
      - Under which conditions (time, source IP, MFA requirements, etc.).

- **Authentication vs Authorization**
  - **Authentication**
    - Proving who you are.
    - Example: logging in with a password and a multi-factor token.
    - Analogy: showing your ID at the front desk.
  - **Authorization**
    - Deciding what you are allowed to do.
    - Example: IAM policies that grant access to a specific bucket or API.
    - Analogy: your keycard permissions defining which floors and rooms you can enter.

---

## Recap and Small Exercises

### What You Should Now Be Able to Explain

By the end of this chapter, you should be comfortable explaining:

- The **cloud** as a hotel where you rent space instead of owning the whole building.
- A **VPC** as your private floor, subdivided into subnets (wings) with controlled routing.
- The roles of:
  - **Internet Gateways** (two-way public entrance),
  - **NAT Gateways** (one-way staff exit for private rooms),
  - **VPC Endpoints** (private doors to internal hotel services).
- **IAM** as the badge and keycard system that implements least privilege.

### Exercises

1. **Sketch Your First Cloud Floor**
   - Pick an example application (for example, a simple web app with a database).
   - Draw your VPC as a floor:
     - Public wing (web/API).
     - Private wing (application servers, databases).
   - Mark which subnets would be public and which would be private.

2. **Place the Doors**
   - On your sketch, show:
     - Where the Internet Gateway connects.
     - Where a NAT Gateway would sit for private subnets.
     - Where you would add VPC Endpoints for storage or other managed services.

3. **Design IAM for a Small Team**
   - Imagine a small team of three people:
     - A developer.
     - An operator (DevOps / SRE).
     - A finance analyst.
   - Write down:
     - Which “wings” each needs access to.
     - What roles or groups you would create.
     - One example of a permission you would explicitly **deny** to reduce risk.

4. **Map the Analogy to a Real Cloud Account**
   - If you have access to a cloud account (even a sandbox):
     - Find an existing VPC and identify:
       - Its CIDR range (room numbering scheme).
       - Its subnets and which ones are public or private.
       - Any Internet Gateways, NAT Gateways, or VPC Endpoints.
     - Find one IAM role and interpret it:
       - Who can assume it?
       - Which “doors” does it open?

---

In the next part, we will extend the hotel analogy to more advanced architectures:  
on-demand services (room service), globally distributed hotels (multi-region), and patterns that help you keep your systems resilient as they grow.
