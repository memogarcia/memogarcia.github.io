---
title: "Understanding Computer Networks by Analogy: Part 2 - Cities as the Internet"
date: 2025-10-18T22:39:16+09:00
draft: false
---

> Think of the internet as a city full of buildings and streets.  
> Routers are concierges, gateways are elevators, packets are envelopes, and DNS is the city directory that keeps everyone from getting lost.

License for this chapter: CC BY-NC-ND 4.0

---

## What This Chapter Covers

In Part 1, we stayed inside a single building: your local network (LAN).  
In this chapter, we step outside into the city and follow one envelope on its journey across the internet.

By the end of this chapter, you should be able to:

- Explain what a **default gateway** is and when your device uses it.
- Describe what **routers** do and how they use **routing tables** and **routing protocols**.
- Understand **packets**, **ports**, **sockets**, and **encapsulation**.
- Compare **TCP** and **UDP** and know when each is appropriate.
- Explain what **DNS** does and why it matters for everyday networking.

---

## Chapter 2: Cities as the Internet

In Part 1, we explored your building: rooms (devices), doors (interfaces), hallways (links), and floors (subnets).

But your friend doesn’t live in your building. They live across town, in a different building entirely. To reach them, your envelope has to leave your floor, exit your building, and navigate the city’s streets.

In this city:

- Each **building** is a separate network.
- **Streets and intersections** are the links between networks.
- **Concierges** at each lobby are **routers**, deciding where to send your envelope next.
- A **city directory** (DNS) helps turn names into precise addresses.

We’ll follow your envelope step by step, from your room to your friend’s room across the city.

---

## 2.1 The Elevator to Other Floors: Your Gateway

Imagine you’re standing in the hallway on the 10th floor, holding a letter for your friend.  
You know she lives on the 25th floor of a building across town.

You can walk up and down your hallway all day and never reach her.  
To leave your floor, you need the elevator.

In networking terms, that elevator is your **default gateway**.

Every time your device sends a message, it quietly answers one question:

> “Is this destination on my floor, or somewhere else?”

- If the destination is on your **floor** (same subnet), your device can deliver the message directly by “walking down the hallway.”
- If the destination is on **another floor or building** (another subnet), it hands the envelope to the elevator: the **default gateway**.

The elevator doesn’t open your envelope or care about the contents.  
It just reads the outside, knows the destination is not on your floor, and takes the envelope to the **lobby**, where the concierge (router) can decide the next step.

> **Checklist:**  
> Same floor → walk the hallway directly.  
> Different floor / building → take the elevator (send to the default gateway).

### In networking terms

- The **default gateway** is usually the IP address of a router on your local network.
- Your device compares the **destination IP** with its own **IP + subnet mask**:
  - If they share the same network prefix → destination is local.
  - If not → destination is remote → send to the default gateway.
- Before it can send frames to the gateway, your device needs the gateway’s **MAC address**, so it uses **ARP** to find it.

### Technical Deep Dive

- **Default Gateway**  
  The IP address of the router on your subnet that handles traffic that is not local. Your device learns this address via manual configuration or automatically (e.g. via DHCP).

- **The Decision Process**  
  1. Take your own IP and subnet mask.  
  2. Take the destination IP and apply the same subnet mask.  
  3. If the resulting network addresses match → send directly on the LAN.  
  4. If they differ → send to the default gateway.

- **ARP (Address Resolution Protocol)**  
  IP uses logical addresses (room numbers). Ethernet uses MAC addresses (door IDs).  
  ARP is the “Who lives in this room?” shout down the hallway:
  - Your device broadcasts: “Who has IP `192.168.1.1`?”  
  - The gateway replies: “That’s me, my MAC is `AA:BB:CC:11:22:33`.”  
  - Your device caches this mapping for a short time.

#### ASCII Diagram – The Decision to Leave the Subnet

```text
+----------------------------------------------------+
| Your Laptop (192.168.1.101)                        |
|                                                    |
|  Destination: 8.8.8.8 (Google's DNS Server)        |
|  My Subnet Mask: 255.255.255.0                     |
|                                                    |
|  Logical Check:                                    |
|    Is (8.8.8.8 AND 255.255.255.0) == 192.168.1.0 ? |
|    Result: No.                                     |
|                                                    |
|  Conclusion: Destination is on a different network.|
|              Send the packet to the gateway.       |
|                                                    |
|  Next Step:                                        |
|    Who is my gateway? It's 192.168.1.1.            |
|    What is its MAC address? (Send ARP request)     |
|    Send packet to gateway's MAC address.           |
|                                                    |
+----------------------------------------------------+
```

---

## 2.2 The Concierge with the Map: The Router

You step out of the elevator into the lobby.  
Behind the desk stands a calm concierge with a binder full of maps and directions.

The concierge is your **router**.

The concierge does not personally carry your envelope all the way across town.  
Instead, they do one simple and powerful thing:

> Look at the destination address and decide the **next best place** to send the envelope.

That binder of maps is the router’s **routing table**.

A router does not need to know every possible path to every building in the city.  
It only needs to know:

- Which exits lead to which areas.
- Which neighbor concierges to send certain types of mail to.
- Where to send mail if it doesn’t recognize the destination (the **default route**).

Examples from the concierge’s binder:

- “For floors 10–20 in this building → use the north elevator bank.”
- “For the building across the street (Building 101) → use the east-wing exit.”
- “For anything I don’t recognize → send it to the central post office downtown.” (default route)

This **hop-by-hop** approach scales to the entire internet:

- Each router makes a **local** decision based on its routing table.
- A series of good local decisions creates a working end-to-end path.

Routers keep their maps up to date in two main ways:

- **Static routes** – manually configured entries.
- **Dynamic routing protocols** – routers exchange information with one another automatically.

> **Mini case:** The router is the network’s concierge, and its routing table is its map.  
> It doesn’t know the whole journey, just the smartest next hop.

### Technical Deep Dive

- **Routing Table**  
  A router’s internal table of “how to reach which networks.”  
  Typical fields:
  - Destination network + subnet mask.
  - Next hop (the IP of the next router).
  - Outgoing interface (which port to use).
  - Metric (cost) to compare multiple possible routes.

- **Static Routes**  
  Manually configured entries:
  - Simple, predictable, and don’t change automatically.
  - Good for small, stable networks.
  - Don’t adapt to failures or new paths without manual updates.

- **Dynamic Routing Protocols**
  Routers can talk to each other to keep routes up to date.

  - **Interior Gateway Protocols (IGPs)** – used **within** one organization or autonomous system.  
    Examples: **OSPF**, **EIGRP**, IS-IS.  
    Their job is to find efficient paths inside one network.

  - **Exterior Gateway Protocol (EGP)** – used **between** organizations on the internet.  
    Today, the internet effectively uses a single EGP: **BGP** (Border Gateway Protocol).  
    BGP is less about fastest path and more about **policy**:
    - Which routes are allowed?
    - Which routes are preferred?
    - Which paths reflect business relationships and agreements?

- **Time To Live (TTL)**  
  What if a route is misconfigured and your envelope gets stuck bouncing between two concierges forever?

  To prevent this, every IP packet has a **TTL** (Time To Live):

  - Starts as a number like 64 or 128.
  - Each router that forwards the packet subtracts 1.
  - If TTL reaches 0, the router drops the packet and sends an ICMP “Time Exceeded” message back.

  The `traceroute` command uses this mechanism to map the path packets take.

#### Example Routing Table (Simplified)

```text
Destination         Next Hop      Interface    Metric
----------------------------------------------------
192.168.1.0/24      (Connected)   eth0         0
10.0.0.0/8          192.168.1.1   eth0        10
172.16.0.0/12       10.5.1.1      eth2        25
0.0.0.0/0 (Default) 203.0.113.1   eth1       100
```

Interpretation:

1. To reach the **local floor** (`192.168.1.0/24`) → send directly out `eth0`.
2. To reach the **corporate campus** (`10.0.0.0/8`) → send to `192.168.1.1`.
3. To reach a **partner network** (`172.16.0.0/12`) → send to `10.5.1.1` via `eth2`.
4. For **anywhere else on the internet** → use the default route via `203.0.113.1`.

---

## 2.3 Envelopes and Mail Slots: Packets and Ports

So far, we’ve focused on **paths** and **guides**.  
Now let’s look more closely at the thing being carried: the envelope itself.

An envelope is clever:

- The outside has the **addresses** and postal markings.
- The inside has the **message** itself.

In networking, a **packet** is your envelope:

- The outside is the **header** (addressing + control information).
- The inside is the **payload** (your actual data).

But there is another important detail: the **mail slot**.

Think about a large office building.  
One street address might contain:

- Finance on floor 3.
- Legal on floor 4.
- Marketing on floor 5.

You don’t want a legal summons delivered to the cafeteria.  
The building needs a way to deliver envelopes to the **right department**.

In networking, those mail slots are **port numbers**.

A single computer can run many services at once:

- Web server
- Email server
- SSH server
- Databases
- APIs

Port numbers let the operating system act like a **mailroom clerk**:

- “Anything for slot **443** → deliver to the secure web server (HTTPS).”
- “Slot **22** → deliver to the SSH service.”
- “Slot **3306** → deliver to the MySQL database.”

When your device sends a message, it also chooses a temporary **return slot** for itself: an **ephemeral port**. This is like using a temporary mailbox ID in the return address so that replies get back to the exact application that started the conversation.

> **Key ideas:**  
> Packets are envelopes.  
> Port numbers are labeled mail slots.  
> Sockets (IP + port) are the full combination of address + slot.

### Technical Deep Dive

- **Packet**  
  The basic unit of data that routers forward.  
  Includes:
  - One or more headers (Ethernet, IP, TCP/UDP).
  - The payload (your application data).

- **Port Numbers** (16-bit, 0–65535)
  - **Well-known ports (0–1023)**  
    Reserved for standard services; require admin privileges.  
    Examples: FTP (21), SSH (22), DNS (53), HTTP (80), HTTPS (443).
  - **Registered ports (1024–49151)**  
    Used by applications that want predictable port assignments.  
    Examples: MySQL (3306), PostgreSQL (5432).
  - **Dynamic / private / ephemeral ports (49152–65535)**  
    Used temporarily by clients for outbound connections.

- **Socket**  
  A specific endpoint: `IP:Port`, e.g. `198.51.100.10:443`.  
  This combination identifies one side of a connection.

- **Encapsulation**  
  As your data goes down the stack:
  - The application data is wrapped in **TCP or UDP**.
  - That is wrapped in an **IP** header.
  - That is wrapped in an **Ethernet** header.

  Each layer adds its own envelope around your letter.

#### Packet Header Analogy (Encapsulation)

```text
+--------------------------------------------------------------------+
| Outermost Envelope: Ethernet Frame (local hallway)                 |
|  TO: Concierge's Door (MAC)  FROM: Your Door (MAC)                 |
|                                                                    |
|  +----------------------------------------------------------------+|
|  | Second Envelope: IP Packet (city-wide journey)                 ||
|  |  TO: Friend's Building (IP)  FROM: Your Building (IP)          ||
|  |                                                                ||
|  |  +------------------------------------------------------------+||
|  |  | Third Envelope: TCP Segment (specific mail slot)           |||
|  |  |   TO: Friend's Mail Slot (Port)                            |||
|  |  |   FROM: Your Mail Slot (Port)                              |||
|  |  |                                                            |||
|  |  |   +----------------------------------------------------+   |||
|  |  |   |                Your Actual Letter                  |   |||
|  |  |   |                    (Payload)                       |   |||
|  |  |   +----------------------------------------------------+   |||
|  |  |                                                            |||
|  |  +------------------------------------------------------------+||
|  |                                                                ||
|  +----------------------------------------------------------------+|
|                                                                    |
+--------------------------------------------------------------------+
```

---

## 2.4 Registered Mail vs Postcards: TCP and UDP

Even if your envelope reaches the right building, room, and mail slot, the **style of conversation** matters.

Protocols define the rules of the conversation:

- How we start and end it.
- How we confirm delivery.
- How we handle loss and reordering.

For most applications on the internet, the two main protocols at this layer are **TCP** and **UDP**.

### TCP – Registered Mail with Tracking

TCP (Transmission Control Protocol) is like **registered mail** with tracking and delivery confirmation:

- Before any data is exchanged, both sides perform a **three-way handshake**:
  1. **SYN** – “I’d like to start a formal conversation. Are you ready?”
  2. **SYN-ACK** – “I received your request and I’m ready.”
  3. **ACK** – “Great, I got your acknowledgment. Let’s begin.”

- Once the connection is established:
  - Each packet is numbered.
  - The receiver sends **acknowledgments** for what it has received.
  - Missing packets are detected and re-sent.
  - TCP adjusts its sending rate to avoid overwhelming the network (congestion control).

TCP is ideal when:

- Every byte matters.
- Order matters.
- A bit of extra delay is acceptable.

Common use cases:

- Web browsing over HTTP/HTTPS.
- File downloads and uploads.
- Email protocols.

### UDP – Fast, No-Frills Postcard

UDP (User Datagram Protocol) is like dropping a **postcard** in the mailbox:

- No handshake.
- No automatic retransmission.
- No guarantee of order.

Why use it?

- Very low overhead.
- No waiting for acknowledgments.
- Ideal when **freshness** is more important than **perfection**.

Use cases:

- Live audio and video.
- Online gaming.
- DNS queries.
- VoIP.

If a UDP packet is lost, the application decides whether to ignore it or request a retry.

> **Core concepts:**  
> TCP – careful, reliable, and ordered (registered mail).  
> UDP – simple, fast, and best-effort (postcard).

### Technical Deep Dive

- **TCP**
  - Connection-oriented (three-way handshake).
  - Reliable and ordered delivery (sequence numbers + acknowledgments).
  - Flow control (sliding window) so senders don’t overwhelm receivers.
  - Congestion control (algorithms like CUBIC, BBR) to react to network conditions.

- **UDP**
  - Connectionless (no handshake).
  - No reliability guarantees; packets may be lost or reordered.
  - Very small header; more of the packet is real data.
  - Often used as a base layer for higher-level protocols that add their own reliability.

- **QUIC (on top of UDP)**
  - A modern transport protocol that:
    - Runs over UDP.
    - Implements its own reliability and congestion control.
    - Encrypts data by default.
  - Forms the basis of **HTTP/3**, the latest generation of web transport.

#### Comparison Table – TCP vs UDP

```markdown
| Feature       | TCP (Registered Mail)                 | UDP (Postcard)                     |
|--------------|----------------------------------------|------------------------------------|
| Connection   | Connection-oriented (handshake)        | Connectionless                     |
| Reliability  | High (guaranteed delivery & order)     | Low (no guarantees)                |
| Ordering     | In-order delivery                      | No guaranteed order                |
| Speed        | Slower (more overhead, more checks)    | Faster (less overhead)             |
| Header Size  | 20 bytes or more                       | 8 bytes                            |
| Typical Use  | Web, email, file transfer              | Streaming, gaming, DNS, VoIP       |
```

---

## 2.5 The City Directory: DNS

You have your envelope, you know how to reach the streets, and you know routers will guide it.  
But there is a problem:

Your letter is addressed to **“My Friend, Akihabara”**, not:

> Tokyo, Chiyoda City, Kanda-Hanaokacho 1-1

You have a **name**, but the city needs a **precise address**.

Enter the **city directory**: the Domain Name System (DNS).

DNS is the internet’s **address book**. It does one main job, millions of times per second:

> Translate human-friendly names (like `google.com`) into machine-friendly IP addresses (like `142.250.196.78`).

The process looks like this:

1. Your device wants to reach `friends-apartment.tokyo`.
2. It asks a DNS server: “What is the IP address for `friends-apartment.tokyo`?”
3. The DNS server looks it up (or asks other DNS servers).
4. It replies with the IP address.
5. With that IP address, your router now knows which **building** to start sending the envelope toward.

To avoid asking the directory every time:

- The first time you look up an address, you remember it.
- Your computer does the same: it stores recent DNS results in a **cache**, speeding up future requests.

> **Key idea:** DNS turns names into addresses so that routers can do their job.

### Technical Deep Dive

- **DNS (Domain Name System)**
  - A hierarchical, distributed naming system.
  - Maps names (domains) to records (A, AAAA, CNAME, etc.).

- **DNS Query**
  - A client sending a request like “What is the IP for `example.com`?”
  - The DNS server responds with records that answer the question.

- **DNS Cache**
  - Stored locally by your OS, browser, or recursive DNS resolver.
  - Each record has a **TTL** (time to live) after which it must be refreshed.

- **Recursive DNS Server**
  - Does the work on your behalf:
    - If it doesn’t know the answer, it queries other DNS servers.
    - It walks the hierarchy (root → TLD → authoritative) until it finds the authoritative answer.

- **Authoritative DNS Server**
  - Holds the official records for a domain.
  - Answers questions like:
    - “What is the IPv4 address for `www.example.com`?”
    - “Which mail server handles email for this domain?”

---

## Recap and Small Exercises

### What You Should Now Be Able to Explain

By the end of this chapter, you should be comfortable describing:

- The **default gateway** as the elevator out of your floor.
- Routers as **concierges** that know the next hop but not the entire path.
- **Packets** as envelopes and **ports** as labeled mail slots.
- The difference between **TCP** and **UDP** and when each is appropriate.
- **DNS** as the city directory that converts names into IP addresses.

### Exercises

1. **Find Your Default Gateway**  
   - On your computer, find:
     - Your IP address.
     - Your subnet mask.
     - Your default gateway.
   - Check whether a destination (e.g. `8.8.8.8`) is on your subnet or not.

2. **Run a Traceroute**  
   - Run `traceroute` (or `tracert` on Windows) to a website you use often.
   - Count how many “concierges” (routers) your packets go through.
   - Notice where the latency (round-trip time) increases.

3. **List Open Connections**  
   - Use a command like `netstat` or `ss` to view active connections.
   - For a browser tab, identify:
     - Local IP and port (your side).
     - Remote IP and port (server side).
   - Interpret them as sockets (`IP:Port`) and map them to services (e.g. port 443 → HTTPS).

4. **Inspect DNS Resolution**  
   - Use tools like `nslookup`, `dig`, or your browser’s developer tools to see DNS lookups.
   - Look up a hostname and examine:
     - The IP address returned.
     - The TTL.
   - Try again later and see whether the request is served from cache or re-resolved.

---

In the next part, we’ll move from city streets to **hotels as the cloud**.  
You’ll see how cloud providers carve up giant buildings into virtual floors and rooms (VPCs, subnets, endpoints) that you can rent and connect to the rest of the city.
