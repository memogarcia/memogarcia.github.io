---
title: "Understanding Computer Networks by Analogy: Part 3 - Hotels as the Cloud"
date: 2025-10-18T22:39:16+09:00
draft: true
---

> Think of the cloud as a hotel: you rent a private floor, connect to the rest of the city through controlled doors, and use badges to decide who can go where.

License: CC BY-NC-ND 4.0

---

# Part Three: Hotels as the Cloud

## Chapter 10: The Hotel Tower

For years, companies operated out of buildings they owned. Building and managing your own physical data center is exactly like owning your own office building. You have total control over every single wire, but you also have to deal with the gritty, physical reality of it. When the HVAC unit breaks at two in the morning, someone on your team has to drive out there and fix it. 

When the business grows and you suddenly need to handle massive traffic spikes or expand to three new cities, it takes months of signing leases, ordering hardware, racking servers, and running fiber. The capital expense is enormous. 

So eventually, you get tired of dealing with real estate and you check into a hotel.

The hotel is operated by a major cloud provider: Amazon Web Services, Google Cloud, or Microsoft Azure. They own the land, the concrete buildings, the massive power systems, and the physical security guards. You just rent space from them.

Instead of purchasing a building, you rent an entire private tower within their massive hotel complex. Instead of hiring maintenance staff, you let the hotel handle the facilities. You only care about what happens inside your rooms: your applications and your data. 

This trade-off is the foundation of cloud computing. You lose the ability to design the electrical system or physically inspect the router, but within your rented tower, you have complete autonomy to design the logical layout.

## Chapter 11: Designing Your Floors (VPCs)

When you check into this cloud hotel, they don't just scatter your servers across random rooms. They give you a logically isolated environment. 

In AWS and Google Cloud, this is called a **Virtual Private Cloud (VPC)**. In Azure, it's a VNet. It is your private tower. 

The first thing you have to do when you get your tower is establish a numbering system. You define an IP address range (usually using CIDR notation like `10.0.0.0/16`), giving you over 65,000 available room numbers to work with. 

Once you have your address space, you start building your floors (**subnets**). 

You might create a public floor near the lobby (e.g., `10.0.1.0/24`). This is where you put resources that actually need to talk directly to the internet, like web servers or load balancers. These rooms essentially have windows facing the street.

Then, you create a private floor higher up (e.g., `10.0.10.0/24`). This is where you hide your sensitive components: application backend servers, internal tools, and databases. These rooms have no windows to the outside world. The only way in is through internal elevators you explicitly control. 

Here is where the physical analogy bends, but in a very cool way. Because cloud providers operate at massive scale, they don't want a single power outage to take down your entire tower. So they divide their geographical regions into **Availability Zones (AZs)**, which are completely separate physical data centers located miles apart from each other, complete with independent power grids and flood zones. 

When you design your VPC, you aren't just building floors in a single physical building; you are effortlessly stretching your logical tower across multiple Availability Zones. You can put your primary database on the private floor in AZ-A, and a replica on the exact same private floor over in AZ-B. To your application, it just looks like they are down the hall from each other, but if a hurricane hits AZ-A, your private floor continues operating seamlessly. You just let the cloud provider worry about replacing the wet carpets.

---

## Chapter 12: Doors to the World

Your private tower is perfectly isolated, but a hotel with no exits isn't very useful. You need controlled ways to communicate with the rest of the city. In cloud networking, these controlled exits are called **gateways**.

### The Main Entrance

If you have a web server sitting on your public floor, you want people from all over the world to be able to visit it. To make this happen, you attach an **Internet Gateway** to your VPC. 

Think of the Internet Gateway as the grand lobby doors of your hotel. It is a massive, two-way entrance. Once you install these doors and give your web server a public IP address, tourists from anywhere on the internet can walk right in and request a web page, and your server can hand the response right back out through the same doors.

### The Staff Exit

But what about your database and application servers hiding up on the private floor? They don't have public IP addresses. They don't want tourists walking in. But occasionally, they still need to reach the outside world to download software patches or fetch external API data. 

For this, you install a **NAT Gateway** (Network Address Translation). 

A NAT Gateway is essentially a one-way staff exit at the back of the hotel. Your internal servers can walk out, do their business in the city, and return with their packages. But if a stranger on the street tries to open that door from the outside, it is locked solid. 

When your private server sends a request out, the NAT Gateway quickly strips off your internal IP address, slaps its own public IP on the envelope, and assigns a temporary mail slot (an ephemeral port) so it can remember who sent it. When the response comes back, it checks its ledger, swaps the internal IP back onto the envelope, and hands it to the right server. The outside world never even knows your private server exists.

### Private Service Doors

Often, your servers need to talk to other services run by the cloud provider itself, like an S3 storage bucket or a managed message queue. 

The naive way to do this is to send your data out the staff exit (NAT Gateway), drag it all the way across the public internet, and bring it back into the cloud provider's network. This works, but it is slow, it exposes your data to the public streets, and cloud providers actively charge you money for pushing data out to the internet.

Instead, you can install **VPC Endpoints**. 

These are like secret, private service tunnels connecting your specific tower directly to the hotel's internal amenities. Traffic never touches the public internet. It stays entirely within the provider's private fiber network, making it significantly faster, mathematically more secure, and completely free of outbound data charges. 

---

## Chapter 13: Badges and Security Guards

Locking the doors to your tower is just the physical perimeter. The much harder question to answer in a massive hotel is: *who are you, and what are you actually allowed to touch once you are inside?*

In a physical building, you manage this with keycards. When a new employee starts, they get a badge that opens the front door but won't open the server room. 

In the cloud, this system is called **IAM** (Identity and Access Management). 

IAM is arguably the most critical security concept in the cloud, and it constantly answers two separate questions: 
1. **Authentication:** Are you actually who you say you are? (Checked via passwords, MFA, or API keys).
2. **Authorization:** Now that I know who you are, are you allowed to do this specific thing? (Checked via JSON policy documents).

Every single identity in your cloud should follow the principle of least privilege. If a web server only needs to read photos from a specific storage bucket, you don't give it a master keycard. You give it a badge that only allows `Read` access to that exact bucket. 

You can assign these badges to human users, but more importantly, you can assign them to machines using **IAM Roles**. An IAM Role is like a temporary visitor's badge. Instead of hardcoding permanent API keys into your application code (which is how you end up on the front page of Hacker News for a data breach), your server simply assumes a Role when it boots up. It gets temporary credentials that expire automatically. 

### The Security Checkpoints

Because cloud engineers are paranoid, they don't just rely on one lock. They use multiple layers of security checkpoints that all have to agree before a packet is allowed through. 

1. **Network ACLs (The Perimeter Fence):** These operate at the floor (subnet) level. They are incredibly dumb but very fast. They look at every single packet independently and say, "Is this IP address on the blocklist?" They are great for banning a whole country's IP range from ever touching your floor. 
2. **Security Groups (The Bouncers):** These operate at the specific room (instance) level. Unlike ACLs, they are *stateful*. If the bouncer lets your server send a request out, they automatically remember the conversation and let the response back in. You use Security Groups to say, "Only allow traffic on port 443 into this specific web server."
3. **IAM Policies (The Vault Keypad):** Even if a packet makes it past the fence and the bouncers and reaches a database, IAM steps in at the last microsecond and asks, "Does the identity attached to this request actually have permission to execute this specific command?"

All three of these layers overlap. A packet might make it through the security group just fine, only to get rejected by an IAM policy because it tried to delete something it shouldn't have. This is defense in depth. 

---

You have designed your cloud tower. You have public floors and private floors, you've built staff exits to the city, and you've handed out carefully restricted badges to every machine. 

But modern applications are complicated. They run on wireless networks where everyone shares the air. They need mathematical encryption to protect data in transit. They consist of dozens of microservices that talk to each other constantly.

In Part Four, we leave the basic infrastructure behind and dive into these advanced concepts.
