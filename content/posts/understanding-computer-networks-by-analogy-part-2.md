---
title: "Understanding Computer Networks by Analogy: Part 2 - Cities as the Internet"
date: 2025-10-18T22:39:16+09:00
draft: false
---

> Think of the internet as a city full of buildings and streets. Routers are the desks that hand envelopes from one network to the next, and DNS is the directory that keeps names connected to addresses.

License: CC BY-NC-ND 4.0

---

# Part Two: Cities as the Internet

In Part One, the packet stayed inside one building. That was enough to explain local delivery, ARP, switches, and subnets.

Now the envelope has to leave the building.

The internet is not one network. It is a large collection of networks connected to each other. The building analogy still helps, but now we need streets, intersections, and a directory.

The key change is scope. Inside one floor, you care about MAC addresses and local delivery. Across the city, you care about IP addresses, routing decisions, and name resolution.

---

## Chapter 5: The Concierge with the Map

Imagine you leave your building with an envelope addressed to another building across town.

You do not need a full map of the city. You need to know where to hand the envelope next.

That is how routing works.

At the edge of your network is a router. In this analogy, think of it as a desk in the lobby that knows the next useful direction for each destination range.

The router does not usually know the entire path in one shot. It consults a routing table and chooses the next hop. That next hop may be another router, which repeats the same process.

### Reading the binder

A routing table is a set of rules:

- If the destination is in this network, send it out this interface.
- If the destination is in that network, send it to this next hop.
- If nothing more specific matches, use the default route.

That last rule matters. The default route is what keeps every host and router from needing a complete map of the world.

### Static and dynamic routes

Some routes are entered manually. Those are static routes.

Static routes are simple and predictable. They are also rigid. If the path changes underneath them, they do not adapt on their own.

Other routes are learned dynamically through routing protocols.

Inside one organization, a protocol such as OSPF helps routers share reachability information and react to link changes. Across the public internet, BGP helps organizations tell each other which networks they can reach and under what policy.

BGP is not "the shortest path" protocol in the way many people first imagine. It is closer to policy-driven path selection between administrative domains. Cost, business relationships, filtering, and export policy all shape the route.

### When packets loop

Routing mistakes happen. If two routers hand a packet back and forth, the packet cannot be allowed to circle forever.

That is why IP packets carry a **Time To Live (TTL)** field. Each router decrements it. When it reaches zero, the router discards the packet and typically sends back an ICMP "Time Exceeded" message.

That behavior is the reason `traceroute` works.

Different implementations use UDP, ICMP, or TCP probes, but the idea is the same: send packets with gradually increasing TTL values and observe which hop reports back. The result is a clue about the path, not a perfect map. Some routers do not reply. Some paths are asymmetric. Some middleboxes rate-limit or filter the responses.

### Where the analogy bends

Routers are not human concierges standing at geographic intersections. Networks are topological, not architectural. Two devices may be physically close and still be many routing decisions apart. Keep the analogy for the decision process, not for physical distance.

---

## Chapter 6: Mail Slots Inside the Room

An IP address gets traffic to the right host. It does not tell the host which application should receive the data.

That is where ports come in.

Within our building analogy, a port is a mail slot assigned to a particular service on the device.

One machine may have several services listening at the same time:

- Web traffic on port `80` or `443`
- SSH on port `22`
- A database on a port such as `5432` or `3306`

When a packet arrives, the operating system looks at the transport header and decides which listening service should receive it.

### Sockets and temporary return addresses

A socket is one endpoint of a conversation, identified by an IP address and a port.

If your browser connects to `203.0.113.20:443`, your own machine also needs a unique local endpoint for the return path. So the OS picks an ephemeral source port, perhaps something like `54321`.

Now the conversation has two endpoints:

- Local socket: `192.168.1.50:54321`
- Remote socket: `203.0.113.20:443`

That is how one laptop can hold many simultaneous connections without mixing the replies together.

### Encapsulation: envelope inside envelope

The data you care about travels inside several headers.

For a typical web request over TCP on Ethernet, the stack looks like this:

1. Your application creates data, such as an HTTP request.
2. TCP wraps it with source and destination ports.
3. IP wraps that with source and destination IP addresses.
4. Ethernet or Wi-Fi wraps that again for the local hop.

Each layer answers a different question:

- Port: which service?
- IP: which host?
- MAC: which local next hop?

### Where the analogy bends

Do not picture a packet literally sliding under a door and into a tiny physical mail slot. Ports are logical identifiers in the transport layer. The mail-slot analogy is useful because it teaches the correct distinction: host selection and service selection are different problems.

---

## Chapter 7: Registered Mail and Postcards

Once you know the destination host and the destination port, you still need to choose a style of delivery.

That is the transport protocol.

### TCP: registered mail

TCP is the careful option.

It starts with a handshake so both sides agree that the conversation exists. It numbers the data stream. It expects acknowledgments. If data is lost, it retransmits. It also manages flow control and congestion control so one side does not overwhelm the other or the network path.

This makes TCP a good fit for web pages, file transfers, APIs, and database traffic where missing or reordered data is a real problem.

### UDP: postcards

UDP is much lighter.

It does not create a long-lived reliable session in the same way. It sends datagrams with far less overhead and leaves reliability, ordering, and recovery to the application if those features are needed.

That makes UDP useful for cases where timeliness matters more than perfect replay of old data, such as voice, video, gaming, DNS queries, and protocols that build their own control logic on top.

### The real tradeoff

It is tempting to summarize this as "TCP is safe, UDP is fast." That is directionally useful, but too simple.

Real applications choose based on behavior:

- Do I need ordered delivery?
- Do I need retransmission?
- Is stale data worse than missing data?
- Will the application handle recovery itself?

If you keep those questions in view, the transport choice starts to make sense.

### Where the analogy bends

Postcards and registered mail are helpful pictures, but both TCP and UDP are just inputs to higher-level application behavior. Modern protocols such as QUIC run over UDP and then rebuild reliability and encryption in user space. So do not stop at "UDP means unreliable." Ask what the application does on top of it.

---

## Chapter 8: The City Directory

So far, all of our examples have assumed you already know the destination IP address.

In real life, you usually start with a name.

You type `github.com`, not `140.82.112.4`.

DNS is the directory service that maps names to records the network can use.

### The recursive lookup

Your machine usually asks a recursive resolver first. That resolver may be your router, your ISP, a public DNS provider, or your organization's internal DNS service.

If the resolver already has the answer cached, it replies immediately.

If not, it walks the hierarchy:

1. It asks a root server where to find the top-level domain.
2. It asks the TLD servers where to find the domain's authoritative servers.
3. It asks the authoritative servers for the record.

Then it returns the answer and caches it according to the record's TTL.

### Why DNS failures are confusing

When DNS breaks, users often report that "the internet is down." Sometimes that is true. Often it is not.

If name resolution fails, the network path to the destination may still be healthy. You simply do not have the address needed to begin the connection.

That is why one of the fastest diagnostic moves is to separate:

- Can I reach a known IP address?
- Can I resolve the hostname?

Those two tests tell different stories.

### TTL and migrations

TTL is the timer attached to a DNS answer that tells caches how long they may keep it.

If you plan to move a service to a new IP, lowering the TTL well before the cutover can reduce the time that old answers linger in caches. It does not guarantee instant convergence. Different clients, recursive resolvers, and applications cache differently. But it improves your chances.

### Where the analogy bends

Real DNS is not a single city phone book. It is a distributed system with caching at multiple layers: browser, OS, local resolver, recursive resolver, and authoritative servers. The directory analogy is useful because it tells you the function. It becomes misleading if you imagine one master database.

At this point, the packet can leave the local building, travel across the city, arrive at the correct building, and find the right mail slot.

The next question is different: what if you do not want to own the building at all?

That is where the cloud enters the story.
