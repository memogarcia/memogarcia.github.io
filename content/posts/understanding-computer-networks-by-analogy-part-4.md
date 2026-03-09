---
title: "Understanding Computer Networks by Analogy: Part 4 - Advanced Architectures"
date: 2025-10-18T22:39:16+09:00
draft: true
---

> Networking at scale still comes back to the same questions: who is talking, which path is in use, and what rules shape the exchange.

License: CC BY-NC-ND 4.0

---

# Part Four: Advanced Architectures

The earlier parts gave you a stable map: rooms, floors, buildings, streets, towers, and gateways.

That map is still useful, but real systems add complications that do not fit neatly into straight hallways:

- wireless links where everyone shares the medium
- encrypted sessions where the useful data is hidden from the path
- service-to-service traffic that stays mostly inside the environment

This part is about those complications.

---

## Chapter 14: The Noisy Market Square

Wired Ethernet is easy to picture because each device usually has a dedicated link to a switch.

Wi-Fi is different. The medium is shared.

If the hallway analogy helped in Part One, think of this chapter as the point where the hallway opens into a crowded square. Devices are no longer taking turns on private tubes. They are competing for time on shared radio space.

### Taking turns to speak

On old shared Ethernet, collisions were a direct problem. Modern switched Ethernet mostly avoids that because each device gets its own link.

Wi-Fi cannot rely on the same model. Radios contend for a shared channel, and devices have to be careful about when they transmit.

That is why Wi-Fi uses **CSMA/CA**: Carrier Sense Multiple Access with Collision Avoidance.

The basic idea is:

1. Listen before transmitting.
2. If the medium is busy, wait.
3. Retry after a randomized delay.

This does not eliminate contention. It manages it.

### Channels, bands, and interference

Not all Wi-Fi pain is caused by weak signal. Much of it is caused by competition and noise.

- The **2.4 GHz band** travels well through walls but has less clean channel space and more interference sources.
- The **5 GHz band** offers more spectrum and often less interference, but range is usually shorter.
- The **6 GHz band** offers even more room, with newer standards such as Wi-Fi 6E and Wi-Fi 7, but device support and range constraints matter.

If performance drops in a conference room full of laptops, the likely story is not "the ISP got worse at noon." It is often local contention on the shared medium.

### Signal-to-noise ratio

You can have a strong signal and still have miserable Wi-Fi.

The radio does not care only about strength. It also cares about how much noise it has to fight. That is where **SNR**, the signal-to-noise ratio, matters:

- high signal + low noise = cleaner communication
- high signal + high noise = lots of retransmission and lower real throughput

That is why a laptop can show several bars and still stutter through a call.

### One common complaint

If one conference room falls apart at 1 PM while the hallway works fine, do not jump straight to DNS, routers, or cloud infrastructure. Start locally:

- channel congestion
- poor SNR
- overlapping access points
- physical obstruction

The problem may be a few meters from the user, not a dozen hops away.

### Where the analogy bends

Market squares do not capture hidden-node problems, roaming behavior, rate adaptation, MIMO, retransmission logic, or controller behavior. Keep the square picture for contention and shared medium, not for the full radio stack.

---

## Chapter 15: The Diplomatic Ceremony

So far we have mostly talked about where packets go.

Now we need to talk about who can read them.

On an unencrypted path, devices on the path can inspect the payload. On a modern network, that is rarely acceptable for web traffic, APIs, authentication flows, or internal service calls carrying sensitive data.

That is where **TLS** comes in.

### Before the envelope opens

TLS has two jobs before the application starts talking:

1. Authenticate the server you are talking to.
2. Establish keys so the session can be encrypted in transit.

The handshake is a setup phase, not the application data itself.

### The certificate step

When your client connects to `example.com`, the server presents a certificate.

The client validates:

- whether the certificate name matches the host it intended to reach
- whether the certificate is still valid
- whether it chains back to a trusted certificate authority

If that validation fails, a well-behaved client warns or aborts. The warning is irritating when you are in a hurry, but it is doing real work: the client is refusing to trust the wrong identity.

### The key exchange step

Modern TLS also establishes shared session keys using ephemeral key exchange. In practice, this often means ECDHE-based exchange in TLS 1.2 or TLS 1.3.

You do not need the math for a first pass. Hold on to the shape of it:

- both sides participate in creating a temporary session secret
- the secret is not the same as the server's long-term certificate key
- old sessions are harder to decrypt later because the session keys are temporary

That is the intuition behind **forward secrecy**.

### Internal traffic matters too

Private does not always mean trusted.

Inside a cloud environment, traffic may stay on the provider backbone, but that does not mean every internal hop deserves blind trust. Compliance rules, multi-tenant systems, east-west traffic, and simple caution often push teams toward encrypting internal traffic too.

### A realistic failure case

If HTTPS suddenly stops working on a service that worked yesterday, do not stop at the phrase "TLS issue." Look for the ordinary break first:

- expired certificate
- hostname mismatch
- missing intermediate certificate
- unsupported cipher/protocol combination
- wrong system time on the client

Those failures land in the same bucket on an incident call, but they are different repairs.

### Where the analogy bends

Diplomatic ceremony is useful for the trust-establishment part, but TLS is mathematics and protocol state, not an exchange of paper passports in a lobby. Use the analogy to remember the goals: identity verification and encrypted session setup.

---

## Chapter 16: Personal Ushers in the Hallways

In a microservices system, most traffic is not coming from the public internet. It is service-to-service traffic inside the environment.

That changes the operational burden.

You still need routing, retries, observability, policy, and encryption, but now those concerns repeat across dozens or hundreds of internal calls.

One answer to that problem is a **service mesh**.

### A proxy at every door

In the classic sidecar model, each service gets a companion proxy beside it. The application hands the envelope to the local proxy first. The proxy applies traffic policy, handles mutual TLS, gathers telemetry, and forwards the request to the next destination.

That arrangement can centralize cross-cutting concerns that would otherwise be reimplemented in each service.

### Why teams bother

A mesh can help with:

- **mTLS** between services
- retries and timeouts
- traffic shifting during rollout
- circuit breaking
- uniform telemetry

Those are real advantages when a platform team is trying to create consistent network behavior across many services owned by different teams.

### What it costs

A mesh buys consistency by adding more moving parts. You get another control plane, more proxies, more certificates, and more ways for a healthy application to look broken.

If you run a small system, a service mesh may be unnecessary.

If you run a large multi-team platform, the consistency benefits may outweigh the cost.

### A note on changing implementations

The sidecar picture is still the easiest place to start, but it is not the only implementation model. Some meshes now move parts of the data plane or policy model out of the sidecar pattern. Keep the concept separate from one specific product design.

### A failure case worth remembering

If service A cannot reach service B in a mesh-enabled environment, the cause might be:

- DNS or service discovery failure
- mesh policy denial
- certificate rotation issue
- timeout or retry behavior hiding the real latency source
- the target service being healthy enough to answer probes but not real requests

When service A cannot reach service B in a mesh, the labels are newer but the work is familiar. You still ask where the path stops, which rule says no, and whether the target is actually answering real traffic.

### Where the analogy bends

No human usher is renegotiating certificates and exporting metrics between rooms. Keep the usher picture for one narrow point: some of the network behavior now lives beside the application, not inside it.

The map is sturdy enough now. The next part is where you watch it move on a real machine.
