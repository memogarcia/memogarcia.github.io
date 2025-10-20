---
title: "Understanding Computer Networks by Analogy: Part 2 - Cities as the Internet"
date: 2025-10-18T22:39:16+09:00
draft: false
---

> License for this chapter: CC BY‑NC‑ND 4.0

# Chapter 2: Cities as the Internet

> In this chapter, we leave the familiar comfort of our own building and step out into the city. You’ll learn how our letter travels across different networks, meeting the indispensable characters that make the internet work: the efficient elevator operator (gateway), the all-knowing concierge (router), and the vigilant security guard (firewall). By the end, you’ll have a mental map of how a simple message can find its way from your room to anywhere in the world.


We’ve spent the first chapter getting to know our own building, our local network. We understand our room, the hallways, and the different floors. But our friend lives across town, in a completely different building. It’s time to leave our private sanctuary and venture out into the city. The city is the **internet**, a vast and sometimes chaotic collection of interconnected buildings.

Out here on the streets, maps are essential. Names must be translated into addresses. And at the entrance to every building, a security guard stands watch, enforcing a clear set of boundaries. In this chapter, our envelope will finally begin its real journey, crossing lobbies, riding elevators, and navigating the complex grid of the city streets.

## 2.1 The Elevator to Other Floors: Your Gateway

Imagine you’re standing in the hallway on the 10th floor, holding the letter for your friend. You know she lives on the 25th floor of a building across town. You can wander your own hallway all day, from one end to the other, but you will never reach her. To leave your floor, you need to use the elevator.

In the world of networks, that elevator is your **default gateway**.

Your device makes a simple but critical decision every single time it sends a message: can I reach this destination from my own hallway, or do I need to take the elevator? It makes this choice by looking at the destination address and comparing it to its own floor plan, a plan defined by its **subnet mask**. If the address is on the same floor (the same subnet), your device knows it can deliver the message directly by walking down the hall. But if the address belongs to a different floor or a different building entirely, it knows it must hand the envelope over to the elevator and trust the building’s systems to take the next step.

The elevator itself doesn’t read your letter. It doesn’t care about the contents of your message. Its job is purely logistical. It looks at the destination address on the outside of the envelope and knows its one and only job: to take you to the lobby, the central hub of the building, where the concierge can provide further directions. The gateway is the bridge between your private, local floor and the rest of the building, and by extension, the rest of the city.

> **Checklist:** Same floor, stroll the hallway. Different floor, take the elevator. The default gateway is your network’s designated exit door, the first step on any journey to another network.

### Technical Deep Dive

*   **Default Gateway:** This is the IP address of the router on your local network that serves as the exit point for all traffic destined for outside the local subnet. When you configure a device’s network settings (or when it gets them automatically), you are telling it the address of its elevator.
*   **The Decision Process:** When your computer wants to send a packet, it performs a logical operation. It takes the destination IP address and its own subnet mask and compares the result to its own network address. If they match, the destination is on the local subnet. If they don’t match, the destination is remote, and the packet must be sent to the default gateway.
*   **ARP (Address Resolution Protocol):** This is a crucial callback to our earlier chapters. Before your device can hand the packet to the elevator (the gateway router), it needs to know the elevator’s specific door number (its MAC address). To find this, it shouts down the hallway (sends an ARP broadcast) asking, “Who has the IP address `192.168.1.1`?” The gateway router responds, “I do! My MAC address is `AA:BB:CC:11:22:33`.” Your device then remembers this address for a short time, so it doesn’t have to ask again for the next packet.

**ASCII Diagram: The Decision to Leave the Subnet**

```
+----------------------------------------------------+
| Your Laptop (192.168.1.101)                        |
|                                                    |
|  Destination: 8.8.8.8 (Google's DNS Server)        |
|  My Subnet Mask: 255.255.255.0                     |
|                                                    |
|  Logical Check:                                    |
|    Is (8.8.8.8 AND 255.255.255.0) == 192.168.1.0?   |
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

## 2.2 The Concierge with the Map: The Router

Step out of the elevator, and you find yourself in the lobby of your building. Behind a desk stands the concierge. This person is calm, professional, and holds a binder full of maps and directories. The concierge is the brain of the building’s transit system. The concierge is a **router**.

The concierge doesn’t personally walk your envelope all the way to its final destination. That would be incredibly inefficient. Instead, they perform one simple, powerful function: they look at the destination address on your envelope and make a single decision about the *next best step* to get it closer to where it needs to go. That binder of maps is the router’s **routing table**.

A router, like a good concierge, doesn’t need to know the entire path to every single address in the world. That would be impossible to maintain. They just need to know the next **hop**. Their routing table contains entries that are like institutional knowledge:

*   “For any letters going to the 10th-20th floors, send them to the north elevator bank.”
*   “For letters going to the building across the street (Building 101), use the east-wing exit.”
*   “For any letters going to an address I don’t recognize, send them to the central post office downtown. They’ll know what to do.” This is the **default route**.

This hop-by-hop system is the fundamental principle that allows the entire internet to function and scale. Each router in the path makes one small, local, intelligent decision. The collection of all these individual decisions creates a path for your data that can span the globe. The power is in the simplicity: pick the next best step, and trust the next concierge to do the same.

How do these concierges keep their maps up to date? Sometimes, the building manager comes down and manually writes new directions in the binder. These are **static routes**, which are reliable, but inflexible. More often, the concierges from different buildings have a system for keeping each other informed. This is **dynamic routing**. Protocols like **OSPF** are like the concierges from all the buildings on a single corporate campus having a regular meeting to share notes on the fastest hallways and elevator maintenance schedules. **BGP**, the protocol of the internet itself, is like the council of concierges from all the different corporations in the city, agreeing on the major highways and transit arteries to use between districts.

> **Mini case:** The router is the network’s concierge, and its routing table is its map. It doesn’t know the whole journey; it just makes the smartest decision about the next hop.

### Technical Deep Dive

*   **Routing Table:** This is a data table stored in a router’s memory that lists all the networks it knows about and how to reach them. A typical entry includes:
    *   **Destination Network & Subnet Mask:** The address of the final network.
    *   **Next Hop:** The IP address of the very next router to send the packet to.
    *   **Interface:** The physical exit door (e.g., `GigabitEthernet0/1`) on the router to use to reach the next hop.
    *   **Metric:** A number representing the “cost” of the route. If a router knows two different paths to the same destination, it will choose the one with the lower cost.
*   **Routing Protocols:** These are the languages routers use to talk to each other.
    *   **Static Routing:** An administrator manually a single organization’s network (a single “autonomous system”). Their goal is to find the absolute fastest path. Examples: **OSPF (Open Shortest Path First)**, **EIGRP (Enhanced Interior Gateway Routing Protocol)**.
        *   **Exterior Gateway Protocol (EGP):** Used *between* different organizations on the internet. The internet’s one and only EGP is **BGP (Border Gateway Protocol)**. BGP is less concerned with speed and more concerned with policy. It’s about which routes are allowed, preferred, and paid for. It’s the protocol of internet business relationships.
*   **Time To Live (TTL):** What happens if a bad map causes a letter to get stuck in a loop, passed back and forth between two confused concierges forever? To prevent this, every IP packet has a TTL field, which is like a countdown timer. It starts at a number like 64 or 128. Every single router that handles the packet subtracts one from the TTL. If the TTL ever reaches zero, the router discards the packet and sends a notification (an ICMP “Time Exceeded” message) back to the sender. This is the clever mechanism that the `traceroute` command uses to map the path a packet takes across the internet.

**Example Routing Table (Simplified)**

This table shows what a concierge’s binder might look like.

| Destination       | Next Hop          | Interface | Metric/Cost |
|-------------------|-------------------|-----------|-------------|
| 192.168.1.0/24    | (Directly Connected)| eth0      | 0           |
| 10.0.0.0/8        | 192.168.1.1       | eth0      | 10          |
| 172.16.0.0/12     | 10.5.1.1          | eth2      | 25          |
| 0.0.0.0/0 (Default)| 203.0.113.1       | eth1      | 100         |

This table tells the router:
1.  To reach the local floor (`192.168.1.0/24`), just send it directly out the `eth0` door.
2.  To reach the corporate campus (`10.0.0.0/8`), send it to the main campus router at `192.168.1.1`.
3.  To reach the partner company’s network (`172.16.0.0/12`), use the special connection on `eth2`.
4.  For anywhere else on the internet, use the default route and send it to the ISP’s router at `203.0.113.1`.

## 2.3 Envelopes and Mail Slots: Packets and Ports

So far, we’ve focused on the paths and the guides. Now let’s look more closely at the thing we’re actually sending. An envelope is a brilliant piece of technology. It carries both the address and the message, neatly separated. The outside tells the postal service where it’s from and where it’s going. The inside contains the private message you want to communicate. In networking, a **packet** is our envelope. It has **headers** on the outside (the addressing and control information) and a **payload** on the inside (your actual data).

But there’s one more crucial detail on the outside of the envelope that we haven’t discussed: a specific mail slot. Think about an office building. A single street address might house a company with dozens of different departments. A package for the accounting department shouldn’t be left at the loading dock for the cafeteria. A legal summons shouldn’t be mixed in with the marketing department’s fan mail. To keep things organized, the building has specific mail slots for each department. In networking, these mail slots are **port numbers**.

A single computer (a single room) can run many different services at the same time. One service might be a web server, another an email server, and a third a remote login service for the building’s maintenance crew. Port numbers are what allow the computer’s operating system to act as the mailroom clerk, sorting the incoming packets and delivering them to the correct application. For example:

*   A packet addressed to **port 443** is a letter for the secure web server (HTTPS).
*   A packet addressed to **port 22** is a letter for the secure shell (SSH) service.
*   A packet addressed to **port 3306** is a query for the MySQL database server.

When you send a message, your device also picks a temporary return slot for itself. This is an **ephemeral port**. It’s like putting your specific apartment number *and* a temporary mailbox number on the return address. The recipient uses this ephemeral port number to send replies back to you, ensuring that their response gets delivered to the exact application on your computer that started the conversation, without getting it mixed up with other ongoing chats.

> **Key Ideas:** Packets are the envelopes of the internet, carrying your data. Port numbers are the labeled mail slots on every door, ensuring that the right service gets the right message.

### Technical Deep Dive

*   **Packet:** The fundamental unit of data that is routed between an origin and a destination on the internet. It consists of control information (headers for the Ethernet, IP, and TCP/UDP layers) and user data (the payload).
*   **Port Numbers:** A 16-bit number (from 0 to 65535) that is used to identify a specific process or service on a host.
    *   **Well-Known Ports (0-1023):** Reserved by IANA (the Internet Assigned Numbers Authority) for standard, system-level services. You need administrative privileges to run a service on these ports. Examples: FTP (21), SSH (22), DNS (53), HTTP (80), HTTPS (443).
    *   **Registered Ports (1024-49151):** Can be registered for specific applications to avoid conflicts. Examples: MySQL (3306), PostgreSQL (5432).
    *   **Dynamic/Private/Ephemeral Ports (49152-65535):** The range of ports that operating systems use for temporary, outbound connections.
*   **Socket:** The unique combination of an IP address and a port number (e.g., `198.51.100.10:443`) creates a specific endpoint for communication. This IP:Port pair is known as a **socket**.
*   **Encapsulation:** This is the process of wrapping data in headers. As your data travels down the network stack from your application to the physical wire, each layer adds its own header. Your web browser’s data is wrapped in a TCP header, which is then wrapped in an IP header, which is finally wrapped in an Ethernet header. This is like putting a letter into a departmental envelope, then into a building-to-building envelope, and finally into a local delivery courier’s pouch.

**Packet Header Analogy (Encapsulation)**

Imagine our letter being placed in a series of nested envelopes for its journey.

```
+--------------------------------------------------------------------+
| Outermost Envelope: Ethernet Frame (For the local hallway)         |
|  TO: Concierge's Door (MAC)  FROM: Your Door (MAC)                 |
|                                                                    |
|  +----------------------------------------------------------------+  |
|  | Second Envelope: IP Packet (For the city-wide journey)         |  |
|  |  TO: Friend's Building (IP)  FROM: Your Building (IP)          |  |
|  |                                                                |  |
|  |  +------------------------------------------------------------+  |  |
|  |  | Third Envelope: TCP Segment (For the specific mail slot)   |  |  |
|  |  |   TO: Friend's Mail Slot (Port) FROM: Your Mail Slot (Port)|  |  |
|  |  |                                                            |  |  |
|  |  |   +----------------------------------------------------+   |  |  |
|  |  |   |                Your Actual Letter                |   |  |  |
|  |  |   |                    (Payload)                     |   |  |  |
|  |  |   +----------------------------------------------------+   |  |  |
|  |  |                                                            |  |  |
|  |  +------------------------------------------------------------+  |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                    |
+--------------------------------------------------------------------+
```

## 2.4 Registered Mail vs. Postcards: TCP and UDP

You can find the right building, the right room, and the right mail slot, but the conversation can still fail if you don’t follow the same social customs. **Protocols** are the shared languages and rules of etiquette that make network conversations predictable and effective. For sending our envelopes, the two most common customs are sending by registered mail or just dropping a postcard in the box.

**TCP (Transmission Control Protocol)** is the equivalent of sending a package by registered mail with tracking and delivery confirmation. It is a formal, reliable, and somewhat heavyweight process, designed for conversations where accuracy is far more important than speed. Before you send your actual message, you and your friend perform a ritual known as the **three-way handshake** to formally establish a connection:

1.  **SYN:** You send a message saying, “I would like to start a formal conversation. Are you ready?”
2.  **SYN-ACK:** Your friend replies, “I received your request, and I am also ready to talk.”
3.  **ACK:** You send a final confirmation: “Excellent, I have received your acknowledgment. The conversation is now officially open.”

This ritual is often summarized as: TCP three-way handshake: SYN → SYN-ACK → ACK (synchronize / acknowledge).

Once this formal connection is established, TCP meticulously numbers every single packet it sends. The receiver sends back acknowledgments (receipts) to confirm which packets have arrived safely. If a packet gets lost in transit, TCP’s tracking system notices it’s missing and automatically re-sends it. If the network seems congested (if the receipts start taking too long to come back), TCP will automatically slow down its sending rate to be a good citizen and reduce the congestion. This careful, reliable, and orderly approach is perfect for things like web pages, file downloads, and emails, where every single piece of data must be correct and in the right order.

**UDP (User Datagram Protocol)**, on the other hand, is a quick, no-fuss postcard. You scribble a message on it, drop it in the mailbox, and hope for the best. There’s no handshake, no packet numbering, and no acknowledgments. It’s a “fire-and-forget” protocol.

Why on earth would you ever use something so seemingly unreliable? Because it is incredibly fast and efficient. For applications like live video streaming, online gaming, or a quick DNS lookup, speed and low overhead are far more important than perfect accuracy. In a video call, a single missed frame or a slightly garbled word is much better than a long, jarring pause while TCP meticulously re-sends a lost packet from three seconds ago. If a UDP packet is lost, the application can either just ignore it and move on, or, if it’s important, the application itself can ask for the information again.

> **Core Concepts:** Choose your protocol for the job. TCP is the careful, reliable, and orderly registered mail service. UDP is the fast, efficient, and no-frills postcard service.

### Technical Deep Dive

*   **TCP (Transmission Control Protocol):**
    *   **Connection-Oriented:** Establishes a formal connection via the three-way handshake before any data is sent.
    *   **Reliable and Ordered:** Guarantees that data will be delivered in the correct sequence and without errors, using sequence numbers and acknowledgments.
    *   **Flow Control:** Uses a “sliding window” mechanism to ensure the sender doesn’t send data faster than the receiver can process it.
    *   **Congestion Control:** Uses sophisticated algorithms (like CUBIC and BBR) to detect and react to network congestion, reducing the transmission rate to avoid overwhelming the network.
*   **UDP (User Datagram Protocol):
    *   **Connectionless:** No handshake; packets (called datagrams) are sent without establishing a connection first.
    *   **Unreliable and Unordered:** Provides no guarantee of delivery or that datagrams will arrive in the order they were sent.
    *   **Low Overhead:** The UDP header is much smaller and simpler than the TCP header, meaning more of the packet is dedicated to your actual data and less processing is required by the network stack.
*   **QUIC (Quick UDP Internet Connections):** A much newer protocol that aims to provide the best of both worlds. It runs on top of UDP, so it’s fast and avoids some of the pitfalls of TCP. However, it builds its own reliability, ordering, and congestion control mechanisms directly into the protocol. Crucially, it also encrypts all data by default. QUIC is the foundation of **HTTP/3**, the latest version of the protocol that powers the web, and it’s designed to make web browsing faster and more secure, especially on unreliable networks. You can read more about it in [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html).

**Comparison Table: TCP vs. UDP**

| Feature             | TCP (Registered Mail)          | UDP (Postcard)                 |
|---------------------|--------------------------------|--------------------------------|
| **Connection**      | Connection-Oriented (Handshake)| Connectionless                 |
| **Reliability**     | High (Guaranteed Delivery)     | Low (No Guarantee)             |
| **Ordering**        | Guaranteed In-Order Delivery   | No Guaranteed Order            |
| **Speed**           | Slower (due to overhead)       | Faster (low overhead)          |
| **Header Size**     | 20 bytes (or more)             | 8 bytes                        |
| **Use Cases**       | Web, Email, File Transfer      | Streaming, Gaming, DNS, VoIP   |

This chapter has taken us from our private floor, down the elevator, through the lobby, and out onto the city streets. We’ve seen how routers act as concierges to guide our packets and how protocols like TCP and UDP define the fundamental rules of the conversation. In the next chapter, we’ll explore the essential public services that make the city navigable, like the city directory (DNS) and the ever-watchful security guards (firewalls).

## 2.5 The City Directory: DNS

You have your envelope, you've figured out your own building's hallways and elevators, and you've even spoken to the concierge about how to navigate the streets. But there's a problem. Your letter is addressed to "My Friend, Akihabara," not Tokyo, Chiyoda City, Kanda-Hanaokacho 1-1. You have a name, but the network of streets and buildings needs a precise address.

Before the concierge can even begin to help, you need to turn that friendly name into a logistical address. For that, you consult the city's official directory.

This directory is the Domain Name System, or DNS. It's the internet's universal address book. It does one job and does it millions of times a second: it translates the human-friendly names we use (google.com) into the computer-friendly IP addresses that routers need (142.250.196.78). It’s a thankless job, but someone has to do it, otherwise we’d all be sending letters to numbers instead of names, and who has time for that? (I’m sure the routers do, but we don’t!)

The process is simple. Your device essentially asks, "Where can I find friends-apartment.tokyo?" A DNS server, like a directory assistance operator, looks up the name and replies with the exact IP address. With that address in hand, your concierge (router) now knows which building across the city to start sending the envelope toward.

You don't go to the main city directory for every single letter. The first time you look up an address, you might jot it down on a sticky note. Your computer does the same thing. It keeps a temporary list of recently used names and addresses in a cache. This makes future connections much faster, because you don't have to ask for directions to a place you just visited.

> **Key Ideas:** DNS is the city directory that turns easy-to-remember names into the precise addresses that networks need to deliver your message.

### Technical Deep Dive
*   **DNS (Domain Name System):** A hierarchical and decentralized naming system for computers, services, or other resources connected to the Internet or a private network.
*   **DNS Query:** The process of a client computer asking a DNS server to resolve a domain name into an IP address.
*   **DNS Cache:** A temporary storage of information about previous DNS lookups on a machine's OS or web browser. Caching helps to improve performance by responding to DNS queries with locally stored information instead of having to query a DNS server.
*   **Recursive DNS Server:** A DNS server that queries other DNS servers on behalf of the client to fully resolve the name.
*   **Authoritative DNS Server:** A DNS server that holds the actual DNS records for a particular domain.

