---
title: "Understanding Computer Networks by Analogy: Appendices"
date: 2025-10-18T22:39:16+09:00
draft: true
---

> A quick reference for the model, the vocabulary, and the first questions to ask when the path stops making sense.

License: CC BY-NC-ND 4.0

---

These appendices are meant to stay open beside the terminal.

They are not a replacement for the chapters. They are the compressed version of the map: the analogy, the vocabulary, and the troubleshooting sequence you can return to when an outage starts to feel larger than it is.

---

# Epilogue: Full Circle

## Chapter 19: Back to the First Outage

At the beginning of this series, I started with the feeling that matters most: staring at terminal output and not knowing which part of the story it belongs to.

That confusion is the gap this book tries to close.

Not memorizing acronyms. Not winning arguments about the OSI model. The useful skill is knowing what question comes next when the first answer is incomplete.

### Five questions to start with

When something breaks, start here:

1. **What exactly am I trying to connect?** Name the client, server, hostname, IP, and port if you can.
2. **Which layer is most likely implicated first?** Physical medium, local link, routing, transport, application, or identity.
3. **Where does the path stop making progress?** On the local host, the default gateway, the resolver, the next hop, or the far side.
4. **Which rule might be denying the action?** Firewall, security group, route table, IAM policy, certificate validation, or application auth.
5. **What evidence would narrow this down?** One more packet capture, one DNS query, one route lookup, one log line.

During an incident, simple questions are useful because they survive stress. You can still ask them when the chat is noisy and everyone has a theory.

### Replaying the original scene

Picture that first outage again.

Internal tools are failing. Someone says "the network is down." That sentence matches the mood better than the evidence.

So you begin to narrow it.

1. Your laptop has an IP address.
2. You can reach the default gateway.
3. You can reach a public IP such as `1.1.1.1`.
4. Requests by hostname fail.

Now you know something concrete: routing to at least some external destinations works, while name resolution is failing somewhere in the path.

Now test the resolver itself.

If your configured DNS server is an internal address and it does not answer, you have a stronger lead. If you query a public resolver and public names start working, that tells you the network path is probably usable for public traffic. It does **not** mean your internal services are fixed. Internal zones may still depend on the corporate resolver.

In a real incident, that distinction saves time. Switching to `1.1.1.1` may help you prove that the problem is internal DNS. It may not restore access to `db.internal.example.com`.

The fix is to restore or fail over the internal DNS service, correct the broken configuration, or bring the missing resolver back into service. The hard part is not the exact command. The hard part is keeping the sequence clean when people start guessing.

The network stops feeling like a black box when you can describe which step is failing and what evidence supports that claim.

---

## Keep the map small

The map in this book is small on purpose: buildings, floors, hallways, lobbies, streets, towers, and directories.

Real networks are messier than that. They include retransmissions, asymmetric paths, policy routing, certificate chains, provider control planes, caches that lie to you, and application behavior the analogy only brushes against.

The map does not need to contain all of it. It only needs to stop you from groping in the dark.

If it helped you name the next question instead of taking the first guess, it did the job.

---

# Appendix A: The Whole Journey at a Glance

## Understanding by Layer

| Layer (TCP/IP) | What It Does | Analogy | Key Protocols | Common Controls |
|----------------|--------------|---------|---------------|-----------------|
| **Application** | Application behavior and semantics | The actual conversation | HTTP, DNS, SSH, SMTP, TLS | App auth, WAFs, reverse proxies |
| **Transport** | End-to-end conversation behavior | Registered mail vs postcards | TCP, UDP, QUIC | Host firewalls, service listeners |
| **Network** | Host addressing and routing across networks | Streets and intersections | IP, ICMP, routing protocols | Routers, route tables, ACLs |
| **Link** | Local delivery on the current segment | Floor-level delivery | Ethernet, Wi-Fi, VLANs, ARP | Switches, APs, local segmentation |
| **Physical** | Signals on the medium | The material the hallway is made from | Copper, fiber, radio | Cables, optics, radios, NICs |

## The Complete Analogy Map

| Concept | Analogy | Network Term | Where to Inspect It | Common Tool |
|---------|---------|--------------|---------------------|-------------|
| **Room** | One device in the building | Host/device | Local network settings | `ip addr`, `ipconfig` |
| **Door** | One attachment point | Interface / NIC | Interface inventory | `ip link`, `ifconfig` |
| **Door label** | Local physical identifier | MAC address | Interface details | `ip link`, `arp -a` |
| **Room placard** | Logical location | IP address | Host config | `ip addr`, `ipconfig` |
| **Floor plan** | Which rooms count as local | Subnet mask / prefix | Host config | `ip route`, subnet calculators |
| **Elevator lobby** | Path off the local floor | Default gateway | Route table | `ip route`, `netstat -nr` |
| **Mailroom on the floor** | Learns local delivery paths | Switch | Switch tables / interface status | switch CLI, ARP table context |
| **City desk** | Chooses next hop | Router | Route table | `traceroute`, router CLI |
| **City directory** | Name to address mapping | DNS | Resolver settings | `dig`, `nslookup`, `host` |
| **Hotel tower** | Your isolated cloud network | VPC / VNet | Cloud console | cloud CLI / console |
| **Public entrance** | Public-facing path | Internet Gateway / public edge | Route tables and public IP config | cloud console |
| **Staff exit** | Outbound-only egress path | NAT Gateway / NAT service | Egress routing | cloud console |
| **Private service corridor** | Private path to provider services | Endpoint / PrivateLink / equivalent | Endpoint config | cloud console |
| **Badge system** | Identity and permissions | IAM roles / policies / service accounts | IAM console | cloud CLI |
| **Guard rules** | Network allow/deny rules | Security groups / NACLs / firewall rules | Network policy views | cloud console |
| **Mail slot** | Service-specific endpoint on the host | Port | Listening sockets | `ss`, `netstat`, `lsof` |
| **Diplomatic ceremony** | Session identity and secrecy | TLS handshake | Certificates and client/server config | `openssl s_client` |
| **Personal usher** | Per-service traffic helper | Sidecar proxy / mesh data plane | Pod or service config | `kubectl`, mesh tooling |

## End-to-End Request Flow

When your browser loads a secure page from a modern cloud-backed service, the path often looks like this:

1. The application creates a request for a hostname.
2. DNS resolves that hostname to one or more addresses.
3. The host decides whether the destination is local or remote.
4. If remote, the host sends the packet toward the default gateway.
5. Routers forward the packet hop by hop toward the destination network.
6. The destination edge, load balancer, or origin service receives the traffic.
7. A transport session is created.
8. TLS may be negotiated.
9. Security controls and policy checks are applied at the relevant layers.
10. The application processes the request and returns a response.

The whole exchange can finish in milliseconds, but every stage still corresponds to a question you can test.

---

# Appendix B: Glossary

**ACK (Acknowledgment):** TCP's confirmation that data has been received.

**ARP (Address Resolution Protocol):** Local mechanism for mapping an IP address to a MAC address on the current broadcast domain.

**AS (Autonomous System):** A network or group of networks under one administrative routing policy on the public internet.

**Bandwidth:** Link capacity, usually measured in bits per second.

**BGP (Border Gateway Protocol):** The routing protocol used between autonomous systems on the internet.

**CIDR (Classless Inter-Domain Routing):** Address notation such as `192.168.1.0/24` that combines network and prefix length.

**Circuit Breaker:** A pattern that stops sending requests to a failing dependency for a period of time.

**Default Gateway:** The next local hop a host uses when the destination is outside its local subnet.

**DHCP (Dynamic Host Configuration Protocol):** The service that assigns IP configuration to hosts.

**DNS (Domain Name System):** The distributed system that maps names to records such as IP addresses.

**DNSSEC:** A set of DNS extensions that help clients verify DNS responses have not been tampered with.

**Encapsulation:** Wrapping higher-layer data inside lower-layer headers as it moves down the network stack.

**Ephemeral Port:** A temporary source port chosen by the OS for an outbound connection.

**Firewall:** A system that filters traffic according to policy.

**Forward Secrecy:** A property of modern key exchange where compromise of long-term keys does not automatically reveal past session keys.

**Handshake:** The setup exchange that establishes communication state or security parameters.

**IAM (Identity and Access Management):** The system that defines who can perform which actions in a cloud platform or service.

**Internet Gateway:** A cloud component that enables routed access between a VPC and the public internet, subject to the rest of the network configuration.

**IP Address:** The logical address used to identify a host or interface on a routed network.

**Jitter:** Variation in delay between packets.

**Latency:** The time it takes data to travel from one point to another.

**Load Balancer:** A component that distributes traffic across multiple targets.

**MAC Address:** A Layer 2 hardware identifier used for local delivery on a link-layer network.

**MTU (Maximum Transmission Unit):** The largest packet size a link can carry without fragmentation at that layer.

**mTLS (Mutual TLS):** TLS where both sides authenticate each other with certificates.

**NAT (Network Address Translation):** Rewriting addresses or ports as traffic crosses a boundary.

**NAT Gateway:** A cloud egress service that allows private resources to initiate outbound traffic without being directly reachable from the internet.

**Network ACL:** A stateless network rule set applied at a subnet or segment boundary, depending on the platform.

**nmap:** A tool for discovering hosts and services on a network.

**OSPF (Open Shortest Path First):** An interior routing protocol used within organizations.

**Packet:** A unit of data at the network layer.

**Path MTU Discovery:** The process of finding the largest usable packet size along a path.

**Port:** A transport-layer identifier used to direct traffic to a specific service or socket endpoint.

**QUIC:** A transport protocol built over UDP that includes features such as encryption and reliable delivery behavior at the protocol layer.

**Recursive Resolver:** The DNS server that performs lookups on behalf of a client.

**Retry Policy:** Rules about if and when a failed request should be attempted again.

**Router:** A device or software component that forwards packets between networks using routing information.

**Routing Table:** The set of routing rules a host or router uses to select the next hop or exit interface.

**Security Group:** A stateful cloud firewall policy attached to instances or interfaces, depending on the platform.

**Service Mesh:** A platform layer that manages service-to-service traffic behavior such as policy, encryption, retries, and telemetry.

**Socket:** One endpoint of a network conversation, defined by an IP address, protocol, and port.

**Subnet:** A logical IP network segment defined by an address range and prefix.

**SNR (Signal-to-Noise Ratio):** A measure of signal quality relative to surrounding noise on a wireless link.

**TCP:** A connection-oriented transport protocol that provides ordered and reliable byte-stream delivery.

**TLS:** A protocol that authenticates peers and encrypts traffic in transit.

**TTL (Time To Live):** A hop limit in IP packets; also a caching timer in DNS, depending on context.

**UDP:** A lightweight transport protocol that sends datagrams without TCP-style connection management.

**VLAN:** A logical Layer 2 segmentation mechanism on switched networks.

**VPC / VNet:** A cloud-defined private network boundary and address space.

---

# Appendix C: First Troubleshooting Pass

When the report is vague, this checklist helps you make it concrete.

## Address

- What hostname or IP is the client trying to reach?
- Does DNS resolve the expected answer?
- Is the answer stale, split-horizon, or unexpectedly private/public?

## Path

- Does the client have the correct local IP, mask, and default gateway?
- Can it reach the local gateway?
- Can it reach the next obvious hop or a known external IP?
- Does `traceroute` suggest where progress stops?

## Service

- Is the remote service actually listening on the expected port?
- Does the host return `connection refused`, silently drop traffic, or respond slowly?
- Is a load balancer or reverse proxy in front changing the behavior?

## Policy

- Is a firewall, security group, NACL, route table, or NAT rule involved?
- In the cloud, does the caller also need IAM permission or a service identity?
- For TLS, is there a certificate or hostname-validation issue?

## Evidence

- Which one additional command would narrow the problem the most?
- What did the last successful hop or check prove?
- What still remains unknown?

That is usually enough to turn "the network is broken" into a real diagnosis path.
