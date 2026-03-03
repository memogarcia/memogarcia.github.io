---
title: "Understanding Computer Networks by Analogy: Part 3 - Hotels as the Cloud"
date: 2025-10-18T22:39:16+09:00
draft: true
---

> Think of the cloud as a hotel: you rent a private tower, connect to the rest of the city through controlled doors, and use badges to decide who can go where.

License: CC BY-NC-ND 4.0

---

# Part Three: Hotels as the Cloud

## Chapter 10: The Hotel Tower

For years, companies ran out of buildings they actually owned. Building and managing your own physical data center is exactly like owning your own office building. You have absolute, god-like control over every single wire and switch, but you also have to deal with the miserable, physical reality of it. When the primary HVAC unit dies at two in the morning on a holiday weekend, it's *your* pager that goes off, and someone on your team has to drive to the site and deal with it.

If your business suddenly explodes and you need to handle massive traffic spikes or expand to Europe, it takes months of signing leases, ordering hardware, racking servers, and paying guys to run fiber. The capital expense is nauseating.

Eventually, you get tired of playing real estate developer. You check into a hotel.

The hotel is operated by a major cloud provider: Amazon Web Services (AWS), Google Cloud (GCP), or Microsoft Azure. They own the dirt, the concrete, the massive redundant power systems, and the physical security guards with guns. You just rent the space.

Instead of buying a building, you rent a private tower within their massive hotel complex. Instead of hiring an HVAC guy, you let the hotel handle the facilities. You only care about what happens inside your rooms: your applications and your data. 

This trade-off is the entire point of cloud computing. You lose the ability to physically inspect the router or design the electrical grid, but within your rented tower, you have complete software-defined autonomy to build the network however you want.

## Chapter 11: Designing Your Tower (VPCs)

When you check into this cloud hotel, they don't just scatter your servers across random rooms next to strangers. They hand you a logically isolated environment. 

In AWS and Google Cloud, this is called a **Virtual Private Cloud (VPC)**. In Azure, it's a VNet. It is your private tower. 

The very first thing you have to do when you get your tower is establish a numbering system. You define an IP address range (usually using CIDR notation like `10.0.0.0/16`), giving you over 65,000 available room numbers to play with. 

Once you have your address space, you start carving out your floors (**subnets**). 

You might build a public floor near the lobby (e.g., `10.0.1.0/24`). This is where you put the stuff that actually *needs* to talk directly to the internet, like web servers or load balancers. These rooms essentially have windows facing the busy street.

Then, you build a private floor higher up (e.g., `10.0.10.0/24`). This is where you hide the sensitive stuff: application backend servers, internal tools, and the databases holding your customers' credit card data. These rooms have no windows to the outside world. The only way in is through internal elevators you explicitly control. 

Here is where the physical analogy bends, but in a way that saves your job. Because cloud providers operate at an absurd scale, they don't want a single power outage or flood to take down your entire tower. So they divide their geographical regions into **Availability Zones (AZs)**. An AZ is a completely separate physical data center located miles away from the others, with an independent power grid and flood plain. 

When you design your VPC, you aren't just building floors in a single physical building; you are designing a logical tower that can span multiple Availability Zones. In many clouds (including AWS), each subnet (each "floor") lives inside one specific AZ, so you usually create matching public/private floors in each zone. You can put your primary database on the private floor in AZ-A, and a replica on a corresponding private floor in AZ-B. To your application, it can feel like they are down the hall from each other, but physically they are in separate buildings connected by the hotel's fiber. If a tornado rips the roof off AZ-A, your system can fail over to AZ-B while you let the cloud provider worry about replacing the wet carpets.

---

## Chapter 12: Doors to the World

Your private tower is perfectly isolated, which is great for security but terrible for business. A hotel with no exits is just a prison. You need controlled ways to communicate with the rest of the city. In cloud networking, these controlled exits are called **gateways**.

### The Main Entrance

If you have a web server sitting on your public floor, you want people from all over the world to be able to visit it. To make this happen, you attach an **Internet Gateway** to your VPC. 

Think of the Internet Gateway as the grand lobby doors of your hotel. It is a massive, two-way entrance. Once you install these doors and slap a public IP address on your web server, tourists from anywhere on the internet can walk right in and request a web page, and your server can hand the response right back out through those same doors.

### The Staff Exit

But what about your database and application servers hiding up on the private floor? They don't have public IP addresses. You absolutely do not want tourists walking in. But occasionally, they still need to reach the outside world—maybe to download a critical Linux security patch or fetch data from an external API. 

For this, you install a **NAT Gateway** (Network Address Translation). 

A NAT Gateway is essentially a one-way staff exit at the back of the hotel. Your internal servers can walk out, do their business in the city, and return with their packages. But if a stranger on the street tries to open that door from the outside, it is locked solid. 

When your private server sends a request out, the NAT Gateway quickly strips off your internal IP address, slaps its own public IP on the envelope, and assigns a temporary mail slot (an ephemeral port) so it can remember who sent it. When the patch downloads and the response comes back, it checks its ledger, swaps the internal IP back onto the envelope, and hands it to the right server. The outside world never even knows your private server exists.

### Private Service Doors

Often, your servers need to talk to other services run by the cloud provider itself, like an S3 storage bucket or a managed message queue. 

The inefficient way to do this is to send your data out the staff exit (NAT Gateway), drag it all the way across the public internet, and bring it back into the cloud provider's network. This works, but it's slow, it exposes your data to the public streets, and worst of all, cloud providers actively charge you money for pushing data out to the internet.

Instead, you install **VPC Endpoints**. 

These are like secret, private service tunnels connecting your specific tower directly to the hotel's internal amenities. Traffic never touches the public internet. It stays within the provider's private, incredibly fast network, making it more secure and often avoiding internet egress charges (though the endpoint itself can have its own cost). 

---

## Chapter 13: Badges and Security Guards

Locking the doors to your tower is just the physical perimeter. The much harder question to answer in a massive hotel is: *who are you, and what are you actually allowed to touch once you are inside?*

In a physical office building, you manage this with keycards. When a new hire starts, they get a badge that opens the front door and the breakroom, but it won't let them into the server room. 

In the cloud, this system is called **IAM** (Identity and Access Management). 

IAM is the absolute core of cloud security, and it constantly answers two separate questions: 
1. **Authentication:** Are you actually who you say you are? (Checked via passwords, MFA tokens, or API keys).
2. **Authorization:** Okay, I know who you are. Are you allowed to do this specific thing? (Checked via JSON policy documents).

Every single identity in your cloud must follow the principle of least privilege. If a web server only needs to read photos from a specific storage bucket, you do not give it a master admin keycard. You give it a badge that strictly allows `s3:GetObject` on that exact bucket, and nothing else. 

You assign these badges to human users, but more importantly, you assign them to machines using **IAM Roles**. An IAM Role is like a temporary visitor's badge. Instead of hardcoding permanent API keys into your application's source code (which is exactly how you end up on the front page of Hacker News for a massive data breach when a dev accidentally commits them to GitHub), your server simply assumes a Role when it boots up. It gets temporary credentials from the cloud provider that expire automatically. 

### The Security Checkpoints

Because cloud engineers are paranoid by nature, they don't just rely on one lock. They use multiple layers of security checkpoints that all have to agree before a packet is allowed through. 

1. **Network ACLs (The Perimeter Fence):** These operate at the floor (subnet) level. They are incredibly dumb but blisteringly fast. They look at every single packet independently and say, "Is this IP address on the blocklist?" They are great for banning an entire country's IP range from ever touching your floor. 
2. **Security Groups (The Bouncers):** These operate at the specific room (instance) level. Unlike ACLs, they are *stateful*. If the bouncer lets your server send a request out, they automatically remember the conversation and let the response back in. You use Security Groups to say, "Only allow incoming traffic on port 443 into this specific web server."
3. **IAM Policies (The Vault Keypad):** Even if a packet makes it past the fence and the bouncers and actually reaches a database, IAM steps in at the last microsecond and asks, "Does the identity attached to this request actually have permission to execute this specific command?"

All three of these layers overlap. A packet might make it through the security group just fine, only to get violently rejected by an IAM policy because it tried to delete a table it shouldn't have. This is defense in depth. 

---

You have designed your cloud tower. You have public floors and private floors, you've built staff exits to the city, and you've handed out carefully restricted badges to every machine. 

But modern applications are complicated. They run on wireless networks where everyone shares the air. They need mathematical encryption to protect data in transit. They consist of dozens of microservices that talk to each other constantly.

In Part Four, we leave the basic infrastructure behind and dive into these advanced concepts.
