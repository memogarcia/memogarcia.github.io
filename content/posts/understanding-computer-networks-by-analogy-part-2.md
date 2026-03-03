---
title: "Understanding Computer Networks by Analogy: Part 2 - Cities as the Internet"
date: 2025-10-18T22:39:16+09:00
draft: false
---

> Think of the internet as a city full of buildings and streets. Routers are concierges, gateways are elevators, packets are envelopes, and DNS is the city directory that keeps everyone from getting lost.

License: CC BY-NC-ND 4.0

---

# Part Two: Cities as the Internet

In Part One, we looked at local networks as apartment buildings. We mapped devices to rooms, network interfaces to doors, and subnets to floors. We walked through how your computer slides an envelope down a pneumatic tube to the switch, and how the elevator acts as a gateway to the rest of the building.

But what happens when your envelope needs to leave the building entirely?

Maybe you're pulling a Docker image or querying an external API. The journey is the same: the envelope leaves your floor, exits your building, and has to navigate a complex maze of city streets and intersections until it finds the right building.

The internet isn't magic. It's a massive, chaotic, sprawling city that grew without any centralized zoning laws. And to navigate it, you have to understand the routers.

---

## Chapter 5: The Concierge with the Map

When you walk out of your building's front door to send a message across town, you hit the city streets. This is the internet. The streets are the physical fiber connections between networks, and the intersections are routers. 

The system that makes it work is actually pretty brilliant: nobody knows the whole map, but everyone knows enough to pass the envelope to the next guy.

Walk out of the elevator into your building's lobby, and you'll find a guy sitting behind the front desk with a thick binder. This is the concierge (your edge router). 

The concierge has one job: take envelopes from residents and figure out which street to throw them down next. They have absolutely no idea what the final destination looks like—just the very next step.

That thick binder on the desk is the routing table. It's not a complete map of the city; keeping track of that would be too computationally expensive. Instead, it's a list of simple, localized rules:
- "For buildings on Oak Street, hand the envelope to the courier at the east exit."
- "For anything in the downtown district, use the main post office drop."
- "For anything I don't recognize, just throw it at the central hub and let them figure it out."

Each rule specifies a destination network and a "next hop." The next hop is just another router—another concierge at another intersection—who will look at the envelope, check their own binder, and pass it along.

*(A quick note on the analogy: Calling a router a "concierge" starts to break down when you realize that cities are geographic, but networks are topological. Two routers sitting in the same physical rack in Virginia might be hundreds of "miles" apart topologically. But stick with me.)*

### Static vs. Dynamic Routes

How does the concierge fill out that binder? 

Sometimes, a network admin physically types a rule into the router. These are static routes. They are written in sharpie. If the admin knows that traffic to the accounting subnet should always go through port 2, they write it down. Static routes are great until someone trips over a power cable and the route goes down, and your concierge keeps blindly throwing envelopes into a brick wall because the binder said so.

The internet, however, changes constantly. Fiber cuts happen. Backhoes destroy conduits. To handle this, the concierges constantly gossip with each other. "Hey, my link to the financial district just died. Route around me." This gossip uses routing protocols, which dynamically update the binders in real-time. 

Inside a single corporate campus, routers use interior protocols like OSPF. OSPF is like a group of concierges constantly maintaining a hyper-accurate, localized map. It calculates the mathematically shortest path and adapts in seconds if a hallway collapses.

Out on the open internet, between different companies, a different beast rules: BGP (Border Gateway Protocol). BGP isn't about finding the fastest path; it's about business logic, money, and petty politics. It's how AT&T negotiates routes with Comcast. A BGP route might say, "To reach this network, go through Company A, because peering with Company B costs us too much money." 

### When Envelopes Get Lost

Sometimes a concierge makes a mistake. Someone writes a bad rule in the binder, and two routers just keep handing the same envelope back and forth to each other at the speed of light, forever. 

To prevent this from melting the internet, every envelope carries a counter called Time To Live (TTL). When the envelope leaves your computer, the TTL might be set to 64. Every single time a router touches it, they cross out the number and subtract one. 

If that counter hits zero, the router stops. It throws the envelope straight into the trash and sends a postcard back to you saying, "Time Exceeded." This simple countdown prevents routing loops from taking down the whole city. 

`traceroute` actually abuses this TTL mechanism. It sends a packet with a TTL of 1, and the first router kills it and replies. Then it sends a TTL of 2, and the second router kills it and replies. It forces every router along the path to expose itself, letting you map out the journey hop by hop.

---

## Chapter 6: The Appliances Inside the Apartment

Every envelope has an outside (the routing headers) and an inside (the actual payload). 

But an IP address only gets the envelope to a specific apartment (the server). When the envelope slides under the door of room 10-101, who actually opens it? 

You don't just have one thing running in your apartment. You have a TV, a fridge, a microwave. In a server, these are your applications. A single Linux box might be running a web server, an SSH daemon, and a Postgres database all at once. The envelope needs to reach the correct appliance.

That is what port numbers are for.

A port number is a specific appliance inside the apartment. When a packet arrives, the port number tells the OS exactly which application gets the data. Port 80 is the web server. Port 443 is the secure web server. Port 22 is SSH. 

### Sockets and Burner Phones

A socket is the combination of an IP address and a port. It uniquely identifies one specific end of a conversation (e.g., `192.168.1.50:443`). 

When your browser connects to a web server, it creates a pair of sockets. The server's socket is obvious: its IP plus port 443. 

But your laptop needs a return address, so it assigns itself a temporary port from a high range (like 54321). This is an ephemeral port. Think of it as a cheap burner phone you bought just for this one conversation. The exchange happens between your burner phone and the server's main line. 

This is how your OS keeps a bunch of simultaneous conversations straight. Whether it's fifty browser tabs, a package manager downloading updates, and Slack phoning home, each outgoing connection gets its own burner phone (ephemeral port). When the web server replies, your OS looks at the port numbers and knows exactly which connection gets the data. When the connection is done, the OS throws that burner phone in the trash so it can reuse the number later. 

### The Matryoshka Doll of Envelopes

Your message doesn't travel in a single envelope. It's encapsulated—stuffed inside an envelope, which is inside another envelope.

When you load a web page, your browser writes an HTTP request. The OS stuffs it into a TCP segment (the first envelope), which adds the source and destination port numbers. 

Then, the OS stuffs that TCP segment inside an IP packet (the second envelope). This adds the source and destination IP addresses and the TTL counter. Routers on the open internet forward traffic based on this IP envelope; most of the time they don't care about the TCP ports inside (though middleboxes like firewalls, NATs, and load balancers absolutely can).

Finally, to get the packet out of your physical door and to the local switch, your network card stuffs the IP packet into an Ethernet frame (the shipping box). This adds the local MAC addresses. 

The local switch opens the shipping box (Ethernet frame). The city routers look at the medium envelope (IP packet). When the message finally hits the destination server, it strips off the IP envelope, reads the small TCP envelope to find the port number, and hands the raw HTTP request to the web server application.

---

## Chapter 7: The Meticulous Courier and the Paperboy

The internet has two main ways to deliver your data. 

The first is the meticulous courier. You hire a guy who refuses to leave the destination until the recipient signs for every single page of a contract, in order. If a page gets lost, he radios back and demands a replacement. It's slow and annoying, but you have an ironclad guarantee that the document arrived perfectly.

The second is the paperboy in a moving truck. The truck blasts by the apartment at forty miles an hour, and the paperboy hurls a rolled-up newspaper at your balcony. He doesn't stop. He doesn't check if you caught it. He doesn't care if a dog ran off with it. It's incredibly fast, requires zero overhead, and is completely unreliable.

In networking, the courier is TCP. The paperboy is UDP. 

### TCP: The Meticulous Courier

TCP is the workhorse. It ensures your software updates aren't corrupted. Before TCP sends a single byte of actual data, it forces the two servers to do a formal three-way handshake (SYN, SYN-ACK, ACK) just to prove they can hear each other.

Once established, TCP assigns a sequence number to every packet. The receiving server constantly sends back acknowledgments. If a packet goes missing, the server notices a skipped number and demands a retransmission. TCP also handles flow control—if the network is congested, it automatically throttles back so it doesn't make the traffic jam worse. 

This reliability costs time. But for loading a webpage or querying a database, it's non-negotiable.

### UDP: The Paperboy

UDP doesn't care about handshakes. No acknowledgments, no sequence numbers, no flow control. It takes your datagram, throws it at the IP address, and immediately moves on. 

We use UDP when being fast and fresh is infinitely more important than being complete. Think of a multiplayer first-person shooter. If a packet showing your opponent's location from 500 milliseconds ago shows up late, you do not want it. You want their *current* location in the very next packet. Old data is useless data. The application just drops the stale update and keeps moving.

---

## Chapter 8: The City Directory

We have routers moving envelopes and TCP/UDP handling delivery. But there is a massive problem: you know your friend's name, but you don't know her street address. 

When you type `github.com` into your browser, your router never even sees that name. It only ever sees IP addresses on the envelopes it forwards. You know the name of the building, but you don't have its map coordinates.

This is why the city has a directory: DNS (Domain Name System). 

DNS is the internet's phonebook. It translates names that human brains can remember into the IP addresses that routers need to navigate.

When your browser asks, "Where is github.com?", it doesn't query one massive database. DNS is a distributed, hierarchical system of delegation.

Your computer usually doesn't talk to the root servers directly. It asks a **recursive resolver** (often your router, your ISP, or your company's DNS server). If the resolver doesn't already have the answer cached, *it* does the legwork:

It asks the root servers: "Who handles `.com`?" The root servers reply with the `.com` servers.
It asks a `.com` TLD server: "Who handles `github.com`?" The TLD server replies with GitHub's authoritative DNS servers.
Finally, it asks GitHub's authoritative server: "What is the IP for `github.com`?" It returns records (often an A record for IPv4 and/or an AAAA record for IPv6, sometimes via CNAMEs). The resolver caches the answer, your machine caches it too, and the connection begins.

### Why It's Always DNS

There's a reason we joke that "It's always DNS." When DNS breaks, the internet doesn't technically go down—it just becomes unusable for humans. If a DNS server crashes, you could still reach the server by typing its IP address into your browser... but no one remembers the IP address.

DNS relies heavily on caching. Every record has a TTL, which is basically "how long are caches allowed to remember this answer?"

If the TTL is 24 hours, resolvers are allowed to keep serving the old IP for up to 24 hours after you change it. That makes the web fast, but it makes migrations annoying. The practical move is to lower the TTL *before* a planned cutover so caches age out quickly, then raise it again afterward. Even then, some caches behave badly or have their own minimums, so expect a messy tail.

The city is chaotic, but it has rules. Envelopes go to concierges. Binders dictate routes. Packets move hop by hop. 

But what if you don't want to own a building? What if you don't want to run routers, manage cables, or deal with any of this physical hardware? 

You stop building real estate. You start renting. You move into the Cloud.
