---
title: "Understanding Computer Networks by Analogy: Part 5 - Follow the Envelope: Labs & Mini Exercises"
date: 2025-10-20T09:00:00-07:00
draft: false
---

# Chapter 5: Follow the Envelope: Labs & Mini Exercises

![Chapter 5 illustration](/img/networks-by-analogy/img.png)

Welcome to the hands-on portion of our journey. In the previous chapters, we've built a model of how networks operate using our building and city analogy. Now, it's time to get our hands dirty and see these concepts in action. It’s time to see if our theoretical building can stand on its own two feet, architecturally speaking. (Pun intended!)

Each lab is designed to reinforce the analogy we've been exploring, focusing on the core principles of:

**Address · Path · Permission**

Keep these labs, approach them with curiosity, and don't be afraid to experiment.

---

## Core Labs (Local Experiments)

### Lab 01: Follow the Envelope with `ping` and `traceroute`
**Time:** 15–20 min
**Difficulty:** Easy
**Analogy:** You send an envelope from your room and track its journey through concierges across the city.

**Tools:** Terminal or PowerShell

**Steps**
1. Resolve the name:
   - macOS/Linux: `dig +short example.com`
   - Windows: `nslookup example.com`
2. Check reachability:
   - macOS/Linux: `ping -c 5 example.com`
   - Windows: `ping -n 5 example.com`
3. Map the path:
   - macOS: `traceroute example.com`
   - Linux: `traceroute -n example.com`
   - Windows: `tracert example.com`

**Expected:**
- Low loss and stable latency.
- Several hops between your router and the destination.

**Why it matters:**
You just saw Address (DNS), Path (routers), Permission (ICMP policy).

---

### Lab 02: DNS Cache vs No-Cache with `dig`
**Time:** 10–15 min
**Difficulty:** Easy
**Analogy:** Ask the directory before you wander.

**Steps**
1. Cached lookup: `dig example.com`
2. Check the TTL in the `ANSWER` section.
3. Authority walk: `dig +trace example.com`
4. No cache: `dig +nocache example.com`
5. Compare query times.

**Expected:** Cached queries are faster.
**Why it matters:** Directories speed repeat trips and reduce city traffic.

---

### Lab 03: Who Has That Door? Meet ARP / Neighbor Discovery
**Time:** 10–15 min
**Difficulty:** Easy
**Analogy:** Find the door tag before you deliver.

**Steps**
1. Find your gateway IP:
   - Linux: `ip route | grep default`
   - macOS: `route -n get default | grep gateway`
   - Windows: `ipconfig`
2. See the door tags (MACs):
   - Linux: `ip neigh`
   - macOS/Windows: `arp -a`
3. Ping another LAN device, then re-run the table.

**Expected:** You see IP-to-MAC mappings appear.
**Why it matters:** Same floor talk needs the door tag.

---

### Lab 04: Meet Your Leasing Desk by Inspecting DHCP Details
**Time:** 10–15 min
**Difficulty:** Easy
**Analogy:** The front desk assigns room numbers and DNS.

**Steps**
1. Show your IP and mask:
   - Linux: `ip -4 addr show`
   - macOS: `ipconfig getifaddr en0`
   - Windows: `ipconfig /all`
2. Show gateway and DNS:
   - Linux: `ip route; cat /etc/resolv.conf`
   - Windows: `ipconfig /all`
3. Renew lease (optional):
   - Linux: `sudo dhclient -r && sudo dhclient`
   - Windows: `ipconfig /release` then `ipconfig /renew`

**Expected:** Your lease includes IP, mask, gateway, and DNS.
**Why it matters:** Without a lease, your room has no number.

---

### Lab 05: Ports and Sockets with a Tiny Web Server
**Time:** 10–20 min
**Difficulty:** Easy
**Analogy:** Mail slots on the door.

**Steps**
1. Start a server: `python3 -m http.server 8000`
2. Test locally: `curl http://127.0.0.1:8000`
3. Find your LAN IP:
   - Linux: `hostname -I`
   - macOS: `ipconfig getifaddr en0`
   - Windows: `ipconfig`
4. From another device: open `http://<your-ip>:8000`.

**Expected:** Local site loads; other devices can connect if allowed.
**Why it matters:** Each door slot (port) leads to a specific service.

---

### Lab 06: Ephemeral Ports in Action
**Time:** 10–15 min
**Difficulty:** Easy
**Analogy:** Temporary mailbox numbers for each conversation.

**Steps**
1. Request a page: `curl -I https://example.com`
2. List sockets:
   - Linux: `ss -tnp | head`
   - macOS: `netstat -anp tcp | head`
   - Windows: `netstat -ano | find ":443"`

**Expected:** A random high-number port is used on your side.
**Why it matters:** Replies reach the exact app that started them.

---

### Lab 07: MTU and Path MTU Discovery
**Time:** 10–20 min
**Difficulty:** Medium
**Analogy:** Oversized crate vs hallway height.

**Steps**
- Linux:
  ```bash
  ping -c 1 -M do -s 1472 example.com
  ```
  Reduce `-s` until it succeeds.
- Windows:
  ```powershell
  ping -f -l 1472 example.com
  ```
  Lower `-l` until success.

**Expected:** The largest successful payload defines your path MTU.
**Why it matters:** Right-sizing the crate avoids breakage.

---

### Lab 08: TCP vs UDP with Netcat
**Time:** 15–20 min
**Difficulty:** Medium
**Analogy:** Registered mail vs postcards.

**Steps**
1. TCP listener: `nc -l 9999`
2. TCP sender: `nc 127.0.0.1 9999` and type a message.
3. UDP listener: `nc -u -l 9998`
4. UDP sender: `nc -u 127.0.0.1 9998`

**Expected:** TCP delivers reliably, UDP does not.
**Why it matters:** Choose the right etiquette for the job.

---

### Lab 09: Wi-Fi Reality Check for Channels and Noise
**Time:** 10–20 min
**Difficulty:** Easy
**Analogy:** Conversations in a crowded square.

**Steps**
- macOS:
  ```bash
  /System/Library/.../airport -s
  ```
- Linux: `nmcli dev wifi list`
- Windows: `netsh wlan show networks mode=bssid`

1. Note SSIDs, channels, and signal.
2. Count how many share your channel.
3. Move closer to the router and compare signal.

**Expected:** Busy channels show more contention.
**Why it matters:** Air is a shared medium with etiquette.

---

### Lab 10: Peek at the TLS Chain with OpenSSL
**Time:** 10–15 min
**Difficulty:** Medium
**Analogy:** Diplomatic credential check.

**Steps**
```bash
openssl s_client -connect example.com:443 -servername example.com -showcerts < /dev/null
```

**Observe:**
- Subject (site name)
- Issuer (Certificate Authority)
- Certificate chain

**Expected:** Valid chain and matching hostname.
**Why it matters:** Identity comes first, then encryption.

---

### Lab 11: Try HTTP/3 over QUIC
**Time:** 10–15 min
**Difficulty:** Medium
**Analogy:** Faster talk in a noisy square.

**Steps**
```bash
curl -I https://example.com
curl --http3 -I https://example.com
```

**Expected:** Some sites respond with `HTTP/3` in headers.
**Why it matters:** QUIC reduces head-of-line blocking.

---

### Lab 12: Round-Robin DNS as Load Balancing
**Time:** 10 min
**Difficulty:** Easy
**Analogy:** One address, many concierges.

**Steps**
```bash
dig +short a www.google.com
```
Repeat a few times and note multiple IPs.

**Expected:** Several addresses rotate per query.
**Why it matters:** DNS spreads guests across entrances.

---

### Lab 13: NAT in the Wild with One Public Face
**Time:** 5–10 min
**Difficulty:** Easy
**Analogy:** Mail forwarding at the building exit.

**Steps**
```bash
curl -s https://api.ipify.org
```
Run on two devices on the same network.

**Expected:** Both show the same public IP.
**Why it matters:** NAT rewrites return addresses at the exit.

---

### Lab 14: Measure the Trip with Curl Timings
**Time:** 10–15 min
**Difficulty:** Easy
**Analogy:** Concierge logbook of each delivery.

**Steps**
```bash
curl -o /dev/null -s -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://example.com
```

**Expected:** Breakdown of total time by phase.
**Why it matters:** Observability starts with simple timing.

---

### Lab 15: Mini Troubleshooting Loop
**Time:** 15–20 min
**Difficulty:** Easy
**Analogy:** Follow the envelope boundary by boundary.

**Scenario:** A website doesn’t load.

**Steps**
1. Address: DNS ok? `dig example.com`
2. Path: Local OK? `ping <gateway>`
3. Outside OK? `traceroute 1.1.1.1`
4. Permission: TLS or HTTP? `curl -I https://example.com`
5. Swap DNS: `dig @1.1.1.1 example.com`

**Expected:** You identify which boundary failed.
**Why it matters:** Address, Path, Permission always guide you.

---

## Cloud Track (Optional, Vendor-Neutral)

### Cloud Lab A: Build a Three-Wing VPC Floor Plan
**Time:** 30–45 min
**Difficulty:** Medium
**Analogy:** Design your own private floor in the hotel.

**Goal:** Create a VPC with Public, Private-App, and Private-DB subnets.

**Steps**
1. Create a VPC (e.g., `10.0.0.0/16`).
2. Add subnets: Public (`10.0.1.0/24`), App (`10.0.2.0/24`), DB (`10.0.3.0/24`).
3. Attach an Internet Gateway.
4. Route tables: Public → IGW, Private → NAT.
5. Security Groups:
   - Web: allow 80/443 from Internet.
   - App: allow 80 from Web subnet.
   - DB: allow 3306 from App only.

**Expected:** Public reachable, Private internal only.

---

### Cloud Lab B: NAT Gateway as an Outbound-Only Staff Door
**Time:** 20–30 min
**Difficulty:** Medium
**Analogy:** The monitored back exit.

**Steps**
1. Deploy NAT Gateway in Public subnet.
2. Update Private subnet route: default route to NAT.
3. Test outbound with `curl https://example.com`.
4. Confirm inbound from Internet fails.

**Expected:** Outbound works, inbound blocked.

---

### Cloud Lab C: VPC Endpoint to Keep Traffic Off the Street
**Time:** 15–25 min
**Difficulty:** Medium
**Analogy:** Private service door to hotel amenities.

**Steps**
1. Add a Gateway-type endpoint (for S3 or storage).
2. Update route table to send service traffic through it.
3. Access the service from a private instance.
4. Confirm no Internet egress in flow logs.

**Expected:** Private traffic path stays inside hotel walls.

---

### Cloud Lab D: Security Group vs NACL, Who Blocked It?
**Time:** 20–30 min
**Difficulty:** Medium
**Analogy:** Door guard vs hallway rule.

**Steps**
1. SG allows inbound 80 to instance.
2. NACL blocks ephemeral return ports.
3. Try web access; it fails.
4. Remove the block; it works.

**Expected:** SG is stateful, NACL is not.
**Why it matters:** Understand which guard said no.

---

### Cloud Lab E: Flow Logs to Find the Drop
**Time:** 20–30 min
**Difficulty:** Medium
**Analogy:** Review the hallway cameras.

**Steps**
1. Enable flow logs for the subnet.
2. Trigger a failed connection.
3. Filter by instance IP/port in logs.
4. Note `ACCEPT` or `REJECT`.
5. Identify which layer denied traffic.

**Expected:** You can pinpoint the blocked boundary.

---

## Teaching Tips

- Keep each lab to one printed page so a learner can glance at the whole journey.
- Close every exercise with a **In a Nutshell** recap or reflection line.
- Repeat the mantra **Address · Path · Permission** until it becomes second nature.
- Use callbacks to earlier analogies ("remember the elevator?") so readers connect new facts to familiar images.
- Adjust firewalls and guardrails minimally; never ask students to disable everything.

---

Let’s keep following the envelope (pun intended).
