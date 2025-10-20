---
title: "Understanding Computer Networks by Analogy: Part 3 - Hotels as the Cloud"
date: 2025-10-18T22:39:16+09:00
draft: false
---



# Chapter 3: Hotels as the Cloud

> In this chapter, our analogy evolves. We move out of our private building and into a hotel. You will learn how the core ideas of cloud computing map to this new environment: renting a private floor (VPC), using the hotel’s internal services (endpoints), ordering room service on demand (serverless), and managing a global chain of hotel branches (multi-region). The rules of the city stay the same, but the speed and scale of the game are about to change dramatically.

For the first part of our journey, we’ve been the proud owners of our own building. We managed the security, we knew every hallway, and we were responsible for fixing the plumbing at 2 a.m. But our business is growing. We need more space, more flexibility, and a presence in cities all over the world. Owning and operating a building in every city is an expensive proposition. It’s time for a new strategy.

It’s time to check in to the cloud hotel.

## 3.1 Hotels and Serviced Offices: The Cloud Model

Think of a major cloud provider, like Amazon Web Services (AWS), Google Cloud, or Microsoft Azure, as a global chain of hotels. Instead of buying land and constructing your own building from scratch, you rent space in one of their skyscrapers. You get to focus entirely on your business, while the hotel management handles the power grid, the plumbing, the elevators, the security staff, and the physical maintenance. You’re trading the burdens of ownership for the speed and convenience of a service.

The flexibility is a breath of fresh air. You can rent a single room for a weekend to try out a new idea. You can expand to a cluster of rooms for a busy week-long conference. If your business requires absolute privacy and stability, you can reserve an entire floor, complete with your own private elevator bank.

The pricing model seems simple at first glance: you pay for the rooms and services you use. But as anyone who has ever stayed in a hotel knows, the footnotes on the bill matter. That extra room service, the late-night calls to other cities, and the special deliveries between floors all show up on the final invoice. Understanding this consumption model is key to using the cloud effectively.

The advantage of the hotel model is **elasticity**. When a conference comes to town (a surge in traffic to your website), the hotel can instantly provide you with extra rooms to accommodate the influx. When the conference ends and things are quiet, you release the rooms, and your costs drop immediately. You don’t need to own a conference center just for that one week a year. You pay for what you use, when you use it.

There is, however, a trade-off. You do not control the wiring behind the walls. You don’t get to decide how the hotel’s power grid is designed. The hotel gives you granular controls at your own doors and in your own hallways, but they always keep a set of master keys to ensure the entire building remains safe, secure, and operational. You are a tenant in their building, and you must play by their rules.

> **In a Nutshell:** The cloud is a hotel. You rent the space and services you need, allowing you to scale up and down with demand. You let the hotel staff run the building, so you can focus on your work.

## 3.2 Your Private Floor: The Virtual Private Cloud (VPC)

When you move your business into the cloud hotel, you don’t just want a random assortment of rooms scattered throughout the building. You want a secure, isolated, and private space for your company. You want your own private floor. In the world of the cloud, this is a **Virtual Private Cloud (VPC)**.

A VPC is your own logically isolated section of the cloud. It’s a slice of the hotel that is entirely yours. The hallways are yours. The doors are yours. And you, and only you, get to decide who is allowed to visit.

When the hotel manager hands you the keys to your new floor, the first thing you do is lay out the floor plan. You don’t want a single open-plan office. You want to divide the floor into different wings for different purposes. This is a callback to the subnets we created in our original building.

*   You might designate one wing as the **public-facing area**. This is where your lobby, reception, and marketing offices are. These rooms need to be easily accessible from the main hotel entrance.
*   You’ll designate a much larger wing as the **private back-office**. This is where your sensitive accounting data, your internal machinery, and your employee-only areas are located. These rooms should have no direct windows or doors to the outside world.
*   You might create a third wing for **shared internal services**, like your own private library or database servers, which need to be accessed by other rooms on your floor but not by the public.

The elevator bank on your floor is your connection to the rest of the world. You get to decide which elevators stop on your floor and which rooms they can access. You can choose which of your rooms have a peephole to the street (a public IP address) and which remain entirely private and anonymous.

It’s important to note that this is where the physical analogy bends slightly. A VPC is not always a single, contiguous physical floor in a real data center. It is a *virtual* set of hallways that the hotel’s advanced technology carves out for you, potentially spanning across many different physical floors and racks of servers. The privacy, however, is very real, enforced by the hotel’s sophisticated internal security systems. The walls may be virtual, but they are just as strong as steel.

> **In a Nutshell:** A VPC is your private, secure floor in the cloud hotel. You define the layout with subnets (wings) and control all access to and from your floor using gateways (elevators).

### Technical Deep Dive

*   **VPC:** A logically isolated virtual network that you define within a cloud provider’s region. You have complete control over your virtual networking environment, including selection of your own IP address range, creation of subnets, and configuration of route tables and network gateways.
*   **Subnets:** A VPC is divided into one or more subnets. Each subnet exists within a single Availability Zone (a single data center) to ensure high availability.
    *   **Public Subnet:** A subnet is considered “public” if it has a route in its routing table that points directly to the Internet Gateway. This allows resources in the subnet to be directly reachable from the public internet (if they have a public IP address).
    *   **Private Subnet:** A subnet that does not have a route to the Internet Gateway. Resources in a private subnet cannot be reached from the internet.
*   **IP Addressing:** When you create a VPC, you assign it a range of private IP addresses from the ranges defined in RFC 1918 (e.g., `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). You are essentially choosing the numbering scheme for all the rooms on your private floor.

**ASCII Diagram: A VPC Floor Plan**

This diagram shows a typical VPC layout with a public wing for web servers and a private wing for the application and database servers.

```
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
|            |                                   v                 |
|            |                      +--------------------------+  |
|            |                      |   Database Server Room   |  |
|            |                      |      (Private IP)        |  |
|            |                      +--------------------------+  |
|            |                                                     |
|  +---------v------------------+                                  |
|  | Main Elevator (Router)     |                                  |
|  |   - Route to Internet GW   |                                  |
|  |   - Route to Private Wing  |                                  |
|  +----------------------------+                                  |
|                                                                    |
+--------------------------------------------------------------------+
```

## 3.3 The Hotel’s Many Doors: Gateways and Endpoints

Our private floor is secure and isolated. But we live in a connected world. Sometimes, our employees need to get information from the city library (an external API). Sometimes, they need to order supplies from a vendor across town (download software updates). And sometimes, they need to use the hotel’s own amenities, like the kitchen or the central archives.

A building needs doors. In the cloud, our private floor needs gateways and endpoints.

### The Main Entrance: The Internet Gateway

An **Internet Gateway (IGW)** is the hotel’s main entrance. It’s a two-way door to the public internet. People from the outside can come in, and people from the inside can go out. You attach an Internet Gateway to your VPC when you have rooms that must be publicly reachable, like the web servers in your public-facing wing.

For a visitor to find your web server, two things must happen. First, the web server needs a public, registered address that can be found in the city directory (an **Elastic IP address**). Second, there must be a clear path from the main hotel entrance (the IGW) to its front door, which is defined in your floor’s directory (the **route table**). The security guard at the door (the **Security Group**) is still there, of course, checking IDs. But the path is open. It’s a two-way street.

### The Staff-Only Exit: The NAT Gateway

Now, think about all the rooms in your private back-office wing: your internal databases, your application servers. You never, ever want a random person from the street to be able to walk up to their door. But these back-office workers still need to access the outside world. They need to run to the store for supplies (download a security patch) or call a vendor for a price check (query an external data source). They need to get *out*, but you can’t let the public *in*.

For this, you use a **NAT Gateway**. Think of it as a monitored, staff-only exit at the back of the hotel. Your internal workers can go to this exit and head out into the city. The guard at the door (the NAT Gateway) makes a note of who left and what they went to get. When the worker returns with their supplies, the guard checks their notes and says, “Ah, you went to get software updates. I know which room you came from; let me send you back there.” Crucially, no one from the outside can initiate a conversation through this door. It is strictly for traffic that is leaving first and then returning.

### The Private Service Door: VPC Endpoints

What happens when your employees on your private floor need to visit one of the hotel’s own massive amenities, like the central storage warehouse (Amazon S3) or the library (Google Cloud Storage)? The default way would be to leave your private floor, go down the elevator, walk through the main lobby, and head out onto the public street, only to walk down the block and re-enter the hotel through the warehouse’s public entrance. It works, but it’s inefficient and exposes you to the public street unnecessarily.

A **VPC Endpoint** is a private, secure service door that connects your floor directly to the hotel’s internal amenities. Instead of walking the public street, you’re using a secure, staff-only hallway. Your data never gets exposed to the public internet. This is a win for security, and it’s often faster and cheaper.

There are two main types of these service doors:

1.  **Gateway Endpoints:** These are like special, high-speed tunnels from your floor’s main junction to one of the hotel’s massive, shared utilities like the power grid (S3, DynamoDB). You don’t give the power grid a room number on your floor; you just update your floor’s directory (the route table) to say, “All requests for power go through this private tunnel.”
2.  **Interface Endpoints:** These are more like having a brand new, private door installed directly on your floor. This door leads to a specific hotel service, and that service actually gets its own room number (a private IP address) in your hallway. It feels like the service is located right there on your floor, and you can even place one of your own security guards at its door.

> **In a Nutshell:** Use the right door for the right job. The Internet Gateway is the main, two-way entrance for public traffic. The NAT Gateway is the secure, one-way exit for private resources. And VPC Endpoints are the private, staff-only hallways to the hotel’s own services, keeping your traffic off the public street.

## 3.4 Badges and Permissions: Identity and Access Management (IAM)

In a hotel, security is about more than just locks on the doors. The important element of security is identity. Who are you, and what are you allowed to do? This is managed through a system of keycards and permissions. In the cloud, this is **Identity and Access Management (IAM)**.

IAM is the hotel’s security department, responsible for issuing badges and defining who can go where. Every single person and every single service in the hotel carries an identity. A policy is a document that describes what an identity is allowed to do. The core principle of good security is **least privilege**. Give each person and service the absolute minimum set of permissions they need to do their job, and nothing more.

*   The CEO might have a master keycard that opens almost any door.
*   A software developer might have a keycard that gives them access to the development wing of their floor, but not the finance wing.
*   An automated cleaning robot (a service) might be given a special role that allows it to open the doors to empty rooms, but not occupied ones, and only between 3 a.m. and 5 a.m.
*   A temporary contractor might be given a badge that automatically expires at the end of the week.

IAM is the system that enforces these rules. It’s the source of truth for all permissions. When a request arrives at a door, the guard at the door (the firewall or Security Group) checks two things: first, the network rules (is traffic from this hallway allowed?), and second, the identity of the visitor (does this person’s badge give them permission to open this specific door?).

> **In a Nutshell:** Identity is the first and most important key to cloud security. Use IAM to define who can do what, always follow the principle of least privilege, and treat your master keys with the extreme care they deserve.

### Technical Deep Dive

*   **IAM Components:**
    *   **User:** An identity representing a human being.
    *   **Group:** A collection of users. You can apply policies to a group to give all its members the same permissions.
    *   **Role:** An identity that can be assumed by a user, an application, or a service. Roles are powerful because they provide temporary security credentials. For example, you can grant a server a role that allows it to write files to a specific storage bucket, without ever having to store a permanent secret key on the server itself.
    *   **Policy:** A JSON document that explicitly defines permissions. It states what actions are allowed or denied on which resources.
*   **Authentication vs. Authorization:**
    *   **Authentication** is the process of proving you are who you say you are (e.g., with a password and a multi-factor authentication token). This is checking your ID at the hotel’s front desk.
    *   **Authorization** is the process of determining what you are allowed to do once you’ve been authenticated. This is what the IAM policies define. Your ID gets you into the hotel; your keycard’s permissions determine which floors and rooms you can access.

This chapter has introduced the shift from owning your own building to renting a floor in a cloud hotel. We’ve seen how to create a private, secure floor (VPC), how to use the hotel’s various doors (gateways and endpoints), and how to manage identity with a system of badges and permissions (IAM). In the next chapter, we’ll explore the more advanced and dynamic services the hotel has to offer, from on-demand room service to a global chain of hotel branches.
