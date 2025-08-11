# Quality of Service (QoS): Managing Network Traffic

Net Neutrality debate: One aspect is whether ISPs can prioritize some traffic (like their own services or paid fast lanes) over others – conceptually QoS but on a more policy basis. Under net neutrality, ISPs typically treat all user traffic similarly. However, they might still do QoS to ensure latency for real-time vs bulk within those constraints.

In your home, you might enable **"QoS"** on the router to keep gaming ping low even if someone else is streaming. This typically works by the router buffering/queueing less important traffic when link is near capacity.

Cloud providers even offer QoS or dedicated lanes for certain apps (e.g., AWS has ways to prioritize voice media packets for their connect).

**Without QoS**, everything is best-effort FIFO (first in, first out); heavy usage can starve delay-sensitive flows.

So practically, QoS is another tool for performance management. While CDNs and load balancing add capacity or shorten path, QoS optimizes usage of existing capacity by smart allocation when there's competition.

---

# NAT: Translating Addresses

> *Alright, our network is now speedy and well-managed. Coming up: NAT, a tech we touched on with private/public IP but to dive deeper with analogy.*

We earlier discussed private vs public IPs – **NAT (Network Address Translation)** is the mechanism that allows many devices in a building (network) to share one public street address while still getting their mail delivered correctly. Think of NAT as a clever front desk clerk at the building's lobby who handles all incoming and outgoing mail and knows which internal room corresponds to which outgoing request.

## Analogy Breakdown

- Your **building** (private network) uses internal room numbers (private IP addresses) that the outside world doesn't know
- The building has **one main mailbox** or street address (public IP)
- When someone inside (**Room 101**) sends a letter out to an external address, they give it to the front desk. The clerk notes "Room 101 is sending this" but on the envelope's return address, the clerk writes the building's main address (because using Room 101's internal number wouldn't help the outside post office)
- Now, any reply will come back to the building's main address. The **front desk clerk (NAT)** will remember, "Ah, I sent out a request on behalf of Room 101 earlier, this must be the reply" and then deliver it internally to Room 101
- In this way, outsiders only see the building's single address (they don't know about individual room numbers). Internally, the clerk keeps a ledger mapping outgoing requests to room numbers

## How NAT Works in Network Terms

- The **NAT device** (usually your router) alters the source IP (and port) of outgoing packets from a private IP (like 192.168.1.100) to the public IP (e.g., 203.0.113.50) and records that mapping (often also adjusting source port to keep them distinct)
- When the response comes back to that public IP (and port), the router looks up the mapping and translates the destination back to the original private IP, and forwards it inward
- **Multiple rooms** can do this at once, because the clerk might assign different return reference numbers (ports) for each conversation. So Room 101 and 102 can both request stuff outside; NAT differentiates responses by the port numbers it assigned to each session

*"NAT is like having a front desk clerk who translates the building's single public street address into the correct internal room number"* – exactly.

## Why NAT Was Crucial

This was crucial because of **IPv4 address shortage**. Instead of every device needing a unique public IP, an entire network can share one (or a few). It also adds a layer of isolation (by default outsiders can't directly reach internal rooms without an initiated request or special port forwarding set).

**Another everyday analogy:** When you call a company's main phone number, the receptionist might ask "Which extension?" and then connect you inside. Outbound calls from employees might all show the company's main number on caller ID, but the receptionist (or phone system) knows how to route return calls to the right person.

## NAT Complexities

However, NAT has some complexities:

- If a room didn't initiate a conversation, how can someone outside reach it? They need an explicit **"port forward"** or arrangement (like telling the clerk: any mail coming to main address with label X, send to Room 202). That's why hosting servers behind NAT needs configuration
- NAT can break some protocols that carry IP info inside (like older ones that don't expect the address to change). Usually, NAT routers have application-layer gateways or special handling for common ones (like FTP)
- But by and large, **NAT is ubiquitous** in IPv4 LANs

In IPv6 world, every device can have a unique address, so NAT isn't needed for address conservation (though some still use similar concepts for maybe privacy or network design).

## NAT Types

- **PAT (Port Address Translation)** is the most common, where many to one using ports (often just called NAT in home routers)
- There's also **one-to-one NAT** (like mapping one public IP to one private IP directly), but in analogy that's like giving a specific room its own direct P.O. box outside – less common in small networks

NAT's front desk also by default doesn't allow unsolicited entry: if someone tries to just walk in (unsolicited incoming), the front desk says *"Who are you here to see? I have no record of them expecting you – sorry"* (packet gets dropped since no mapping).

> **Technical Perspective:**
>
> - NAT was a workaround but became integral to how IPv4 internet scaled. E.g., your ISP gives you one IP and your router NATs all your devices
> - The NAT table stores (Private IP:Port, Public IP:Port, Remote IP:Port) mappings typically. For outgoing, it picks an available public port (or uses a pool of public IPs if available)
> - **NAT traversal:** techniques like STUN, TURN for peer-to-peer (like video calling between two NAT-ed users) – basically getting both to initiate outwards or use a relay server, because NATs normally block inbound
> - **"Port forwarding":** a static NAT rule that forward traffic hitting a certain port on the public side to a designated private IP/port (like front desk has an always rule: if package is labeled "Service X", always deliver to Room Y)
> - **Security through NAT:** While not designed as security, it acts as a basic firewall in that internal addresses aren't reachable by default externally. Many malwares rely on initiating outbound connections for control because inbound would be blocked
> - **Carrier-Grade NAT:** Some ISPs NAT multiple customers behind one IP nowadays (due to IPv4 scarcity), which is like multiple buildings behind one address – even more complex for tracking
> - **NAT and protocols:** Some protocols send IP info in payload (like FTP's active mode, SIP for VoIP) – NAT needs helpers to rewrite those or use NAT traversal techniques
> - The term "NAT" itself implies modifications to IP headers – which purists didn't like because end-to-end connectivity is broken (the outside host doesn't truly know the inside host, just sees NAT). But necessity made it common
> - **Logging:** NAT devices often log mappings (like who had which port when) for audits, akin to front desk keeping visitor logs

NAT's analogies are often the receptionist or the post office box analogy. Another one: NAT as the bouncer at a club with a one-in-one-out policy controlling who can come in, but our front desk translation is apt.

With NAT covered, our analogy journey likely is nearing end of core topics. We might still mention monitoring/logging, SDN, IPv6 vs IPv4, topologies, which are listed.