---
title: "Understanding Computer Networks by Analogy: Part 2 - Cities as the Internet"
date: 2025-10-18T22:39:16+09:00
draft: false
---

> Think of the internet as a city full of buildings and streets. Routers are concierges, gateways are elevators, packets are envelopes, and DNS is the city directory that keeps everyone from getting lost.

License: CC BY-NC-ND 4.0

---

# Part Two: Cities as the Internet

## Chapter 5: Leaving the Building

You've been living in your building for a while now. You know your floor. You've sent plenty of messages to your neighbors. But today, you need to reach someone who doesn't live here.

Your friend lives across town, in a completely different building. Same city, but a thirty-minute walk away. To reach her, your envelope has to leave your floor, exit your building, and navigate the city's streets.

When you walk out of your building's front door, you step into something much larger than your private hallways. The city has thousands of buildings. Tens of thousands of streets. Millions of addresses. And somehow, envelopes find their way from any building to any other building, every day, without anyone planning the entire route in advance.

This city is the internet. The streets are the connections between networks. The intersections are routers. And the system that makes it all work is remarkable in its simplicity: nobody knows the whole map, but everyone knows enough.

---

## Chapter 6: The Concierge with the Map

Walk out of the elevator into your building's lobby. Behind the front desk sits a calm figure with a thick binder. This is the concierge.

The concierge has one job: take envelopes from residents and figure out where to send them next. Not all the way to the destination. Just the next step.

The binder contains a routing table. It's not a complete map of the city. That would be impossible to maintain. Instead, it contains rules like:

"For buildings on Oak Street, hand the envelope to the courier at the east exit."

"For anything in the downtown district, use the main post office drop."

"For anything I don't recognize, send it to the central hub and let them figure it out."

Each rule specifies a destination (or range of destinations) and a next hop. The next hop is another router, another concierge at another location, who will continue the journey.

This hop-by-hop approach is how the entire internet works. No single router knows the complete path from your laptop to a server in Tokyo. Each router only knows its immediate neighbors and which neighbors are good choices for various destinations. A packet crosses the internet by passing through a sequence of routers, each one making a local decision about where to forward it next.

### Static and Dynamic Routes

The concierge's binder gets its entries in two ways.

Some entries are written in by hand. These are static routes. They're simple and predictable. If the building management knows that deliveries to the warehouse should always go through the loading dock, they write that rule in the binder and leave it there. Static routes work well when the network is small and stable.

Other entries arrive through conversation. Concierges in neighboring buildings talk to each other. "Hey, I can reach the financial district. If you have anything going there, send it my way." This information sharing uses routing protocols. The concierges exchange updates, and the binder fills itself in automatically.

Inside a single organization, these conversations use interior gateway protocols like OSPF or IS-IS. They're designed to find efficient paths within a network you control.

Between organizations, on the open internet, a different protocol dominates: BGP, the Border Gateway Protocol. BGP is less about finding the fastest path and more about honoring agreements. Which networks are willing to carry your traffic? Which paths are allowed by business relationships? BGP is the diplomatic protocol of the internet, negotiating routes between autonomous systems that may be competitors, partners, or strangers.

### When Packets Get Lost

What if a concierge makes a mistake? What if a routing table has a loop, and your envelope keeps bouncing between two buildings forever?

To prevent this, every envelope carries a counter called Time To Live. When the envelope leaves your building, the counter might be set to 64. Each concierge who handles it subtracts one. When the counter hits zero, the concierge throws the envelope away and sends a note back to the sender: "Your delivery couldn't be completed."

This TTL mechanism prevents routing mistakes from clogging the network indefinitely. It also makes troubleshooting possible. The traceroute command works by sending packets with increasing TTL values and watching who sends the "time exceeded" notices back. That reveals each hop along the path.

### A Technical Sidebar: Routing Tables and Protocols

A routing table entry typically includes four things: the destination network (like 10.0.0.0/8), the next hop address, the interface to use, and a metric indicating how "good" this route is. When multiple routes exist to the same destination, the router picks the one with the best metric.

OSPF (Open Shortest Path First) is a link-state protocol. Each router maintains a complete map of the network and calculates the shortest path using Dijkstra's algorithm. It converges quickly and scales to large networks.

BGP operates differently. It's a path-vector protocol. Routers exchange information about entire paths to destinations, not just costs. A BGP route might say "to reach this network, the path goes through AS1, then AS2, then AS3." This allows for policy-based decisions. Maybe you prefer routes that avoid certain countries, or prioritize routes through your business partners.

---

## Chapter 7: Envelopes, Mail Slots, and Conversations

Let's look more closely at the envelope itself.

An envelope has an outside and an inside. The outside has addresses: where it came from, where it's going, maybe some handling instructions. The inside has the actual message.

In networking, the outside is the header. The inside is the payload. A packet is an envelope.

But there's another layer of detail we haven't discussed yet. What if your building has a hundred different offices inside, each one expecting their own mail? A single street address isn't enough. You need apartment numbers, suite numbers, mail slots.

That's what port numbers provide.

A port number is a mail slot on the door. When a packet arrives at a device, the port number tells the operating system which application should receive it. Port 80 is conventionally used for web traffic. Port 443 is for encrypted web traffic. Port 22 is for SSH. Port 25 is for email. There are tens of thousands of possible ports, which means a single device can run many services at once, each listening on its own slot.

When you type a URL into your browser, you're specifying an address that looks like this: the building (server IP), the mail slot (port 443), and the specific document you want (the path). Your browser combines all of this into an envelope, addresses it properly, and sends it off.

### Sockets and Conversations

A socket is the combination of an IP address and a port. It uniquely identifies one end of a conversation. When your browser opens a connection to a web server, there are two sockets involved: your computer's IP and the temporary port your browser is using, plus the server's IP and port 443. This pair of sockets defines the connection.

The temporary port on your side is called an ephemeral port. It's assigned automatically from a high range, something like 49152 to 65535. When the conversation ends, that port is released and can be reused. Ephemeral ports exist so your computer can manage many simultaneous connections without confusion. Each browser tab, each download, each API call gets its own ephemeral port, and replies know exactly which conversation they belong to.

### Encapsulation

Here's where it gets layered.

Your message doesn't travel as a single envelope. It travels as an envelope inside an envelope inside an envelope.

At the application layer, your browser generates an HTTP request. That request becomes the payload of a TCP segment, which adds port numbers and sequence information. That TCP segment becomes the payload of an IP packet, which adds source and destination IP addresses. That IP packet becomes the payload of an Ethernet frame, which adds MAC addresses for the local hop.

Each layer wraps the previous one. It's like putting a letter in a small envelope, putting that envelope in a medium envelope, and putting that envelope in a large envelope. Each layer of envelope is read by a different part of the network. The Ethernet frame is read by switches on your local network. The IP packet is read by routers. The TCP segment is read by the operating system's network stack. The HTTP request is read by the web server application.

When your message arrives at its destination, the process reverses. The Ethernet frame is stripped off. The IP packet is unwrapped. The TCP segment is processed. Finally, the HTTP request reaches the application that was waiting for it.

### A Technical Sidebar: Headers and Protocols

An Ethernet frame header includes the source MAC, destination MAC, and a type field indicating what's inside (usually IPv4 or IPv6).

An IPv4 header includes version, header length, TTL, protocol (indicating TCP, UDP, ICMP, etc.), source IP, destination IP, and various flags and options. It's typically 20 bytes.

A TCP header includes source port, destination port, sequence number, acknowledgment number, flags (SYN, ACK, FIN, etc.), window size, and checksum. Also typically 20 bytes.

A UDP header is much simpler: source port, destination port, length, checksum. Just 8 bytes. The simplicity is the point.

---

## Chapter 8: Registered Mail and Postcards

The mail system in the city offers two kinds of service.

The first is registered mail. When you send a registered letter, you get a tracking number. You know when it was picked up. You know when it was delivered. If it gets lost, the post office will tell you. If the recipient moves, the letter will be returned. Registered mail is slower and costs more, but you have guarantees.

The second is a simple postcard. You write your message, drop it in a mailbox, and hope for the best. No tracking. No confirmation. No guarantee it arrived. But it's fast, cheap, and good enough for casual updates.

In networking, registered mail is TCP. Postcards are UDP.

### TCP: Reliable Delivery

TCP is the protocol that makes the web work. When your browser connects to a server, it first performs a handshake. Three messages go back and forth:

"I'd like to connect."

"I acknowledge your request and I'm ready."

"I acknowledge your acknowledgment. Let's begin."

This three-way handshake establishes a connection. From then on, every piece of data is numbered. The sender tracks what it has sent. The receiver sends acknowledgments for what it has received. If something goes missing, the sender notices and retransmits.

TCP also manages flow. If the receiver is being overwhelmed, it tells the sender to slow down. If the network is congested, TCP backs off to avoid making things worse. These mechanisms are invisible to applications, but they're the reason file downloads complete correctly and web pages load without gaps.

The cost of all this reliability is overhead. TCP connections take time to establish. Acknowledgments consume bandwidth. Retransmissions add latency. For applications where every byte must arrive in order, this cost is worth paying. For other applications, it's not.

### UDP: Fast and Simple

UDP doesn't bother with handshakes or acknowledgments. You send a datagram. It might arrive. It might not. It might arrive out of order. The protocol doesn't care. It just delivers what it can and moves on.

Why would anyone use such an unreliable protocol? Because for some applications, freshness matters more than completeness.

Consider a video call. If one frame of video gets lost, you don't want the call to freeze while TCP retransmits. You'd rather skip that frame and keep going. The conversation is happening now. An old frame is useless.

Consider a game. If a packet showing your opponent's position from 500 milliseconds ago arrives late, you don't want to use it. You want the current position. UDP lets the application decide what to do with old or missing data.

DNS queries typically use UDP. A lookup should be fast. If it fails, the application can retry. There's no need for the overhead of a TCP connection for a single question and answer.

### QUIC: A Modern Hybrid

More recently, a protocol called QUIC has emerged. QUIC runs on top of UDP but implements its own reliability, ordering, and encryption. It's designed to get the best of both worlds: the performance of UDP with the features of TCP, plus built-in security.

QUIC is the foundation of HTTP/3, the latest version of the web protocol. You're probably using it without knowing whenever you visit major websites.

---

## Chapter 9: The City Directory

You know your friend's name, but not her address. You know you want to visit "example.com" but not where that building actually is.

This is why the city has a directory.

The Domain Name System, DNS, is the internet's address book. Its job is to translate names that humans can remember into IP addresses that networks can route. When you type "google.com" into your browser, DNS is the service that tells you "the building you want is at 142.250.196.78."

The process is straightforward from the outside. Your browser asks "what's the IP for google.com?" A DNS server answers. Your browser connects.

Under the hood, it's more interesting.

DNS is not a single database. It's a distributed, hierarchical system. At the top are the root servers, a handful of well-known authorities that know about the top-level domains: .com, .org, .net, .uk, .jp, and hundreds of others. Below the root are the TLD servers, which know about all the domains registered under their suffix. And below those are the authoritative servers for individual domains, which hold the actual records.

When you look up a name for the first time, your query might travel through this entire hierarchy. Your local DNS resolver asks the root server "where can I find .com?" The root points to the .com TLD servers. The resolver asks the TLD server "where can I find google.com?" The TLD points to Google's authoritative servers. The resolver asks Google's server "what's the address for www.google.com?" Google's server answers. The resolver caches the answer and returns it to your browser.

All of this happens in milliseconds. And because the results are cached at every level, repeat queries are even faster.

### Why DNS Matters

DNS is fundamental infrastructure. If DNS stops working, the internet doesn't technically break, but it becomes unusable. You could still reach any server by IP address, but you'd have to memorize those addresses, and they change frequently.

DNS is also a common point of failure. If your DNS server is down or unreachable, every name lookup fails. If DNS is slow, every website feels slow. When troubleshooting connectivity problems, DNS is one of the first things to check.

### A Technical Sidebar: DNS Records

An A record maps a name to an IPv4 address. An AAAA record maps a name to an IPv6 address. A CNAME record creates an alias from one name to another. An MX record identifies the mail server for a domain. A TXT record can hold arbitrary text and is often used for domain verification.

DNS TTL (Time To Live) specifies how long a record should be cached before checking again. Short TTLs mean changes propagate quickly but generate more traffic. Long TTLs reduce load but make updates slow to spread.

---

You now understand the city. Buildings connect through routers. Packets travel hop by hop. TCP provides reliability. UDP provides speed. DNS translates names into addresses.

But what if you don't want to own a building? What if you need capacity you can spin up and down, presence in multiple cities, infrastructure managed by someone else?

That's when you check into the hotel.
