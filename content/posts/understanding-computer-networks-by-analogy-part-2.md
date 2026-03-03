---
title: "Understanding Computer Networks by Analogy: Part 2 - Cities as the Internet"
date: 2025-10-18T22:39:16+09:00
draft: false
---

> Think of the internet as a city full of buildings and streets. Routers are concierges, gateways are elevators, packets are envelopes, and DNS is the city directory that keeps everyone from getting lost.

License: CC BY-NC-ND 4.0

---

# Part Two: Cities as the Internet

I have a confession to make: I spent the first five years of my career thinking the internet was basically magic sprinkled on copper wires.

Not the helpful kind of magic, either. The frustrating kind where things work perfectly until they suddenly don't, and nobody can tell you why. The kind where senior engineers shrug and say "it's DNS" with the same tone doctors use when they say "it's probably just a virus." Vague. Unhelpful. Probably true.

Here's what I've learned. The internet isn't magic. It's a city. A massive, chaotic, beautifully engineered city that grew organically without a master plan. Just like any city, it follows rules.

We spent Part One looking at local networks through the lens of a single apartment building. We mapped devices to rooms, network interfaces to doors, and subnets to floors. We figured out how to slide envelopes under your neighbors' doors and how the elevator acts as a gateway to the rest of the building.

Today, your envelope needs to reach someone who doesn't live in your building.

Maybe you are trying to pull a docker image from a registry, or maybe you are trying to query a database hosted by a different cloud provider. Whatever the payload, the journey is the same: the envelope has to leave your floor, exit your building, and navigate the city's streets, past countless concierges in countless other buildings, until it finally arrives.

---

## Chapter 5: The Concierge with the Map

When you walk out of your building's front door to send that message across town, you step into something much larger than your private hallways. The city has tens of thousands of streets and millions of addresses. Somehow, envelopes find their way from any building to any other building, every single day, without anyone planning the entire route in advance.

This city is the internet. The streets are the physical connections between networks, and the intersections are routers. The system that makes it all work is remarkable in its simplicity: nobody knows the whole map, but everyone knows enough to pass the envelope to the next person.

Walk out of the elevator into your building's lobby, and you will find a calm figure sitting behind the front desk with a thick binder. This is the concierge (your edge router). 

The concierge has one job: take envelopes from residents and figure out where to send them next. They don't know exactly how to get to the final destination—just the very next step.

That thick binder on the desk is a routing table. It's not a complete map of the city; maintaining that would be mathematically impossible. Instead, it contains simple rules like:
- "For buildings on Oak Street, hand the envelope to the courier at the east exit."
- "For anything in the downtown district, use the main post office drop."
- "For anything I don't recognize, send it to the central hub and let them figure it out."

Each rule specifies a destination network and a next hop. The next hop is just another router, another concierge at another location, who will look at the envelope, consult their own binder, and pass it along. A packet crosses the internet by passing through a sequence of these routers, each one making a localized decision. 

### Static vs. Dynamic Routes

Concierges fill out that binder in a few different ways. 

Some entries are written in by hand. These are static routes. They are simple and predictable. If the building management knows that deliveries to the warehouse should always go through the loading dock, they write that rule in the binder with ink. Static routes work perfectly when the network is small and the paths never change.

The internet changes constantly. Cables get cut, buildings lose power, and new paths are built. To handle this, the concierges constantly talk to each other. "Hey, I can reach the financial district quickly today. If you have anything going there, send it my way." This constant gossip uses routing protocols, allowing the binder to update itself dynamically in real-time. 

Inside a single organization—say, a corporate campus with several buildings—these concierges use interior protocols like OSPF (Open Shortest Path First). OSPF is like a group of concierges maintaining a highly detailed, localized map. It calculates the mathematically shortest path and adapts quickly if an internal hallway gets blocked.

Between different organizations out on the open internet, a different protocol dominates: BGP (Border Gateway Protocol). BGP isn't about finding the fastest path; it's about business logic and diplomacy. It's how different autonomous systems (which might be fierce competitors or close partners) negotiate routes. A BGP route might say, "To reach this network, pass it through Company A, then Company B." It allows engineers to set policies like, "I prefer routes that go through my business partners," or "Avoid sending my traffic through this specific country." 

### When Envelopes Get Lost

Sometimes a concierge makes a mistake. Someone writes a bad rule in the binder, and two concierges just keep handing the same envelope back and forth to each other forever.

To prevent this infinite loop from clogging the city streets, every envelope carries a counter called Time To Live (TTL). When the envelope leaves your building, the counter might be set to 64. Every single time a concierge touches it, they cross out the number and subtract one. 

If that counter ever hits zero, the concierge refuses to forward it. They throw the envelope straight into the trash and send a postcard back to the sender saying, "Your delivery expired and couldn't be completed." This simple countdown mechanism prevents routing mistakes from destroying the internet. 

During that 2014 outage I mentioned, staring blankly at the terminal, the one tool that actually helped me map the carnage was `traceroute`. `traceroute` works by intentionally exploiting this TTL mechanism. It sends packets with a TTL of 1, then 2, then 3. When those packets expire, the concierges along the route send back the "time exceeded" postcards, mapping out the journey hop by hop. I used it to figure out exactly which router was blackholing all of our traffic.

---

## Chapter 6: The Appliances Inside the Apartment

Every envelope has an outside and an inside. The outside is the header—routing information, return address, handling instructions. The inside is the payload. 

But there's a missing layer of detail. Let's go back to our core map. An IP address gets the envelope to a specific apartment in a specific building. But when the envelope slides under the door of room 10-101, who or what actually opens it? 

You don't just have one thing running in your apartment. You have a TV, a fridge, a microwave, a phone. In a computer, these are your applications. A single server might be running a web server, an email server, and a database all at the same time. The envelope needs to reach the correct appliance.

That is what port numbers are.

A port number is a specific appliance or resident inside the apartment. When a packet arrives, the port number tells the operating system exactly which application gets the data. Port 80 is the web server. Port 443 is the secure web server. Port 22 is the SSH daemon waiting in the corner. There are tens of thousands of possible ports.

When you type a URL into your browser, you are specifying a highly detailed address: the apartment building and room (the IP address), the specific appliance you want to talk to (port 443), and the specific document you want it to hand you (the URL path). 

### Sockets and Ephemeral Ports

Conversations go both ways. A socket is the combination of an IP address and a port. It uniquely identifies one specific end of a conversation. It's the apartment number plus the specific appliance.

When your browser connects to a web server, it creates a pair of sockets. The server's socket is obvious: its IP address plus port 443. 

Your computer needs a return address, so it assigns itself a temporary port from a high range (usually between 49152 and 65535). This is an ephemeral port. Think of it like a temporary burner phone you bought just for this one conversation. The exchange happens between your burner phone and the server's main line. 

This is how your laptop handles fifty Chrome tabs open at the same time without mixing up the data. Each tab gets its own burner phone (ephemeral port). When the replies come back, the operating system knows exactly which tab requested the video and which requested the text. Close the tab, and you throw the burner phone in the trash. 

### The Matryoshka Doll of Envelopes

Your message doesn't travel across the internet in a single envelope. It travels inside an envelope, which is inside another envelope, which is inside another envelope. We call this encapsulation.

Imagine you want to send an HTTP request to load a web page. 

First, your browser writes the HTTP request. It hands this to the operating system's network stack, which stuffs it into a TCP segment. This TCP envelope adds the source and destination port numbers so the applications know how to talk to each other. A standard TCP header is about 20 bytes of data tracking sequence numbers and acknowledgments.

Next, the operating system takes that entire TCP segment and stuffs it inside an IP packet. This IP envelope adds the source and destination IP addresses, plus that Time To Live (TTL) counter we talked about earlier. This header is another 20 bytes. The IP packet is what the routers (the concierges) care about. They don't look at the TCP ports; they just look at the IP address to figure out where the building is.

Finally, to get the packet out of your specific room and down the local hallway to the gateway, your computer stuffs the IP packet into an Ethernet frame. This final envelope adds the local MAC addresses. 

It's like putting a letter in a small envelope, putting that into a medium envelope, and putting that into a large shipping box. Each layer of the network only opens the envelope that matters to them. 

The local switch opens the shipping box (Ethernet frame). The city routers look at the medium envelope (IP packet). When the message finally arrives, the destination server strips off the IP envelope. It reads the small TCP envelope to find the port number. Then, it hands the raw HTTP request directly to the waiting web server application.

---

## Chapter 7: The Meticulous Courier and the Paperboy

The internet has two primary ways to deliver your data once it leaves the apartment. 

The first method is the meticulous courier. You hire someone who refuses to leave the destination until the recipient signs for every single page of a contract. If a page gets lost in transit, the courier radios back and demands you send a replacement. The courier is slow, annoying, and expensive, but you have an absolute, ironclad guarantee that the entire document arrived perfectly intact and in the exact right order.

The second method is the paperboy in a moving truck. The truck drives by the apartment at forty miles an hour, and the paperboy hurls a rolled-up newspaper at your balcony. He doesn't stop. He doesn't check if you caught it. He doesn't care if it landed in the bushes or if a dog ran off with it. He's already throwing the next paper. It's incredibly fast, requires zero overhead, and is completely unreliable.

In networking, the courier is TCP (Transmission Control Protocol). The paperboy is UDP (User Datagram Protocol). 

### TCP: The Meticulous Courier

TCP is the workhorse of the web. It ensures your bank statements load correctly and your software updates don't execute corrupted code. Before TCP allows any data to move, it forces the two devices to have a formal handshake to set up the connection. 

Your computer reaches out: *"I'd like to open a secure connection."*
The server responds: *"I acknowledge your request. Ready."*
Your computer confirms: *"I acknowledge you are ready. Let's begin."*

This is the three-way handshake (SYN, SYN-ACK, ACK). Once established, TCP goes to work. It assigns a sequence number to every single packet. Your computer tracks what it has sent. The server sends back a constant stream of acknowledgments. If a packet goes missing, the server notices a skipped number and demands a retransmission. 

TCP is also polite. It manages flow control. If the receiving server is overwhelmed, it tells your computer to slow down. If a router in the middle of the city gets congested, TCP automatically throttles back to avoid making the traffic jam worse. 

This reliability costs time. Handshakes add latency. Acknowledgments consume bandwidth. Retransmissions stall the application. But when every single byte *must* arrive in perfect order—like loading a webpage or downloading a database backup—this overhead is non-negotiable.

### UDP: The Paperboy

UDP doesn't care about handshakes. No acknowledgments. No sequence numbers. No flow control. It takes your datagram, throws it at the IP address, and immediately moves on. The packet might arrive. It might get dropped by a congested router. It might arrive out of order. UDP doesn't care. 

Engineers choose UDP because sometimes being fast and fresh is infinitely more important than being complete.

Think about a live Zoom call. If a packet containing one frame of video gets dropped somewhere in Ohio, you absolutely do not want TCP to freeze the entire video feed while it waits for a retransmission of a frame from a second ago. You want the application to drop the corrupted frame, accept a visual glitch, and keep playing the live stream. In real-time communications, old data is useless data. 

Multiplayer video games rely on UDP for the exact same reason. If the server drops a packet showing your opponent's location from 500 milliseconds ago, you don't want it later. You want their *current* location in the very next packet. 

### QUIC: The Modern Compromise

For decades, engineers had to choose between the heavy reliability of TCP or the reckless speed of UDP. Recently, however, a new protocol called QUIC emerged. 

QUIC actually runs on top of the lightweight UDP protocol, but it implements its own custom rules for reliability, ordering, and encryption right into the protocol itself. It is designed to establish connections much faster than TCP while still guaranteeing that the data arrives safely. If you are browsing the web today, you are probably already using it—QUIC is the foundation of HTTP/3, the modern protocol powering most major websites.

---

## Chapter 8: The City Directory

We have routers moving envelopes through the city, and we have TCP/UDP giving us rules for how to send them. We run into a massive problem: you know your friend's name, but you don't know her street address. 

When you type `example.com` into your browser, the router has absolutely no idea what to do with that. Routers don't read English. They only read IP addresses. You know the name of the building you want to visit, but you don't know its coordinates on the map.

This is why the city has a directory. 

The Domain Name System (DNS) is the internet's phonebook. Its only job is to translate names that human brains can easily remember (`google.com`) into the IP addresses that network routers actually use to navigate (`142.250.196.78`).

From the outside, it feels like magic. Your browser asks, "Where is Google?" A DNS server instantly fires back an IP address, and your browser connects. Under the hood, the directory isn't just one massive database sitting in a server room somewhere; it is a distributed, hierarchical system of delegation.

At the very top are the root servers. They don't actually know where `google.com` is. They only know who is in charge of the top-level domains: `.com`, `.org`, `.net`, `.io`. 
When your local computer asks the root server for `google.com`, the root says, "I don't know, but here is the address of the server in charge of all `.com` domains. Go ask them."

Your computer then asks the `.com` server (called the TLD server). The `.com` server says, "I don't know the exact IP, but I do know that a company named Google registered that name. Here is the address of Google's personal authoritative server. Go ask them."

Finally, your computer asks Google's server: "What is the exact IP for `www.google.com`?" Google's server hands you an A Record (which maps a name to an IPv4 address) or an AAAA Record (which maps to an IPv6 address). Your computer writes this answer down in a local cache so it doesn't have to ask again, and the connection begins. 

All of this jumping around happens in milliseconds. 

### Why DNS is Always the Problem

There is a running joke in systems administration: *"It's always DNS."* 

Because DNS is the foundational infrastructure of the web, when it breaks, the internet doesn't technically go down—it just becomes completely unusable for humans. If a DNS server crashes, you could still technically reach any server in the world by typing `142.250.196.78` into your browser... but nobody actually memorizes those numbers.

DNS uses a clever trick to handle the insane volume of requests: caching. Every single time a DNS record is created, the engineer attaches a Time To Live (TTL) to it. This tells the rest of the internet exactly how long they are allowed to remember this address before they have to ask for an update. If the TTL is set to 24 hours, the internet will aggressively cache the address. This makes the internet incredibly fast, but if you suddenly need to move your website to a new server with a new IP address, you have to wait a full 24 hours for the entire world to forget the old address and look up the new one. 

The city is massive, but it follows rules. Envelopes go to concierges. Binders dictate routes. Packets move hop by hop. 

But what if you don't want to own a building? What if you don't want to run routers, manage cables, or pay the power bill? 

You stop building real estate. You start renting. A room for a few hours, or a few thousand rooms worldwide. 

You check into the Cloud.