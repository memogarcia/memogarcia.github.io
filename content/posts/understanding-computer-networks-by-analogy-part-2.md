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

But here's what I've learned: the internet isn't magic. It's a city. A massive, chaotic, beautifully engineered city that grew organically without a master plan. And just like any city, it follows rules.

We spent Part One looking at local networks through the lens of a single apartment building. We mapped devices to rooms, network interfaces to doors, and subnets to floors. We figured out how to slide envelopes under your neighbors' doors and how the elevator acts as a gateway to the rest of the building.

But today, your envelope needs to reach someone who doesn't live in your building.

Maybe you are trying to pull a docker image from a registry, or maybe you are just trying to query a database hosted by a different cloud provider. Whatever the payload, the journey is the same: the envelope has to leave your floor, exit your building, and navigate the city's streets, past countless concierges in countless other buildings, until it finally arrives.

This is where abstractions start to leak, and it's where you'll finally understand why that weird latency spike last week wasn't your application's fault. Let's step outside.

---

## Chapter 5: The Concierge with the Map

When you walk out of your building's front door to send that message across town, you step into something much larger than your private hallways. The city has tens of thousands of streets and millions of addresses. And somehow, envelopes find their way from any building to any other building, every single day, without anyone planning the entire route in advance.

This city is the internet. The streets are the physical connections between networks, and the intersections are **routers**. The system that makes it all work is remarkable in its simplicity: nobody knows the whole map, but everyone knows enough to pass the envelope to the next person.

Walk out of the elevator into your building's lobby, and you will find a calm figure sitting behind the front desk with a thick binder. This is the concierge (your edge router). 

The concierge has one job: take envelopes from residents and figure out where to send them next. They don't know exactly how to get to the final destination—just the very next step.

That thick binder on the desk is a **routing table**. It's not a complete map of the city; maintaining that would be mathematically impossible. Instead, it contains simple rules like:
- "For buildings on Oak Street, hand the envelope to the courier at the east exit."
- "For anything in the downtown district, use the main post office drop."
- "For anything I don't recognize, send it to the central hub and let them figure it out."

Each rule specifies a destination network and a **next hop**. The next hop is just another router, another concierge at another location, who will look at the envelope, consult their own binder, and pass it along. A packet crosses the internet by passing through a sequence of these routers, each one making a localized decision. 

### Static vs. Dynamic Routes

So how does the concierge fill out that binder? 

Some entries are written in by hand. These are **static routes**. They are simple and predictable. If the building management knows that deliveries to the warehouse should always go through the loading dock, they write that rule in the binder with ink. Static routes work perfectly when the network is small and the paths never change.

But the internet changes constantly. Cables get cut, buildings lose power, and new paths are built. To handle this, the concierges constantly talk to each other. "Hey, I can reach the financial district quickly today. If you have anything going there, send it my way." This constant gossip uses **routing protocols**, allowing the binder to update itself dynamically in real-time. 

Inside a single organization—say, a corporate campus with several buildings—these concierges use interior protocols like **OSPF** (Open Shortest Path First). OSPF is like a group of concierges maintaining a highly detailed, localized map. It calculates the mathematically shortest path and adapts quickly if an internal hallway gets blocked.

But between different organizations out on the open internet, a different protocol dominates: **BGP** (Border Gateway Protocol). BGP isn't about finding the fastest path; it's about business logic and diplomacy. It's how different autonomous systems (which might be fierce competitors or close partners) negotiate routes. A BGP route might say, "To reach this network, pass it through Company A, then Company B." It allows engineers to set policies like, "I prefer routes that go through my business partners," or "Avoid sending my traffic through this specific country." 

### When Envelopes Get Lost

What happens if a concierge makes a mistake? What if someone wrote a bad rule in the binder, and two concierges just keep handing the same envelope back and forth to each other forever?

To prevent this infinite loop from clogging the city streets, every envelope carries a counter called **Time To Live (TTL)**. When the envelope leaves your building, the counter might be set to 64. Every single time a concierge touches it, they cross out the number and subtract one. 

If that counter ever hits zero, the concierge refuses to forward it. They just throw the envelope straight into the trash and send a postcard back to the sender saying, "Your delivery expired and couldn't be completed." This simple countdown mechanism is what prevents routing mistakes from destroying the internet. In fact, if you've ever used the `traceroute` command, you've used this feature. `traceroute` works by intentionally sending packets with a TTL of 1, then 2, then 3, and recording the address of the concierges who send back the "time exceeded" postcards, mapping out the route hop by hop.

---

## Chapter 6: Envelopes, Mail Slots, and Conversations

Let's look more closely at the envelope itself.

Every envelope has an outside and an inside. The outside has the routing information—where it came from, where it's going, and maybe some handling instructions. The inside contains the actual message you care about. 

In networking, the outside of the envelope is called the **header**, and the inside is the **payload**. A **packet** is just a digital envelope. 

But there is a missing layer of detail here. Think about what happens when your envelope finally arrives at the correct building across town. What if that building is a massive skyscraper with a hundred different offices inside, each one expecting their own mail? A single street address (an IP address) isn't enough to get the letter to the right person. You need suite numbers or mail slots.

That is exactly what **port numbers** are. 

A port number is a specific mail slot on the door of the destination device. When a packet arrives at a server, the port number tells the operating system which specific application should receive it. Port 80 is the standard slot for unencrypted web traffic. Port 443 is the slot for secure, encrypted web traffic. Port 22 is for SSH, so administrators can remotely manage the server. Because there are tens of thousands of possible ports, a single server can run a web server, an email server, and a database all at the exact same time, just by listening on different mail slots.

When you type a URL into your browser, you are actually specifying a full address that looks like this: the building (the server's IP), the mail slot (port 443), and the specific document you want inside (the URL path). 

### Sockets and Ephemeral Ports

For a conversation to actually work, mail has to go both ways. This requires a **socket**, which is just the combination of an IP address and a port. It uniquely identifies one specific end of a conversation. 

When your browser connects to a web server, it creates a pair of sockets. The server's socket is obvious: its IP address plus port 443. But what about your computer? 

Your computer automatically assigns itself a temporary, random mail slot from a high range (usually somewhere between 49152 and 65535). This is called an **ephemeral port**. The conversation happens between your ephemeral port and the server's port 443. This is how your computer can handle having fifty Chrome tabs open at the same time without getting confused; each tab gets its own ephemeral port, so when the replies come back, the operating system knows exactly which tab requested the data. When you close the tab, the conversation ends, and that temporary mail slot is destroyed. 

### The Matryoshka Doll of Envelopes

Here is the part that usually confuses people: your message doesn't travel across the internet in a single envelope. It travels inside an envelope, which is inside another envelope, which is inside another envelope. We call this **encapsulation**.

Imagine you want to send an HTTP request to load a web page. 

First, your browser writes the HTTP request. It hands this to the operating system's network stack, which stuffs it into a **TCP segment**. This TCP envelope adds the source and destination port numbers so the applications know how to talk to each other. A standard TCP header is about 20 bytes of data tracking sequence numbers and acknowledgments.

Next, the operating system takes that entire TCP segment and stuffs it inside an **IP packet**. This IP envelope adds the source and destination IP addresses, plus that Time To Live (TTL) counter we talked about earlier. This header is another 20 bytes. The IP packet is what the routers (the concierges) care about. They don't look at the TCP ports; they just look at the IP address to figure out where the building is.

Finally, to get the packet out of your specific room and down the local hallway to the gateway, your computer stuffs the IP packet into an **Ethernet frame**. This final envelope adds the local MAC addresses. 

It's like putting a letter in a small envelope, putting that into a medium envelope, and putting that into a large shipping box. Each layer of the network only opens the envelope that matters to them. 

The local switch opens the shipping box (Ethernet frame). The city routers look at the medium envelope (IP packet). When the message finally arrives at the destination server, the server strips off the IP envelope, reads the small TCP envelope to find the port number, and hands the raw HTTP request to the web server application.

---

## Chapter 7: Registered Mail and Postcards

The post office in our city essentially offers two distinct types of delivery service.

The first is registered mail. When you send a registered letter, it's a formal process. You get a tracking number, you know exactly when it was picked up, and you get a signature when it is delivered. If the letter gets lost, the post office notifies you so you can send a replacement. If the recipient moves, the letter comes back. Registered mail is slower, heavier, and costs more effort, but it comes with an absolute guarantee of delivery.

The second service is a simple postcard. You scrawl your message on the back, drop it into a blue mailbox on the corner, and hope for the best. There is no tracking number, no delivery confirmation, and no guarantee it won't get chewed up in the sorting machine. But it's incredibly fast, cheap, and perfect for casual updates where missing one card won't ruin your day. 

In networking, registered mail is **TCP** (Transmission Control Protocol), and the postcard is **UDP** (User Datagram Protocol). 

### TCP: The Guarantee

TCP is the workhorse of the web. It is the protocol that ensures your bank statements load correctly and your file downloads don't corrupt. But before TCP allows any data to actually move, it forces the two devices to have a formal handshake to set up the connection. 

Your computer reaches out and essentially says, *"I'd like to open a secure connection."*
The server responds, *"I acknowledge your request, and I'm ready to receive."*
Your computer confirms, *"I acknowledge that you are ready. Let's begin."*

This is the famous **three-way handshake** (SYN, SYN-ACK, ACK). Once this connection is established, TCP goes to work. It assigns a sequence number to every single packet. Your computer meticulously tracks what it has sent, and the server sends back a constant stream of acknowledgments for what it has received. If a packet goes missing along the route, the server realizes a number was skipped and asks your computer to retransmit it. 

TCP is also polite; it actively manages flow control. If the receiving server is getting overwhelmed, it tells your computer to slow down. If a router in the middle of the internet gets congested, TCP automatically throttles back to avoid making the traffic jam worse. 

All of this reliability comes at a cost. Those handshakes take time to establish. The constant stream of acknowledgments consumes bandwidth. Retransmitting lost packets adds latency. For applications where every single byte *must* arrive in perfect order—like loading a webpage or downloading an executable—this overhead is entirely worth it. 

### UDP: The Postcard

UDP doesn't care about handshakes. It doesn't care about acknowledgments, sequence numbers, or flow control. It just takes your datagram, throws it into the network, and immediately moves on to the next one. The packet might arrive. It might get dropped by a congested router. It might even arrive out of order. UDP doesn't care. 

So why would an engineer ever choose a protocol that explicitly *doesn't* guarantee delivery? 

Because for some applications, being fast and fresh is infinitely more important than being complete.

Think about a live Zoom call. If a packet containing one frame of video gets lost somewhere in Ohio, you absolutely do not want TCP to stop the entire video feed while it waits for a retransmission of a frame that is now a full second in the past. You just want the application to drop that corrupted frame, accept a slight visual glitch, and keep playing the live stream. In real-time communications, old data is useless data. 

Multiplayer video games rely heavily on UDP for the exact same reason. If the server drops a packet showing your opponent's location from 500 milliseconds ago, you don't want to wait for it; you just want their *current* location in the very next packet. 

### QUIC: The Modern Compromise

For decades, engineers had to choose between the heavy reliability of TCP or the reckless speed of UDP. Recently, however, a new protocol called **QUIC** emerged. 

QUIC actually runs on top of the lightweight UDP protocol, but it implements its own custom rules for reliability, ordering, and encryption right into the protocol itself. It is designed to establish connections much faster than TCP while still guaranteeing that the data arrives safely. If you are browsing the web today, you are probably already using it—QUIC is the foundation of HTTP/3, the modern protocol powering most major websites.

---

## Chapter 8: The City Directory

We have routers moving envelopes through the city, and we have TCP/UDP giving us rules for how to send them. But there is a massive problem: you know your friend's name, but you don't know her street address. 

When you type `example.com` into your browser, the router has absolutely no idea what to do with that. Routers don't read English. They only read IP addresses. You know the name of the building you want to visit, but you don't know its coordinates on the map.

This is why the city has a directory. 

The **Domain Name System (DNS)** is the internet's phonebook. Its only job is to translate names that human brains can easily remember (`google.com`) into the IP addresses that network routers actually use to navigate (`142.250.196.78`).

From the outside, it feels like magic. Your browser asks, "Where is Google?" A DNS server instantly fires back an IP address, and your browser connects. But under the hood, the directory isn't just one massive database sitting in a server room somewhere; it is a distributed, hierarchical system of delegation.

At the very top are the **root servers**. They don't actually know where `google.com` is. They only know who is in charge of the top-level domains: `.com`, `.org`, `.net`, `.io`. 
When your local computer asks the root server for `google.com`, the root says, "I don't know, but here is the address of the server in charge of all `.com` domains. Go ask them."

Your computer then asks the `.com` server (called the **TLD server**). The `.com` server says, "I don't know the exact IP, but I do know that a company named Google registered that name. Here is the address of Google's personal **authoritative server**. Go ask them."

Finally, your computer asks Google's server: "What is the exact IP for `www.google.com`?" Google's server hands you an **A Record** (which maps a name to an IPv4 address) or an **AAAA Record** (which maps to an IPv6 address). Your computer writes this answer down in a local cache so it doesn't have to ask again, and finally, the connection begins. 

All of this jumping around happens in milliseconds. 

### Why DNS is Always the Problem

There is a running joke in systems administration: *"It's always DNS."* 

Because DNS is the foundational infrastructure of the web, when it breaks, the internet doesn't technically go down—it just becomes completely unusable for humans. If a DNS server crashes, you could still technically reach any server in the world by typing `142.250.196.78` into your browser... but nobody actually memorizes those numbers.

DNS uses a clever trick to handle the insane volume of requests: caching. Every single time a DNS record is created, the engineer attaches a **Time To Live (TTL)** to it. This tells the rest of the internet exactly how long they are allowed to remember this address before they have to ask for an update. If the TTL is set to 24 hours, the internet will aggressively cache the address. This makes the internet incredibly fast, but if you suddenly need to move your website to a new server with a new IP address, you have to wait a full 24 hours for the entire world to forget the old address and look up the new one. 

You've navigated the city. You've handed envelopes to concierges, watched them consult their BGP binders, and followed the packets hop by hop. You've learned when to demand a signature (TCP) and when to just throw a postcard in the mailbox (UDP). You've even used the city directory (DNS) to figure out where you are actually going.

The city makes sense now. The chaos resolves into manageable, repeatable physical patterns. 

But what if you don't want to own a building? What if you are tired of running your own routers, managing your own cables, and paying for your own electricity? What if you just want to rent a room for a few hours, or a few thousand rooms all over the world simultaneously?

That is when you stop building real estate, and you start checking into the Cloud.

