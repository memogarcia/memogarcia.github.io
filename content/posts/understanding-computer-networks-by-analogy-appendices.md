---
title: "Understanding Computer Networks by Analogy: Appendices"
date: 2025-10-18T22:39:16+09:00
draft: false
series: "Understanding Computer Networks by Analogy"
---

> A quick-reference blueprint, glossary, and troubleshooting checklist for when you feel lost in the city.

License for this section: CC BY-NC-ND 4.0

---

## Appendix A – Blueprint: The Whole Journey at a Glance

Use this appendix when you want to see the **entire story** on one page.

### A.1 Layers by Analogy

```text
+----------------------+---------------------------+-------------------------------+
| Layer (TCP/IP)       | Analogy                   | Typical Examples              |
+----------------------+---------------------------+-------------------------------+
| Application          | People talking in rooms   | HTTP, DNS, SSH, SMTP, SQL     |
| Transport            | Conversation style        | TCP, UDP, QUIC                |
| Network              | City-wide addressing      | IP, ICMP, routing, BGP, OSPF  |
| Link (Data Link +    | Hallways and local rules  | Ethernet, Wi-Fi, VLANs, ARP   |
| some Physical)       | (per building/floor)      |                               |
+----------------------+---------------------------+-------------------------------+
```

### A.2 Buildings, Cities, and Hotels – Side-by-Side

```text
+-------------------+-------------------------------+--------------------------------+
| Concept           | Analogy                       | Network / Cloud Term           |
+-------------------+-------------------------------+--------------------------------+
| Room              | A single device               | Host, server, laptop, phone    |
| Door              | Network interface             | NIC, eth0, wlan0               |
| Door label        | Physical door ID              | MAC address                    |
| Room number       | Number on the door            | IP address                     |
| Floor             | Group of nearby rooms         | Subnet                         |
| Building          | One physical building         | LAN, on-prem network           |
| Elevator lobby    | Exit from the floor           | Default gateway / router       |
| Concierge         | Person routing mail           | Router                         |
| Street network    | Roads & intersections         | The Internet                   |
| City directory    | Phone/address book            | DNS                            |
| Hotel chain       | Global managed buildings      | Cloud provider                 |
| Private floor     | Your reserved hotel floor     | VPC                            |
| Public wing       | Rooms with street-facing      | Public subnet                  |
|                   | windows                        |                                |
| Private wing      | Back-office rooms             | Private subnet                 |
| Main entrance     | Lobby open to the street      | Internet Gateway (IGW)         |
| Staff-only exit   | Back door for employees       | NAT Gateway                    |
| Private service   | Internal hotel corridor to    | VPC Endpoint                   |
| door              | shared amenities              |                                |
| Badge / keycard   | Who you are + what you can do | IAM identities & policies      |
| Personal usher    | Helper outside each room      | Sidecar proxy in service mesh  |
+-------------------+-------------------------------+--------------------------------+
```

### A.3 End-to-End Journey: From Browser to Cloud and Back

This is the “full movie” of a typical HTTPS request from your laptop to a cloud-hosted web application.

1. **You type a URL in your browser**  
   - Application layer: your browser prepares an HTTP request.

2. **DNS lookup – finding the building**  
   - Browser / OS ask a DNS resolver: “What is the IP for `www.example.com`?”  
   - DNS replies with an IP address (the building address).

3. **Deciding whether to leave the floor**  
   - Your device checks: “Is this IP on my floor (subnet)?”  
   - If not, it sends the packet to the **default gateway** (elevator lobby).

4. **Leaving the building**  
   - The gateway/concierge (router) looks at the destination IP and chooses a **next hop**.  
   - Routers along the path repeat this step, forwarding the packet across the city until it reaches the cloud provider’s edge.

5. **Entering the cloud hotel**  
   - The provider’s edge routers route traffic towards the correct **region** and **VPC**.  
   - The **Internet Gateway** acts as the main entrance to your VPC floor.

6. **Finding the right room inside the VPC**  
   - The VPC’s routing tables decide which **subnet (wing)** the packet should go to.  
   - Within the subnet, ARP (or its cloud equivalent) resolves the MAC address of the target VM or load balancer.

7. **TLS handshake – setting up a secure tunnel**  
   - Your browser and the server run the TLS ceremony:
     - Exchange hellos and supported ciphers.
     - Server presents its certificate; browser verifies the chain.
     - Both sides perform a key exchange and agree on a shared secret.
   - After the handshake, application data (HTTP) is encrypted.

8. **Service-to-service calls (optional, inside the mesh)**  
   - The front-end service may call other internal services:
     - Each service talks to its **sidecar proxy (usher)**.
     - Proxies use **mutual TLS** and routing rules to reach other services.
     - Observability and policy are enforced at this layer.

9. **Response travels back**  
   - The server sends an encrypted HTTP response back through the same tunnel.  
   - Packets retrace the path in reverse: subnet → VPC router → Internet Gateway → city routers → your default gateway → your room.

10. **Your browser renders the result**  
    - Decrypts TLS.
    - Interprets the HTTP response.
    - Draws the page on your screen.

Use this sequence when you want to debug “where things might be going wrong.”

---

## Appendix B – Glossary (Analogy-Aware)

This glossary is written so you can jump between **analogy** and **technical term** quickly.

Each entry has:  
- **Analogy** – how it appeared in the story.  
- **Meaning** – what it is in networking terms.  
- **Why it matters** – where you see it in real systems.

### B.1 Core Networking

**Host**  
- Analogy: A room in the building.  
- Meaning: Any device with a network stack (server, laptop, phone, VM, container).  
- Why it matters: Hosts originate and receive traffic; all higher-level concepts eventually involve hosts.

**Network Interface (NIC)**  
- Analogy: The door of the room.  
- Meaning: A hardware or virtual interface that sends/receives frames (e.g. `eth0`, `wlan0`).  
- Why it matters: IP addresses are bound to interfaces; troubleshooting often starts here.

**MAC Address**  
- Analogy: The unique label on a specific door.  
- Meaning: A link-layer address (typically 48 bits) used on Ethernet/Wi-Fi to deliver frames on a local segment.  
- Why it matters: Switches and Wi-Fi access points use MAC addresses to decide where to send frames.

**IP Address**  
- Analogy: Floor + room number.  
- Meaning: A logical address (IPv4 or IPv6) used at the network layer to route packets across multiple networks.  
- Why it matters: Routers use IP addresses and prefixes to decide paths; most debugging starts with “which IP are we talking to?”

**Subnet**  
- Analogy: A floor in the building.  
- Meaning: A group of IP addresses that share a common prefix and can talk directly over one link-layer domain.  
- Why it matters: Subnets define broadcast domains, routing boundaries, and security zones.

**Default Gateway**  
- Analogy: Elevator lobby leading out of the floor.  
- Meaning: A router that handles traffic destined for IP addresses not on the local subnet.  
- Why it matters: If the default gateway is misconfigured or unreachable, everything “outside the floor” breaks.

**Router**  
- Analogy: Concierge in the lobby with a map.  
- Meaning: A device that forwards packets between networks based on routing tables.  
- Why it matters: The internet works because routers agree on routes and forward traffic accordingly.

**Routing Table**  
- Analogy: The concierge’s binder of directions.  
- Meaning: A set of rules that map destination prefixes to next hops and interfaces.  
- Why it matters: When paths fail, misconfigured routes are often the culprit.

**Static Route**  
- Analogy: A hand-written rule in the binder.  
- Meaning: A manually configured entry in the routing table that does not change automatically.  
- Why it matters: Simple and predictable in small networks; dangerous if left unmaintained in dynamic environments.

**Dynamic Routing Protocol (IGP/EGP)**  
- Analogy: Concierges calling each other to update maps.  
- Meaning: Protocols like OSPF, IS-IS, EIGRP (IGPs) and BGP (EGP) that share route information between routers.  
- Why it matters: They keep large networks and the internet usable without manual updates everywhere.

**DNS (Domain Name System)**  
- Analogy: City directory or phone book.  
- Meaning: A distributed database that maps names (like `example.com`) to records (IP addresses, mail servers, etc.).  
- Why it matters: Users think in names, not IPs; almost every internet interaction involves DNS.

### B.2 Performance and Reliability

**Bandwidth**  
- Analogy: Width of the hallway.  
- Meaning: The theoretical maximum rate at which data can be transferred over a link (e.g. 100 Mbps, 1 Gbps).  
- Why it matters: Sets the upper bound on throughput; relevant when links are saturated.

**Throughput**  
- Analogy: How many people actually pass through the hallway per second.  
- Meaning: The actual observed rate of successful data delivery over a link.  
- Why it matters: Reflects real capacity after overhead, protocol behaviour, and congestion.

**Latency**  
- Analogy: Travel time from one door to another.  
- Meaning: The time it takes for a small piece of data to travel from source to destination.  
- Why it matters: Critical for interactive applications, trading systems, and user experience.

**Jitter**  
- Analogy: How much travel times vary from minute to minute.  
- Meaning: Variation in latency between packets.  
- Why it matters: High jitter is painful for voice/video and real-time gaming.

**TTL (Time To Live)**  
- Analogy: Maximum number of buildings an envelope may pass before being discarded.  
- Meaning: A counter in the IP header that decreases at each router; when it reaches zero the packet is dropped.  
- Why it matters: Prevents routing loops from clogging the network; used by tools like `traceroute`.

### B.3 Transport and Security

**TCP (Transmission Control Protocol)**  
- Analogy: Registered mail with tracking and acknowledgments.  
- Meaning: A reliable, connection-oriented transport protocol providing ordered, loss-free delivery.  
- Why it matters: Backbone of web browsing, email, and many other protocols where data integrity is essential.

**UDP (User Datagram Protocol)**  
- Analogy: Simple postcard in the mail.  
- Meaning: A connectionless transport protocol with minimal overhead and no built-in reliability.  
- Why it matters: Ideal when freshness and low latency matter more than perfect delivery (streaming, gaming, DNS).

**QUIC**  
- Analogy: A new, efficient courier service running on top of the regular post.  
- Meaning: A modern transport protocol built over UDP with built-in encryption, multiplexing, and congestion control; foundation for HTTP/3.  
- Why it matters: Reduces connection setup time and improves performance on lossy networks.

**TLS (Transport Layer Security)**  
- Analogy: Diplomatic ceremony plus sealed envelope.  
- Meaning: Cryptographic protocol that provides confidentiality, integrity, and authentication between two endpoints.  
- Why it matters: Protects almost all secure web and API traffic.

**Mutual TLS (mTLS)**  
- Analogy: Both sides show ID badges, not just the building.  
- Meaning: A variant of TLS where both client and server present and verify certificates.  
- Why it matters: Foundation for zero-trust internal networking and service meshes.

### B.4 Cloud and Mesh

**VPC (Virtual Private Cloud)**  
- Analogy: Your private floor in the cloud hotel.  
- Meaning: A logically isolated virtual network within a cloud region.  
- Why it matters: Provides network-level separation, custom IP addressing, and control over routing/gateways.

**Internet Gateway (IGW)**  
- Analogy: Public lobby entrance to your floor.  
- Meaning: A managed gateway that connects a VPC to the public internet.  
- Why it matters: Necessary for publicly accessible services and outbound internet traffic from public subnets.

**NAT Gateway**  
- Analogy: Staff-only back door.  
- Meaning: A managed gateway that allows instances in private subnets to initiate outbound internet connections while remaining unreachable from the internet.  
- Why it matters: Lets private resources get updates or call external APIs without being exposed.

**VPC Endpoint**  
- Analogy: Private service door to hotel amenities.  
- Meaning: A private connection from a VPC to specific cloud services (storage, queues, etc.) without traversing the public internet.  
- Why it matters: Improves security, reduces exposure, and can lower data-transfer costs.

**IAM (Identity and Access Management)**  
- Analogy: Badge and keycard system.  
- Meaning: The service that defines who or what may access which resources and under which conditions.  
- Why it matters: Central to least-privilege access and security at scale.

**Service Mesh**  
- Analogy: Network of personal ushers in the hallways.  
- Meaning: A dedicated infrastructure layer (sidecar proxies + control plane) that handles service-to-service communication, security, and observability.  
- Why it matters: Simplifies application code and centralises cross-cutting network concerns.

---

## Appendix C – Troubleshooting Checklist

Use this checklist when “the network” feels broken. The idea is to move from **room** to **city** to **cloud hotel** in a structured way.

### C.1 Inside the Room

1. **Is the device actually up?**
   - Does the operating system see the network interface?
   - Is Wi-Fi enabled or is the cable properly plugged in?

2. **Does the device have an IP address?**
   - Check:
     - Interface status (up/down).
     - IP address and subnet mask.
     - Default gateway.

3. **Can you reach your own door and floor?**
   - Ping your own IP (loopback or interface).
   - Ping another host on the same subnet.

If you can’t reach neighbours on the same floor, focus on:

- Local firewall rules.
- Switch/Wi-Fi configuration.
- VLAN assignment for that port or SSID.

### C.2 Leaving the Building

4. **Can you reach the default gateway (elevator lobby)?**
   - Ping the gateway’s IP.
   - If ARP fails or pings time out, investigate:
     - Cabling/switch ports.
     - VLAN configuration.
     - Gateway health.

5. **Can the gateway reach the outside world?**
   - From the gateway (or a device just behind it), try:
     - Pinging an external IP (e.g. a known public DNS server).
     - Traceroute to see where the path breaks.

If you lose packets immediately after the gateway, look at:

- Upstream router configuration.
- Routing tables and static routes.
- Firewall rules at the perimeter.

### C.3 Name Resolution and Certificates

6. **Does DNS work?**
   - Try resolving a hostname with `dig`, `nslookup`, or browser tools.
   - Compare:
     - “Can I reach the IP directly?” vs “Can I reach the name?”

If IP works but name doesn’t:

- Check:
  - Which DNS servers your device is using.
  - DNS firewall or filtering policies.
  - Misconfigured search domains.

7. **Is TLS failing?**
   - Symptoms:
     - Browser warnings about insecure certificates.
     - Client libraries complaining about handshake errors.
   - Check:
     - Certificate validity period.
     - Certificate names (subject / SAN) vs hostnames.
     - Trust chain and root CAs.

### C.4 Inside the Cloud Hotel

8. **Are routes and gateways correct in the VPC?**
   - Look at:
     - VPC CIDR ranges.
     - Subnet route tables (public vs private).
     - Internet Gateway / NAT Gateway attachment.

9. **Are Security Groups and Network ACLs blocking traffic?**
   - Confirm:
     - Inbound rules for the relevant ports and protocols.
     - Outbound rules (sometimes overlooked).
   - Use:
     - VPC flow logs or equivalent diagnostics, if available.

10. **Are VPC Endpoints configured as expected?**
    - For traffic to cloud services:
      - Check endpoint policies.
      - Ensure correct route table entries send traffic to the endpoint.

### C.5 Inside the Mesh

11. **Is the service mesh intercepting traffic?**
    - Confirm:
      - Sidecar injection status for pods/instances.
      - mTLS policies (do they match both sides?).
      - Retry / timeout rules that might cause unexpected behaviour.

12. **Check observability data from the mesh**
    - Look for:
      - Per-service error rates.
      - Latency spikes between specific pairs of services.
      - Circuit breakers opening.

Use this appendix as a **decision tree**, not a blunt checklist. Start at the level where the failure first appears and move one layer down or up as needed.

---