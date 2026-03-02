---
title: "Understanding Computer Networks by Analogy: Part 4 - Advanced Architectures"
date: 2025-10-18T22:39:16+09:00
draft: true
---

> Networking at scale looks complex, but it still comes down to the same questions: who am I talking to, which path am I using, and what are the rules of the conversation?

License: CC BY-NC-ND 4.0

---

# Part Four: Advanced Architectures

## From Hotel Halls to Open Air

So you've designed your cloud hotel tower. You have public and private floors, carefully controlled doors to the outside world, and a badge system that would make any security consultant proud. Your applications are running, your databases are secure, your infrastructure is humming along.

Here's the thing, though: I once thought that was enough. I sat in one of those conference rooms with the terrible coffee, watching a junior engineer struggle with three problems that our beautiful cloud architecture hadn't solved.

The first problem was the sales team complaining about spotty Wi-Fi in the conference rooms. We had perfect isolation in our cloud, but the physical world doesn't play by those rules. When everyone's shouting over the same air, your carefully planned network turns into a noisy market square.

The second was our security team asking why we were sending plain text through the public internet, even inside our VPC. "But it's inside our private floor!" I protested. They just raised their eyebrows. In a shared hotel, you learn to lock your doors even when you're "home."

The third was the microservices architecture we were building. Services calling services calling services, all inside our private wings. The old hallway model broke down completely - we couldn't put a concierge at every door, and even if we could, the concierge's binder would be too thick to lift.

Part Four is about these advanced realities: wireless networks where everyone shares the same air, encryption that protects conversations moving through public spaces, and service meshes that bring order to the chaos of hundreds of internal conversations. The hotel is still the hotel, but these are the problems you discover after you've been living there for a while.

---

## Chapter 14: The Noisy Wireless Market

Remember our building hallways? The ones with Ethernet cables running through them, each conversation getting its own private pathway? The ones our cloud hotel replicated with virtual networks and isolated subnets?

Wireless changes all of that.

When your laptop connects over Wi-Fi, there's no dedicated hallway between you and the access point. The hallway is made of air. And everyone in range shares that air: your laptop, your phone, your neighbor's smart TV, the baby monitor upstairs, the Bluetooth headphones across the room.

It's less like a private corridor and more like a crowded market square. Dozens of conversations happening simultaneously. Vendors shouting over each other. The challenge isn't routing. The challenge is being heard.

### Taking Turns

Wired Ethernet can detect collisions on the cable. If two devices transmit simultaneously, they notice the garbled signal, back off for a random interval, and retry. This works because each device can listen to the cable while transmitting.

Wi-Fi can't do that. Your radio can't listen while it's transmitting. By the time you'd detect a collision, you've already finished your transmission.

So Wi-Fi avoids collisions instead of detecting them. The protocol is called CSMA/CA, Carrier Sense Multiple Access with Collision Avoidance. Before transmitting, your device listens to the air. If it's quiet, the device waits a random short interval (in case someone else is about to speak), then transmits. If the air is busy, it waits until it's quiet and tries again.

Think of it like trying to order coffee at that noisy market. You don't immediately start shouting your order. If the market has been perfectly quiet for a moment, you speak right away. But if people were already talking, or if someone else tries to speak at the exact same moment you do, you wait a random short interval before trying again.

This works well enough when the market isn't crowded. As more devices compete for airtime, the waiting increases, and effective throughput drops even though the theoretical bandwidth hasn't changed.

### Bands and Channels

The air isn't one giant space. It's divided into frequency bands, and those bands are subdivided into channels.

The 2.4 GHz band has been used for decades. It penetrates walls well and has long range, but it only has three non-overlapping channels, and countless devices use it: old Wi-Fi networks, Bluetooth, microwaves, cordless phones.

The 5 GHz band offers more channels and less congestion, but shorter range and worse wall penetration. If you're close to the access point, 5 GHz is usually better.

The 6 GHz band is the newest option, available with Wi-Fi 6E and later. It offers even more channels and very little interference (for now), at the cost of even shorter range and the need for compatible hardware.

Choosing the right channel is like choosing a quieter corner of the market. It doesn't make the crowds go away, but it reduces the chance of talking over someone else.

### Signal and Noise

A strong signal doesn't guarantee good performance. What matters is signal compared to noise.

If the access point's signal is loud and the background is quiet, you have a high signal-to-noise ratio. Communication is clear. Data rates are high. Retransmissions are rare.

If the access point's signal is loud but the background is also loud, you have a lower SNR. Your device has to repeat itself more often. Throughput drops. Latency becomes unpredictable.

When Wi-Fi feels slow or unstable, it's often an SNR problem. Moving closer to the access point helps. Choosing a less congested channel helps. Eliminating interference sources helps.

### A Technical Sidebar: Wi-Fi Standards and Evolution

Wi-Fi standards have evolved dramatically. 802.11b, from 1999, offered 11 Mbps. 802.11g increased that to 54 Mbps. 802.11n introduced MIMO (Multiple Input Multiple Output), using multiple antennas to send multiple data streams simultaneously. 802.11ac pushed speeds into the gigabit range. 802.11ax (Wi-Fi 6) improved efficiency in crowded environments. 802.11be (Wi-Fi 7) promises even higher speeds and lower latency.

Each generation maintains backward compatibility. Your Wi-Fi 7 laptop can connect to a Wi-Fi 4 access point, though it will operate at the older standard's capabilities. This gradual evolution is why Wi-Fi has remained ubiquitous despite dramatic changes in how we use it.

---

## Chapter 15: The Diplomatic Ceremony

Back in the city, your envelopes travel through public streets where anyone could intercept them. The contents are exposed unless you take steps to protect them.

Inside your cloud hotel, you might think you're safe. After all, it's your private floor. But here's a lesson I learned the hard way: in a shared building, you lock your doors even inside your own apartment. And when your messages leave your floor - whether to another hotel in another city or just to the hotel's shared services - they're traveling through public hallways.

On the modern web, protection happens automatically. When you connect to a site using HTTPS, your browser and the server perform a ceremony called the TLS handshake. This ceremony establishes two things: the server's identity and a shared secret for encrypting everything that follows.

### The Handshake

The ceremony begins with introductions. Your browser sends a ClientHello, announcing itself and listing the encryption methods it understands. The server responds with a ServerHello, selecting a method both sides support.

Next, the server presents its credentials. It sends a certificate that says "I am example.com, and here is my public key." The certificate is signed by a Certificate Authority, a trusted third party that vouches for the server's identity.

Your browser checks this certificate. Is it signed by a CA that your operating system trusts? Does the name on the certificate match the site you requested? Has the certificate expired? If anything looks wrong, the browser shows a warning. If everything checks out, the ceremony continues.

Now both sides need to agree on a shared secret for this specific session. They use a key exchange protocol, typically based on Ephemeral Diffie-Hellman (ECDHE). Each side generates completely new, temporary private and public values for this one conversation. They exchange the public values and independently derive the same shared secret. When the connection ends, these keys are permanently discarded. An eavesdropper who sees the exchange cannot compute the secret. This property is called forward secrecy: because the keys are thrown away after each session, even if someone steals the server's main private key later, they cannot decrypt past conversations.

With the shared secret established, both sides switch to encrypted communication. Every byte that follows is protected.

### Why It Matters

TLS provides confidentiality (nobody can read the contents), integrity (nobody can modify the contents without detection), and authentication (you know who you're talking to).

This applies not just to web browsing but to any service that uses TLS: email, APIs, database connections. Inside your cloud VPC, you can use TLS for internal traffic too, ensuring that even if someone gains access to your network, they can't easily eavesdrop on sensitive communications.

I learned this lesson during a security audit where they demonstrated intercepting unencrypted database queries. The data never left our VPC, but in a shared environment, "private" is a matter of degrees. Now we encrypt everything, even inside our hotel.

### A Technical Sidebar: Certificates and CAs

A certificate contains the domain name, the public key, the signature of the CA, and metadata like expiration date. The CA's signature proves that the CA verified ownership of the domain when the certificate was issued.

Certificate chains may involve multiple levels. A server certificate might be signed by an intermediate CA, which is signed by a root CA. Your browser trusts the root CA, and that trust extends down the chain.

Modern TLS versions (1.2 and 1.3) negotiate cipher suites that determine exactly which algorithms are used for key exchange, encryption, and message authentication. TLS 1.3 simplified this process and removed support for older, weaker options. The entire handshake in TLS 1.3 can complete in a single round trip, making connections noticeably faster.

---

## Chapter 16: Personal Ushers in the Hallways

Your cloud floor now has guards at the entrance (gateways), guards at each door (security groups), and badges that control permissions (IAM). These protect the perimeter and the doors. You've added TLS to protect messages moving through public spaces.

But in a modern application, most traffic isn't coming from outside. It's room to room. Your authentication service calls the user service. The user service calls the database. The API gateway calls a dozen backend services. Hundreds of internal conversations happen for every external request.

How do you secure and manage all of that internal traffic?

One answer is the service mesh.

Remember our concierges from Part Two? The ones with binders who managed traffic between buildings in the city? The service mesh is like that, but evolved for the cloud hotel. Instead of one concierge per building, imagine assigning a personal usher to stand outside every room on your floor.

The people inside the rooms never deal with the hallways directly. When they want to send a message to another room, they hand it to their usher. The usher handles everything: finding the right destination, encrypting the communication, retrying if something fails, logging what happened.

This usher is a sidecar proxy. The collection of ushers plus a central coordinator is a service mesh.

### What the Ushers Handle

Sidecar proxies provide several capabilities without requiring changes to application code.

Security comes through mutual TLS. The ushers at both ends present certificates to each other, verifying that both sides are who they claim to be. This means traffic is encrypted and authenticated throughout your floor, not just at the entrance. Every conversation, even between services in the same private wing, gets the same protection as external traffic.

Traffic management comes through configuration. The ushers can split traffic between versions of a service for canary deployments. They can retry failed requests with exponential backoff. They can stop sending traffic to a misbehaving service (circuit breaking) and route around it. They can enforce rate limits. All of this happens without the services themselves knowing about it.

Observability comes automatically. Because every request passes through an usher, the mesh can collect metrics, logs, and traces without application developers instrumenting anything. You get a uniform view of who is talking to whom, how long it takes, and whether it succeeds. When something goes wrong at 2 AM, you can trace a specific request through all the services it touched.

### The Trade-offs

A service mesh adds complexity. It's another system to configure, monitor, and debug. The ushers add a small amount of latency to every request since traffic now passes through an extra hop. The control plane that coordinates the ushers is a critical dependency - if it fails, your ushers might not know where to send messages.

For small systems with a handful of services, a mesh might be overkill. You can handle security and observability at the application level. For large systems with dozens or hundreds of services owned by different teams, a mesh can dramatically simplify networking concerns. It moves security and observability from individual applications to shared infrastructure.

I've seen both sides. At a previous company, we started without a mesh and spent months adding TLS and metrics to each service individually. When we finally adopted a mesh, we deleted hundreds of lines of boilerplate code and got better observability overnight. The complexity was worth it - but only because we had enough services to justify it.

The key is knowing when the trade-off makes sense. Like most architectural decisions, there isn't a universal right answer, only answers that fit your particular situation.

### A Technical Sidebar: Popular Service Meshes

Istio is the most well-known service mesh, built on Envoy proxies. It provides extensive traffic management, security, and observability features. The learning curve is steep, but the capabilities are comprehensive.

Linkerd takes a different approach, focusing on simplicity and performance. It's designed to be easier to operate with lower resource overhead. The trade-off is fewer advanced features.

AWS App Mesh provides a managed mesh experience for AWS environments. It integrates with other AWS services and offloads the operational burden to Amazon. The trade-off is vendor lock-in.

Each mesh uses the same basic pattern: sidecar proxies intercept all traffic, a control plane configures the proxies, and you get uniform security and observability across your services.

---

---

You now understand the advanced layers: wireless networks and their shared airspace, TLS and its cryptographic ceremonies, service meshes and their personal ushers.

The hotel metaphor still holds, but you've learned that hotels have noisy public spaces where wireless signals compete for attention. You've learned that even inside your private floor, you need encryption for sensitive conversations. And you've learned that when you have hundreds of services talking to each other, you need a more sophisticated system than individual concierges with binders.

The theory is complete. Part Five puts it all into practice with hands-on labs where you'll configure actual networks, implement TLS, and explore a service mesh firsthand.