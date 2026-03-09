---
title: "Understanding Computer Networks by Analogy: Part 5 - Follow the Envelope"
date: 2025-10-20T09:00:00-07:00
draft: true
---

> We have the map. Now we use real tools to test addresses, paths, ports, certificates, and packet flow.

License: CC BY-NC-ND 4.0

---

# Part Five: Follow the Envelope

Diagrams help until they do not.

Sooner or later you need to watch your own machine ask the City Directory for an address, choose a route, discover a MAC address, open a Mail Slot, and start sending envelopes. That is what this part is for.

These labs stay small on purpose. They are not trying to simulate a data center. They are here so you can watch the map move under your hands.

As you work through them, keep one rule in mind:

> Treat every command result as a clue, not a verdict.

A timeout proves less than people want it to. A working `ping` proves less than people want it to. Read each result for what it shows, and no more.

---

## Chapter 17: Hands-On Practice

### Lab 1: Ping and Traceroute

Start with a name, a path, and a basic reachability test.

First, ask DNS for an address:

- **macOS / Linux:** `dig +short google.com`
- **Windows:** `nslookup google.com`

You should get one or more IP addresses back. That tells you the directory step worked.

Now try a simple ICMP probe:

- **macOS / Linux:** `ping -c 5 google.com`
- **Windows:** `ping -n 5 google.com`

If replies come back, you have evidence that:

- DNS worked
- some path to the destination exists
- ICMP echo replies are allowed along that path

If replies do **not** come back, do not jump straight to "the host is down." Many systems de-prioritize or block ICMP. A timeout might mean filtering, packet loss, rate limiting, or lack of response from the target.

Now map the route as far as the network will let you:

- **macOS:** `traceroute google.com`
- **Linux:** `traceroute -n google.com`
- **Windows:** `tracert google.com`

`traceroute` shows which hops respond as TTL values increase. It often helps you see whether the failure is close to your machine, inside your ISP, or nearer the far side. It is not a perfect picture. Some routers stay silent. Some networks return asymmetric paths. Still, it is one of the fastest ways to turn "it does not work" into "the path seems to stop around here."

### Lab 2: Inspect Your Own Floor Plan

Before you troubleshoot a path, confirm your own addressing.

- **Linux:** `ip -4 addr show` and `ip route`
- **macOS:** `ipconfig getifaddr en0` and `netstat -nr | grep default`
- **Windows:** `ipconfig /all`

Write down:

- your IP address
- your subnet mask or prefix length
- your default gateway
- your DNS server

This is the local information your machine uses before it sends any packet. If those values are wrong, later commands will often fail in ways that look more mysterious than they are.

### Lab 3: Watch ARP Build the Local Map

Local IP traffic still needs local MAC addresses.

Inspect your current ARP or neighbor table:

- **Linux:** `ip neigh`
- **macOS / Windows:** `arp -a`

You should see local IP-to-MAC mappings. Those are cached answers to the question, "Which local door owns this IP?"

Now create fresh local traffic. Ping another device on your local network, such as your phone or another laptop:

```text
ping [device-ip]
```

Then inspect the table again. A new entry may appear.

That is useful because it separates two steps that people often blur together:

1. ARP resolves the local next-hop MAC address.
2. The actual IP packet is then sent.

Sometimes ARP succeeds even when the later application request fails. That distinction helps you narrow the problem.

### Lab 4: Open a Local Mail Slot

Start a simple web server on your own machine:

- **macOS / Linux:** `python3 -m http.server 8000`
- **Windows:** `py -m http.server 8000`

In another terminal, request it:

- **macOS / Linux:** `curl http://127.0.0.1:8000`
- **Windows:** `curl.exe http://127.0.0.1:8000`

This lab is small, but it teaches three useful ideas at once:

- port `8000` identifies the listening service
- `127.0.0.1` means "this host"
- loopback traffic does not need your physical Wi-Fi or Ethernet link

If you then visit the same server from your phone using your LAN IP, you change the story. The request now has to cross the local network and your firewall rules start to matter.

### Lab 5: Observe Both Ends of a Socket

Open a short-lived HTTPS connection:

- **macOS / Linux:** `curl -I https://google.com`
- **Windows:** `curl.exe -I https://google.com`

Then inspect active TCP sessions:

- **Linux:** `ss -tn | head`
- **macOS:** `netstat -anp tcp | head`
- **Windows:** `netstat -ano | findstr ":443"`

You are looking for one connection with two ports:

- a local ephemeral port
- a remote service port such as `443`

That is the fastest way to see that a connection is not "one port" but a pair of endpoints.

### Lab 6: Compare TCP and UDP with Netcat

Open two terminals.

Start a TCP listener:

```text
nc -l 9999
```

Connect from the second terminal:

```text
nc 127.0.0.1 9999
```

Type text. It should appear on the other side.

Now repeat with UDP:

```text
nc -u -l 9998
nc -u 127.0.0.1 9998
```

The visible difference is subtle until you break the listener. If you stop the TCP listener, the client usually notices because TCP tracks session state. If you stop the UDP listener, the client may continue sending without immediate feedback.

That is the lesson. UDP can be exactly the right choice, but the application must be prepared for a thinner transport contract.

### Lab 7: Inspect a TLS Certificate

Ask a server to show its certificate chain:

- **macOS / Linux:** `openssl s_client -connect google.com:443 -servername google.com -showcerts < /dev/null`
- **Windows:** `openssl s_client -connect google.com:443 -servername google.com -showcerts`

Look for:

- **Subject**
- **Issuer**
- **Validity**

This is a direct way to connect the TLS chapter to reality. Your browser does this work for you quietly. Here you can see the identity material yourself.

If a site fails in the browser with a certificate warning, these fields often explain why.

### Lab 8: Measure DNS Caching

Time two DNS queries in a row:

- **macOS / Linux:** `dig github.com`
- **Windows:** `Measure-Command { Resolve-DnsName github.com }`

Run the same command again.

If the recursive resolver already has the answer cached on the second run, the query time will often drop. It will not necessarily drop to zero, because you are still measuring the round-trip to the resolver itself.

If a resolver starts answering slowly, users rarely say "DNS is slow." They say the site feels sticky or the app hangs before it opens. That is one reason to time the lookup instead of assuming the problem starts at the server.

### Lab 9: Break Down a Slow HTTPS Request

Use `curl` to separate DNS time, TCP connection time, TLS setup, and time to first byte:

- **macOS / Linux:** `curl -o /dev/null -s -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://google.com`
- **Windows:** `curl.exe -o NUL -s -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://google.com`

Read the output carefully:

- `dns` suggests directory lookup time
- `connect` suggests how long TCP setup took
- `tls` suggests how long TLS setup added
- `ttfb` suggests how long until the server began responding

If `ttfb` is much larger than the earlier phases, the server or application path may be the slow part. If `dns` dominates, the resolver path deserves attention. Follow the biggest delay first. It will usually take you closer to the real problem than arguing in the abstract.

### Lab 10: Watch Traffic on the Wire

Use `tcpdump` to observe live traffic:

- **Linux:** `sudo tcpdump -i any -n`
- **macOS:** `sudo tcpdump -i en0 -n`
- **Windows:** use Wireshark or `pktmon`

This is one of the most useful networking tools you can learn, because it lets you answer questions such as:

- Are packets leaving my machine?
- Are replies coming back?
- Which protocol is in use?
- Which hosts and ports are active?

Try filtering to DNS:

- **Linux:** `sudo tcpdump -i any -n port 53`
- **macOS:** `sudo tcpdump -i en0 -n port 53`

Then trigger a lookup with `ping netflix.com` or `dig netflix.com`.

If the traffic is encrypted, `tcpdump` will still show you metadata such as addresses, ports, and handshake details, but not the application payload itself. That distinction is useful. Encryption does not make the path invisible. It changes which parts of the exchange remain readable on the wire.

---

## Conclusion: The Map and the Territory

You now have a map you can carry into a real incident: the room, the door, the floor, the elevator lobby, the concierge, the city directory, the tower.

When something fails, start smaller than the panic:

- Do I have the right address?
- Is the path available?
- Is the service listening?
- Is the identity or policy layer blocking me?

Those questions hold up on a home network, in a VPC, or in the middle of a bad rollout at 2 AM.

If this series worked, the network should feel less like magic and more like a place you can walk through.
