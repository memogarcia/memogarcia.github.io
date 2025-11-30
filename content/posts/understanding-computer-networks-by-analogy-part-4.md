---
title: "Understanding Computer Networks by Analogy: Part 4 - Advanced Architectures"
date: 2025-10-18T22:39:16+09:00
draft: false
---

> Networking at scale looks complex, but it still comes down to the same questions: who am I talking to, which path am I using, and what are the rules of the conversation?

License: CC BY-NC-ND 4.0

---

# Part Four: Advanced Architectures

## Chapter 14: The Noisy Wireless Market

Most of what we've discussed assumes an orderly world. Cables run between switches. Routers forward packets according to their tables. Everything has a place.

Wireless changes that.

When your laptop connects over Wi-Fi, there's no dedicated hallway between you and the access point. The hallway is made of air. And everyone in range shares that air: your laptop, your phone, your neighbor's smart TV, the baby monitor upstairs, the bluetooth headphones across the room.

It's less like a private corridor and more like a crowded market square. Dozens of conversations happening simultaneously. Vendors shouting over each other. The challenge isn't routing. The challenge is being heard.

### Taking Turns

Wired Ethernet can detect collisions on the cable. If two devices transmit simultaneously, they notice the garbled signal, back off for a random interval, and retry. This works because each device can listen to the cable while transmitting.

Wi-Fi can't do that. Your radio can't listen while it's transmitting. By the time you'd detect a collision, you've already finished your transmission.

So Wi-Fi avoids collisions instead of detecting them. The protocol is called CSMA/CA, Carrier Sense Multiple Access with Collision Avoidance. Before transmitting, your device listens to the air. If it's quiet, the device waits a random short interval (in case someone else is about to speak), then transmits. If the air is busy, it waits until it's quiet and tries again.

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

---

## Chapter 15: The Diplomatic Ceremony

Back in the city, your envelopes travel through public streets where anyone could intercept them. The contents are exposed unless you take steps to protect them.

On the modern web, those steps happen automatically. When you connect to a site using HTTPS, your browser and the server perform a ceremony called the TLS handshake. This ceremony establishes two things: the server's identity and a shared secret for encrypting everything that follows.

### The Handshake

The ceremony begins with introductions. Your browser sends a ClientHello, announcing itself and listing the encryption methods it understands. The server responds with a ServerHello, selecting a method both sides support.

Next, the server presents its credentials. It sends a certificate that says "I am example.com, and here is my public key." The certificate is signed by a Certificate Authority, a trusted third party that vouches for the server's identity.

Your browser checks this certificate. Is it signed by a CA that your operating system trusts? Does the name on the certificate match the site you requested? Has the certificate expired? If anything looks wrong, the browser shows a warning. If everything checks out, the ceremony continues.

Now both sides need to agree on a shared secret for this specific session. They use a key exchange protocol, typically based on Diffie-Hellman. Each side generates some private and public values, they exchange the public values, and each side independently derives the same shared secret. An eavesdropper who sees the exchange cannot compute the secret. This property is called forward secrecy: even if someone steals the server's private key later, they cannot decrypt past conversations.

With the shared secret established, both sides switch to encrypted communication. Every byte that follows is protected.

### Why It Matters

TLS provides confidentiality (nobody can read the contents), integrity (nobody can modify the contents without detection), and authentication (you know who you're talking to).

This applies not just to web browsing but to any service that uses TLS: email, APIs, database connections. Inside your cloud VPC, you can use TLS for internal traffic too, ensuring that even if someone gains access to your network, they can't easily eavesdrop on sensitive communications.

### A Technical Sidebar: Certificates and CAs

A certificate contains the domain name, the public key, the signature of the CA, and metadata like expiration date. The CA's signature proves that the CA verified ownership of the domain when the certificate was issued.

Certificate chains may involve multiple levels. A server certificate might be signed by an intermediate CA, which is signed by a root CA. Your browser trusts the root CA, and that trust extends down the chain.

Modern TLS versions (1.2 and 1.3) negotiate cipher suites that determine exactly which algorithms are used for key exchange, encryption, and message authentication. TLS 1.3 simplified this process and removed support for older, weaker options.

---

## Chapter 16: Personal Ushers in the Hallways

Your cloud floor now has guards at the entrance (gateways), guards at each door (security groups), and badges that control permissions (IAM). These protect the perimeter and the doors.

But in a modern application, most traffic isn't coming from outside. It's room to room. Your authentication service calls the user service. The user service calls the database. The API gateway calls a dozen backend services. Hundreds of internal conversations happen for every external request.

How do you secure and manage all of that internal traffic?

One answer is the service mesh.

Imagine assigning a personal usher to stand outside every room on your floor. The people inside the rooms never deal with the hallways directly. When they want to send a message to another room, they hand it to their usher. The usher handles everything: finding the right destination, encrypting the communication, retrying if something fails, logging what happened.

This usher is a sidecar proxy. The collection of ushers plus a central coordinator is a service mesh.

### What the Ushers Handle

Sidecar proxies provide several capabilities without requiring changes to application code.

Security comes through mutual TLS. The ushers at both ends present certificates to each other, verifying that both sides are who they claim to be. This means traffic is encrypted and authenticated throughout your floor, not just at the entrance.

Traffic management comes through configuration. The ushers can split traffic between versions of a service for canary deployments. They can retry failed requests with exponential backoff. They can stop sending traffic to a misbehaving service (circuit breaking) and route around it. They can enforce rate limits.

Observability comes automatically. Because every request passes through an usher, the mesh can collect metrics, logs, and traces without application developers instrumenting anything. You get a uniform view of who is talking to whom, how long it takes, and whether it succeeds.

### The Trade-offs

A service mesh adds complexity. It's another system to configure, monitor, and debug. The ushers add a small amount of latency to every request since traffic now passes through an extra hop. The control plane that coordinates the ushers is a critical dependency.

For small systems with a handful of services, a mesh might be overkill. For large systems with dozens or hundreds of services owned by different teams, a mesh can dramatically simplify networking concerns. It moves security and observability from individual applications to shared infrastructure.

---

You now understand the advanced layers: wireless networks and their shared airspace, TLS and its cryptographic ceremonies, service meshes and their personal ushers.

The theory is complete. Part Five puts it all into practice with hands-on labs.
