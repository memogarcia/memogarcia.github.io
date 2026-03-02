---
title: "Understanding Computer Networks by Analogy: Part 5 - Follow the Envelope"
date: 2025-10-20T09:00:00-07:00
draft: true
---

> We've traced the theory from rooms and doors through entire cities and diplomatic ceremonies. Now it's time to walk those hallways and streets ourselves.

License: CC BY-NC-ND 4.0

---

# Part Five: Follow the Envelope

## Chapter 17: Hands-On Practice

If you've been reading from the beginning, you've walked through buildings with their rooms and doors, explored entire cities with postal systems and diplomatic districts, and learned about wireless market squares and TLS diplomatic ceremonies. We've built a mental model that spans from the simplest local network to sophisticated distributed systems.

Now it's time to put that model to work.

This chapter contains hands-on exercises you can run on your own computer. These aren't abstract demonstrations—they're your chance to walk the hallways we've been discussing, test the door locks, and watch letters travel between buildings. You'll see MAC addresses appear, routes get traced, TLS certificates validated, and connections timed. When you ping a server, you'll know exactly how that envelope moves through our imaginary city.

The labs are divided into two sections. The **Core Labs** use tools available on any modern computer—no cloud accounts needed. These show you what's happening in your own building. The **Cloud Labs** explore virtual infrastructure on a larger scale, demonstrating how the same principles apply when we scale from a single building to an entire district of coordinated buildings.

Some of these will work immediately. Others will fail in interesting ways. When something doesn't work as expected, lean on our building/city mental model. Ask yourself: which permission is blocking this? Which path isn't available? Which address is unreachable? The answers will guide you to solutions faster than trial and error.

Ready to follow some envelopes?

---

### Lab 1: Follow the Envelope with Ping and Traceroute

Remember how we talked about sending letters between buildings? This is where you watch those letters travel in real time. You'll see address lookup, reachability testing, and path mapping—the foundation of everything we've discussed.

Start by asking the city directory for an address:

On macOS or Linux: `dig +short example.com`

On Windows: `nslookup example.com`

This queries the DNS directory service we explored in Part 2. Instead of getting "Main Street, Building 12," you get an IP address. The directory might return multiple addresses—some buildings have several entrances.

Now send a test message to see if the building is reachable:

On macOS or Linux: `ping -c 5 example.com`

On Windows: `ping -n 5 example.com`

Ping sends a simple envelope and waits for the reply. You should see round-trip times—how long it takes your envelope to travel to that building, get processed, and return. If you see timeouts instead, something is blocking the path. Maybe a firewall guard turned you away, or a router concierge couldn't forward your message.

Finally, map the entire route:

On macOS: `traceroute example.com`

On Linux: `traceroute -n example.com`

On Windows: `tracert example.com`

Each line represents a hop from one router concierge to the next. You're watching your envelope move through the city, building by building. Note where the latency jumps—that's often a long-distance handoff between districts, or a particularly busy router processing many envelopes at once. The first few hops are usually local (your floor, your building), then you hit major highways between cities.

---

### Lab 2: Inspect Your Local Network Configuration

Before you can explore outside your building, you need to know your own address and where to find the elevator lobby. This lab shows you exactly what your device needs to participate in network conversations.

On Linux: `ip -4 addr show` shows your IP address and subnet mask—your room number and which floor you're on. Then `ip route` reveals your default gateway—the elevator lobby where all external traffic goes first.

On macOS: `ipconfig getifaddr en0` gives you your IP address. Then `netstat -nr | grep default` shows your gateway.

On Windows: `ipconfig /all` displays everything at once: your IP (room number), subnet mask (floor layout), default gateway (elevator lobby), and DNS servers (directory services).

Take note of your IP address and gateway. That gateway IP is the elevator lobby for your floor—any envelope addressed to a different building gets handed there first. If you see a subnet mask like 255.255.255.0(/24), that tells you which rooms are on your local floor. Addresses outside that range require a trip through the lobby.

---

### Lab 3: Watch ARP Discover MAC Addresses

Every door in our building analogy has a physical label with a MAC address. But how does your device learn which label belongs to which room? That's what ARP (Address Resolution Protocol) does—it's the concierge who walks the halls, learning which room numbers correspond to which door labels.

First, look at your current ARP table—the concierge's notebook of known mappings:

On Linux: `ip neigh`

On macOS or Windows: `arp -a`

You'll see IP addresses paired with MAC addresses. These are the door labels the concierge has already learned. Maybe you'll see your gateway, or other devices you've recently contacted.

Now here's where it gets interesting. Find another device on your local network—perhaps your phone on the same Wi-Fi, or another computer. Ping it:

`ping [that device's IP address]`

Your device just broadcast a message: "Who has this IP address? Tell me your MAC address!" Every device on your floor heard it, but only the one with that IP responded with its MAC address.

Now check your ARP table again:

`arp -a` (or `ip neigh` on Linux)

You should see a new entry. The concierge learned something new. This is constantly happening in the background—you're just watching it live.

---

### Lab 4: Start a Server and Connect to a Port

Think of ports as mail slots on each door—different services listen at different slots. Port 80 is for regular web traffic (unsecured mail), port 443 for HTTPS (sealed diplomatic envelopes), and port 22 for SSH (secure administrative access). Let's open our own mail slot and watch traffic flow through it.

On any computer with Python installed (which includes most Macs and Linux systems, and many Windows machines), start a simple web server:

`python3 -m http.server 8000`

This opens port 8000—a new mail slot—and starts listening. The server is now the occupant of that room, ready to accept envelopes.

In another terminal window, send an envelope to that slot:

`curl http://127.0.0.1:8000`

The curl command creates an envelope addressed to your own machine (127.0.0.1 is the loopback address). Note what happens here: because the destination is your own room, the envelope never enters the hallway. It never touches the physical door (network interface), and the MAC label is irrelevant. It's essentially sliding a note from your left hand to your right hand while standing in your own apartment. Your Python server receives it, processes the request, and sends back a response listing the directory contents.

If you know your computer's LAN IP address (from Lab 2), try connecting from another device on the same network:

`curl http://[your-lan-ip]:8000`

If this fails, a firewall guard is blocking that mail slot. You might be able to open it in your firewall settings, but that's a configuration detail that varies by operating system. The key point: services listen on ports, and firewalls control which ports are accessible from outside.

---

### Lab 5: Observe TCP Connections

In Part 1, we talked about how TCP connections require two ports: one at each end of the conversation. This is like needing both a sender's and recipient's mail slot for a reliable exchange. Let's watch this happen in real time.

First, start a connection:

`curl -I https://example.com`

This opens a diplomatic envelope exchange (HTTPS) with example.com. Now, while that connection exists, let's see the two mail slots involved:

On Linux: `ss -tnp | head`

On macOS: `netstat -anp tcp | head`

On Windows: `netstat -ano | find ":443"`

Look for the connection to example.com. You'll see two port numbers:

- **Remote port 443**: This is example.com's mail slot—always 443 for HTTPS, just like every diplomatic building uses the same secure receiving slot.

- **Local port**: This will be something high and random, like 51234 or 60321. Your computer assigned this temporarily—an ephemeral port created just for this conversation. When you close the connection, that port disappears and can be reused for another conversation.

This two-port system is why multiple browser tabs can connect to the same website simultaneously. Each tab gets its own local mail slot, even though they're all sending to the same remote slot. The building (your computer) can handle many simultaneous conversations by assigning unique local ports to each one.

---

### Lab 6: Compare TCP and UDP with Netcat

In Part 1, we distinguished between TCP (the reliable postal service that confirms delivery) and UDP (the messenger who just drops off the package and leaves). Netcat lets you experience both protocols side by side.

Open two terminal windows. In the first, start a TCP listener on port 9999:

`nc -l 9999`

This creates a reliable mail slot. TCP will ensure every envelope is delivered and confirmed.

In the second terminal, connect as a client:

`nc 127.0.0.1 9999`

Type a message and press Enter. It appears in the server window. TCP established a connection first, confirmed both parties were ready, and now guarantees delivery. If the connection drops, you'll know immediately.

Now let's try UDP. In the first terminal, start a UDP listener on port 9998:

`nc -u -l 9998`

In the second terminal:

`nc -u 127.0.0.1 9998`

Send some messages back and forth. Notice there's no connection ceremony—you begin talking immediately. UDP is faster because it skips the handshake, but it's less reliable.

Here's the interesting part: Stop the UDP server (Ctrl-C), then restart it. The client can keep sending messages, completely unaware that nobody is listening. UDP doesn't know or care if the recipient is there. The messages disappear into the void. This is great for streaming video (where a lost frame doesn't matter) but terrible for file transfers (where every byte counts).

---

### Lab 7: Inspect a TLS Certificate Chain

Remember the diplomatic ceremony we discussed in Part 4? That TLS handshake where your browser verifies a server's identity before exchanging secrets? Let's watch that ceremony unfold and examine the credentials being presented.

Run this command:

`openssl s_client -connect example.com:443 -servername example.com -showcerts < /dev/null`

This initiates a TLS connection and displays the entire certificate chain—the diplomatic credentials presented during the ceremony. Look for these key pieces:

- **Subject**: Who this certificate belongs to (example.com's diplomatic credentials)
- **Issuer**: Which Certificate Authority signed it (the trusted authority vouching for them)
- **Validity period**: When the credentials expire
- **Public key**: The encryption key you'll use to send secure messages

You might see multiple certificates in the chain—the server's certificate, one or more intermediate certificates, and implicitly the root CA that your operating system trusts. This chain of trust works like a series of diplomatic introductions: "I trust the root CA, they trust the intermediate CA, and the intermediate CA trusts this server."

The `-servername` parameter sends the SNI (Server Name Indication) extension, which is crucial in our multi-tenant building analogy. Many servers host multiple websites on the same IP address (multiple diplomatic services in one building). SNI tells the server which credentials to present.

---

### Lab 8: Measure DNS Lookup Time

Every new connection starts with a lookup in the city directory. Before you can send an envelope, you need to know the building's address. These lookups add time to every fresh connection, and understanding them helps diagnose "slow" websites that aren't actually slow.

Run a DNS query:

`dig example.com`

Look for the "Query time" in the output. On my system, that's often 20-40 milliseconds for an uncached query. That's how long it took to:

1. Check my local cache (do I already know this address?)
2. Contact my configured DNS server (often my internet provider's directory service)
3. Wait for that server to either have the answer cached or query up the chain to the authoritative DNS server

Run the same command again:

`dig example.com`

The second query is almost always faster—often under 5 milliseconds. Your operating system cached the result. Next time you need example.com's address, no directory lookup is needed.

You can force a fresh lookup by asking a different DNS server:

`dig @8.8.8.8 example.com`

This bypasses your local cache and asks Google's public DNS server. Compare the timing. A good DNS server makes a noticeable difference in how snappy web browsing feels, especially on sites using many different domains (each requiring its own lookup).

---

### Lab 9: Test Maximum Packet Size

Every hallway in our network city has a maximum size for envelopes. Try to send something too big, and it has to be broken into pieces and reassembled—adding overhead and complexity. This maximum size is called the MTU (Maximum Transmission Unit), and it varies by connection type.

Most Ethernet connections use 1500 bytes, but some overhead reduces usable space to about 1460 bytes. Let's test what your path to example.com can handle:

On Linux: `ping -c 1 -M do -s 1472 example.com`

On macOS: `ping -D -s 1472 example.com`

On Windows: `ping -f -l 1472 example.com`

The `-M do`, `-D`, and `-f` flags set the "Don't Fragment" bit—telling routers "if this envelope is too large, don't break it up, return an error." The 1472 bytes plus the 28 bytes of headers should fit in a 1500-byte MTU.

If it works, great! Your path supports standard-sized envelopes. Try increasing the number to find your actual path MTU. When you exceed it, you'll get an error like "Packet needs to be fragmented but DF set" or "Message too long."

This matters in real networks. VPNs, tunnels, and some cloud networks add overhead that reduces the effective MTU. If you see mysterious connection problems—where small transfers work but large ones fail—MTU issues are a common culprit.

---

### Lab 10: Measure Connection Timing

When a website feels slow, you need to know where the delay occurs. Is it DNS lookup? TCP handshake? TLS ceremony? Server processing? This breakdown shows you exactly how long each step takes.

`curl -o /dev/null -s -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://example.com`

This command downloads example.com to nowhere (`/dev/null`) but reports the timing breakdown. Crucially, in `curl`, these timers are cumulative from the start of the command:

- **dns**: How long the city directory lookup took (Part 2)
- **connect**: Total time from start until the TCP connection was established (Part 1)
- **tls**: Total time from start until the TLS diplomatic ceremony finished (Part 4)
- **ttfb** (time to first byte): Total time from start until you receive the first envelope back
- **total**: Complete round-trip time

Typical results might show 40ms for DNS, 50ms for connect, 120ms for tls, and 180ms TTFB. Because these are cumulative, the actual server processing and transit time for your request is just 60ms (TTFB of 180ms minus TLS of 120ms). If you mistakenly thought the server took 180ms to process the request, you'd be falsely blaming the backend application when the network setup actually took the bulk of the time!

This kind of breakdown is invaluable for performance optimization. You can't fix what you can't measure.

---

### Lab 11: Watch in Real Time with tcpdump

All the labs so far show you static snapshots. But networks are dynamic—conversations happening constantly, doors opening and closing, envelopes flowing in both directions. tcpdump is the ultimate tool for watching this live.

On Linux or macOS: `sudo tcpdump -i any -n`

This captures every packet on all interfaces. You'll see ARP requests (concierge shouting), DNS queries (directory lookups), TCP handshakes (connection establishment), and much more. To focus on just HTTP traffic: `sudo tcpdump -i any -n port 80`

To watch DNS specifically: `sudo tcpdump -i any -n port 53`

Being able to watch the traffic in real time is like having X-ray vision into the hallways. You'll see packets you didn't know were being sent, responses that surprise you, and timing that reveals performance issues.

Be careful with this tool on production systems—every packet consumes CPU and disk resources to capture. But on your local machine, it's invaluable for understanding how networks actually behave.

---

## Chapter 18: Cloud Labs

We've walked through our own building and watched local traffic flow. But what happens when we scale up? What does it look like when we need to coordinate an entire district of buildings with different security requirements and traffic patterns? That's where cloud networking comes in.

The cloud labs below use AWS terminology and examples because that's what I'm most familiar with, but the concepts are universal across providers. Whether you use AWS, Azure, Google Cloud, or any other provider, you'll create VPCs, subnets, gateways, and security rules using the same architectural patterns we discuss here.

These exercises require access to a cloud provider account and basic familiarity with creating resources. If you don't have access, read through them anyway—the concepts will make sense regardless of whether you can run the commands.

Ready to build some virtual neighborhoods?

---

### Cloud Lab A: Build a VPC with Public and Private Subnets

In Parts 2 and 3, we talked about entire neighborhoods of buildings with different access levels and security requirements. Let's build one.

Create a new VPC with a CIDR block like 10.0.0.0/16. This is your private neighborhood—a collection of buildings under unified management.

Create two subnets within this VPC:

- A public subnet (10.0.1.0/24): These are buildings with public entrances
- A private subnet (10.0.2.0/24): Internal administration buildings

Place them in different availability zones for redundancy—different physical districts of the city, so a problem in one district doesn't take everything down.

Create an Internet Gateway and attach it to your VPC. This is the main gate to the outside world. Update the public subnet's route table so traffic to 0.0.0.0/0 (anywhere outside the neighborhood) goes through the Internet Gateway.

Now launch a small instance in the public subnet and give it a public IP. You should be able to SSH to it from the internet—it's in a public building with an external entrance.

Launch another instance in the private subnet. Don't give it a public IP. Try to SSH to it from the internet. You can't—there's no public entrance. Now SSH to your public instance first, then try to connect to the private instance from there. If your security groups (door locks) allow it, you can reach the private building through the public one.

You've just built a neighborhood with separate public and private zones. This is the foundation of secure cloud architecture.

---

### Cloud Lab B: Add a NAT Gateway

Your private buildings need to reach the outside world—to download security updates, install software, or sync with external services. But you don't want public entrances on sensitive buildings. This is the classic problem: allow outbound traffic while preventing inbound connections.

The solution is a NAT (Network Address Translation) Gateway. Place it in your public subnet and give it an Elastic IP (a public IP address that doesn't change). All your private buildings will use this as their exit point to the internet.

Update the private subnet's route table. Any traffic destined for 0.0.0.0/0 (outside the neighborhood) should go through the NAT Gateway instead of the Internet Gateway.

Now SSH to your private instance (you'll need to go through the public bastion instance, since the private building has no public entrance). Try to reach the internet:

`curl https://example.com`

It works! Your private building can initiate outbound connections. But try to connect from the internet directly to the private instance—you can't. The NAT Gateway acts like a staff exit: people inside can leave, but nobody outside can enter. The NAT Gateway translates the private IP addresses to its own public address, making multiple buildings appear as one from the outside.

---

### Cloud Lab C: Create a VPC Endpoint

Your buildings need to access shared services—perhaps a cloud storage facility, a managed database, or other provider services. By default, that traffic goes through the public internet (or through your NAT Gateway) even if both endpoints are in the same cloud provider.

This is like leaving your secure neighborhood just to visit the neighborhood grocery store. It's inefficient and potentially insecure.

A VPC endpoint creates a private connection. Think of it as a private tunnel directly to the service, completely bypassing the public internet. Create a gateway endpoint for your provider's object storage service (like S3 on AWS) and associate it with your route tables.

Now from your private instance, access the storage service. If you enable VPC Flow Logs, you can see that the traffic never leaves your virtual neighborhood—it goes directly through this private tunnel. This is more secure, faster, and doesn't consume your NAT Gateway bandwidth.

---

### Cloud Lab D: Security Groups vs Network ACLs

We've mentioned security groups (door locks on individual rooms) throughout our journey. But there's another layer of protection we haven't discussed yet: Network ACLs.

Think of security groups as stateful locks—if you allow traffic in, responses are automatically allowed back out without explicit rules. They're tied to individual instances (rooms).

Network ACLs work at the subnet level (controlling entire floors). They're stateless—unlike security groups, you must explicitly allow both inbound and outbound traffic for a connection to work. They're also processed in order, like a checklist where you stop at the first match.

Here's how they work together:

Create a web server in your public subnet. Configure its security group to allow inbound HTTP (port 80) from anywhere. Access the web server from your browser—it works. Security groups alone allow the traffic.

Now add a network ACL rule to the subnet that denies inbound traffic on port 80.

Try accessing the web server again. It fails, even though the security group allows it. The NACL processes first and blocks the traffic.

Remove the NACL rule. Access is restored.

Understanding this layering is crucial for troubleshooting. If something is blocked, check security groups first (easier to diagnose), then NACLs (often overlooked), then routes. Each layer has different visibility tools and different default behaviors, so knowing where to look saves hours of debugging.

---

## Chapter 19: Service Mesh and Advanced Topics

We've built secure neighborhoods, managed traffic patterns, and secured diplomatic channels. But in modern applications, most communication isn't between your buildings and the outside world—it's room-to-room within your own infrastructure. Your authentication service talks to your user service. Your user service talks to your database. Your API gateway calls a dozen backend services. Hundreds of internal conversations happen for every external request.

How do you secure and observe all of this internal traffic without modifying every application?

This is the problem that service meshes solve. Let's build on our personal ushers analogy from Part 4 and see how it works in practice. If you're running Kubernetes, you can deploy Linkerd, Istio, or Consul. If you're on traditional VMs, you can configure Envoy proxies alongside your applications.

The key concept: Each service gets a sidecar proxy—a personal usher who handles all network communication. The service doesn't know about the network; it just hands envelopes to the usher and receives responses.

### What the personal ushers provide:

**Mutual TLS**: In Part 4 we talked about TLS for external connections. A service mesh extends this internally. Every conversation between services is encrypted and authenticated. If someone gains access to your network, they still can't eavesdrop on or impersonate services.

**Traffic management**: The ushers can split traffic between versions for blue-green deployments. If the new version starts returning errors, the usher can detect this and shift traffic back. They can retry failed requests with exponential backoff. They can stop sending to a misbehaving service (circuit breaking) and route around it.

**Observability**: Because every request passes through an usher, you get uniform metrics, logs, and traces without modifying applications. You can see which services talk to which others, how long calls take, and where failures occur. This is invaluable for debugging distributed systems.

### The trade-offs

Adding a service mesh increases complexity. It's another system to configure, monitor, and debug. The sidecars add a small amount of latency to every request. The control plane (the coordinator who instructs all the ushers) becomes a critical dependency.

For systems with dozens or hundreds of services owned by different teams, a service mesh dramatically simplifies networking concerns. It moves security and observability from individual applications to infrastructure. For smaller systems, the complexity might not be worth the benefits yet.

Consider your current scale and pain points. Are teams spending significant time debugging service-to-service communication? Are security audits highlighting a lack of internal encryption? Is it difficult to understand which services depend on which others? If yes, investigate service mesh options. If not, keep this in mind for future growth.

---

## Conclusion: From Buildings to Cities to Reality

We've come full circle. We started with simple rooms and doors, expanded to buildings and floors, explored entire neighborhoods and cities, and finally examined sophisticated diplomatic ceremonies and personal ushers. Along the way, we've traced an envelope through this entire journey.

Now you've walked those same paths yourself, using real tools to observe real traffic. You've seen MAC addresses appear, routes get traced, ports opened, certificates validated, and connections timed. The abstractions have become concrete.

The goal was never to make you a networking expert in a single book. That's impossible. Networking is a field that rewards deep, specialized knowledge. But you now have a mental model that connects the pieces. When you see a certificate error, you understand the diplomatic ceremony has failed. When a connection times out, you can trace the path and see where the breakdown occurred. When packets fragment unexpectedly, you know to check the hallway size.

This model will serve you well as your infrastructure grows. Cloud networks, Kubernetes, service meshes, edge computing—all of these are variations on the themes we've explored. The vocabulary changes, but the questions remain the same:

- Who am I talking to? (addresses and ports)
- Which path am I using? (routing and gateways)
- What are the rules of this conversation? (protocols, TLS, firewalls)
- Is this conversation confidential? (encryption and authentication)
- Can I observe what's happening? (monitoring and debugging)

Build your intuition with these questions in mind. When something breaks—and it will—you'll have a framework for understanding and fixing it.

One more part remains: some appendices with quick references and cheat sheets. Then you're ready to explore whatever intrigues you next, whether that's diving deeper into protocols, learning cloud platform specifics, or building distributed systems on top of these foundations.

Thanks for walking through these buildings and cities with me. Now go build something.
