---
title: "Understanding Computer Networks by Analogy: Part 2 - The Hotel City (Cloud)"
date: 2025-10-18T22:39:16+09:00
draft: false
---

# Part II: The Hotel City (Cloud)

Moving to the cloud feels like moving into a serviced hotel. You do not build the walls or run the elevators. You rent space, bring your rules, and let the hotel handle power, plumbing, and staff. In this part, we take our building and city mental model and extend it to hotels, private floors, and the pathways that connect everything.

We keep the same first principles: who am I talking to, how do I reach them, and do I have permission. Address, path, permission. Room, hallway, guard.

## Chapter 18: Cloud Computing: Hotels and Serviced Offices

Think of a cloud provider as a chain of well run hotels across the city. Instead of owning a building and fixing leaky pipes at 2 a.m., you rent space and focus on your work. The hotel keeps the lights on, the elevators smooth, and the housekeeping staff ready.

You can rent a single room to try an idea. You can expand to a cluster of rooms for a busy week. You can even reserve an entire floor if you need stability and privacy. The pricing is simple at first glance. You pay for the rooms and services you use. The footnotes matter, though. Extra room service and cross hallway deliveries show up on the bill. Ask me how I know.

The big win is elasticity. When a conference comes to town, the hotel can give you extra rooms for a short time. When it is quiet, you release space and your costs drop. You do not need to buy a building for a one week event.

> You do not control the wiring behind the walls. That is the trade you make for speed and convenience. The hotel gives you strong controls at the doors and in the hallways, but they keep some keys to keep the whole place running safely.

Callback to our letter story. The cloud is not a new city. It is part of the same city, but with hotels that let you move faster. You still write an envelope, pick a path, and follow the directory. You just do it inside someone else’s building.

> Cloud is a hotel. Rent what you need, scale up and down, and let the staff run the building while you focus on your work.

## Chapter 19: Your Private Floor in the Cloud (VPCs and Endpoints)

In a good hotel you can reserve a private floor. The hallways are yours, the doors are yours, and you decide who can visit. That is a Virtual Private Cloud, or VPC.

Inside your private floor, you lay out subnets like wings of the floor. One wing for public facing rooms, one for private back office rooms, and one for shared services. The elevator bank connects your wings to other floors and to the street. You choose which elevators stop on your floor. You choose which rooms have a peephole to the street and which stay entirely private.

Sometimes you need a service that lives in the hotel itself, like the hotel kitchen or laundry. You do not want to send a runner out onto the street for every request. VPC endpoints are service doors inside your private floor. You reach hotel services over your own hallways. No street traffic needed.

There are two useful styles of service doors. Interface endpoints feel like a door to a specific room on your floor. Gateway style endpoints feel like a special chute in the hallway. Both keep your traffic inside the hotel.

> The picture bends here. A VPC is not a single physical floor. It is a private set of hallways that the hotel carves out for you across one or more floors. The privacy is real, even if the walls are virtual.

> A VPC is your private floor. Use endpoints as service doors to keep errands off the street.

## Chapter 20: Serverless: Room Service on Demand

Some days you do not want to run a kitchen. You just want food to arrive when you ring. That is serverless. You place an order, the hotel prepares it, and you only pay for what you eat.

Serverless functions are short lived helpers. You hand them a task and they do it quickly, then disappear. No need to keep a staff member idle for the next call. The hotel schedules the staff for you.

Networking still matters. Your order needs to reach the right kitchen. If your function should stay on private hallways, you give it a door on your VPC. If it only needs to go out, you give it a path through your outbound staff exit. If it needs to reach a hotel service privately, you use an endpoint. The pattern is the same. Address, path, permission.

There are a few practical quirks. Sometimes the kitchen is cold and needs a minute to heat up before the first meal. That is a cold start. Sometimes the hotel limits how long a serverless helper can run. You split bigger meals into smaller courses. If you try to carry heavy boxes through the lobby, you might hit size limits. Plan around the furniture.

Callback to Chapters 12 and 13. You still pick the right slot and the right language. Serverless does not remove protocols. It just removes your need to run the oven.

> Serverless is room service. You still choose the path and rules, but the hotel runs the kitchen and staff.

## Chapter 21: Security Groups vs NACLs (Hotel Guards vs Hallway Rules)

Security in the hotel has two layers that work together. Security Groups are door guards. Network ACLs are hallway rules.

Door guards stand at each room. They check the conversation in context. If your room started a chat with a neighbor, replies are allowed back in. If a stranger knocks out of the blue, the guard checks a short list of allowed slots and sources. Everything else is a polite no. That is a stateful rule set.

Hallway rules live on the wing itself. They are posted like traffic signs. They do not remember previous conversations. They simply say what is allowed to pass in either direction. That is a stateless list. Use it to block obviously bad routes or to set broad wing wide policy.

The pattern that scales. Use door guards to express what each room needs. Use hallway rules sparingly to set guardrails. When you hit a problem, follow the envelope from room, to guard, to hallway rule, to the next hop. The culprit will show itself.

> Think room first, then hallway. Security Groups are per door and stateful. NACLs are per wing and stateless.

## Chapter 22: Internet vs NAT Gateways; Public and Private Subnets

On your private floor, some rooms face the street and others are tucked inside. Public subnets are the street facing wing. Private subnets are interior rooms with no direct street window.

To welcome guests from the street, you need an Internet Gateway. It is the hotel’s main entrance for your floor. Routes that point at this entrance make your street facing rooms reachable, subject to your guards at the doors.

For rooms that only need to make outbound trips, you use a NAT Gateway. Think of it as a staffed exit that lets your staff go out, pick up supplies, and come back, without giving the street a clear line of sight into the room. The front desk clerk rewrites the return address to the main building address and keeps a ledger to route replies back to the right room.

One cost hint for your future self. Trips through the NAT exit often carry a per trip fee and can add a distance charge. Keep heavy errands inside the hotel using endpoints when you can.

> NAT translates addresses and ports. It is not a firewall. Keep explicit allow and deny rules at your guards.

### Load Balancers vs Gateways

Gateways are building entrances and exits. They connect your floor to the public street or to other parts of the hotel. **Load balancers** are traffic coordinators for a cluster of identical rooms. They stand at a small desk in front of several doors that all provide the same service and decide which door should take the next visitor.

Two common styles help:
- **L4 (transport) load balancers:** Look only at addressing and port info, like “deliver to any web worker on slot 443.” Fast, simple, and great for TCP/UDP traffic.
- **L7 (application) load balancers:** Peek at the contents, like HTTP paths or headers. They can route 
  “/images” to one set of rooms and “/api” to another, rewrite addresses, and terminate TLS.

Why it matters: gateways make you reachable or provide egress; load balancers distribute work across many identical rooms. You often use both together, a public entrance (Internet Gateway) plus a load balancer in front of your web rooms, with guards at every boundary.

> Internet Gateway is your street entrance for public rooms. NAT Gateway is your outbound only exit for private rooms.

## Chapter 23: VPC Peering and Private Service Endpoints

Sometimes you need to visit another company’s floor in another hotel. Other times you only need a safe hatch to their kitchen. Different needs, different paths.

VPC Peering is a private hallway between two private floors. Rooms on either side can speak as if they share a building map. It is simple and fast, but it is point to point. One hallway per pair. The city becomes a web of private hallways if you connect many floors.

Private service endpoints are like service hatches. You do not open a general hallway. You create a private slot to a specific service on the other side. Your traffic stays off the street and only reaches the service you name. Great for using a partner’s kitchen without giving access to their whole floor.

> The picture bends here. Some providers implement these hatches with additional relays behind the scenes. The privacy is still strong, but the path is mediated by the hotel. Remember first principles. Address, path, permission.

> Peering is a private hallway between floors. Private endpoints are a narrow hatch directly to a named service.

## Chapter 24: Hybrid Connectivity (VPN and Dedicated Private Links)

You still have your original office building back home. You want a steady path between it and your new hotel floor. Two common choices help.

Site to site VPN is a secure tunnel over the public streets. Imagine a marked shuttle that carries sealed envelopes between your building and the hotel at regular intervals. It is quick to set up and works well, but it shares the road with everyone else.

Dedicated private links are like leasing a private elevator between your building and the hotel. Predictable, quiet, and reserved. They take longer to arrange and cost more, but they give you consistency when every minute counts.

Often you start with a shuttle and move to a private elevator when traffic and reliability demands grow. Both rely on the same idea. Build a clear path, set clear rules, and keep good maps at both ends.

> VPN is a secure shuttle on public streets. Dedicated links are private elevators. Choose based on speed, cost, and consistency.

## Chapter 25: Cloud DNS and Service Discovery

Inside the hotel, names also matter. You might have private names that never appear in the city directory. The hotel runs a front desk directory for your private floor.

Cloud DNS lets you create zones for internal names. Your rooms ask the local clerk, and the clerk answers from a private list. You can split answers based on who is asking. Staff get one set of directions. Guests get another. That is split horizon.

Service discovery adds a moving piece. Some services scale up and down during the day. Rather than pinning a single room number, you publish a name that maps to whichever rooms are currently on shift. Your apps ask the directory for the name and get a fresh list of doors to try.

Callback to Chapter 14. Same idea as DNS, but scoped to the hotel and tuned for change. Caching still applies, TTL still matters, and authoritative sources still speak with authority.

> Use cloud DNS for private names and service discovery to track rooms that scale up and down.

## Chapter 26: IAM and Roles: Badges and Permissions

Identity is the first key. In a real hotel, badges decide which floors you can reach and which rooms you can open. In the cloud, IAM plays that role.

Every person and every service carries an identity. Policies describe what that identity can do. You grant a role to a service so it can fetch secrets or write to storage without sharing a master key. You grant a temporary badge to a contractor that expires when the job ends.

Least privilege is the habit to build early. Give each person and service only what they need. Audit your badges and lock away master keys. Your future self will sleep better, and so will your auditor.

Callback to Chapter 15. Guards check lists, not vibes, and IAM is the source of those lists. If a request reaches a door, the guard checks both the network rules and the identity of the visitor before opening.

> Treat identity as your first key. Use roles for services, least privilege for everyone, and rotate keys.

## Chapter 27: VPC Flow Logs and Monitoring

Even in a calm hotel, you want cameras in the hallways and a visitor log at the desk. Not to snoop, but to debug, explain, and improve.

VPC flow logs record who tried to talk to whom, on which slot, and whether the guard allowed it. They do not capture the contents of the conversation, just the addressing and result. That is usually enough to answer, why can this room not reach that service, or, who is knocking on this door every minute.

Metrics add the heartbeat. Requests per minute, error rates, and average waiting times tell you when a hallway is getting crowded or when a service is tired. Traces show the path an envelope took through multiple rooms so you can find the slow staircase.

The habit to build. When something breaks, follow the envelope and check the logs at each boundary. Room, door guard, hallway rule, concierge, and the next building. The answer is rarely magic. It is a missing rule, a wrong map, or a busy elevator.

> Turn on flow logs and watch your metrics. When in doubt, follow the envelope and check each boundary.
