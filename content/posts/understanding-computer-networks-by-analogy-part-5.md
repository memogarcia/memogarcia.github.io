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

Theory is great, but you can only read about pneumatic tubes and hotel lobbies for so long before your eyes glaze over. 

We’ve spent four chapters drawing a map. We’ve talked about how IP addresses act as temporary room placards, how routers behave like concierges, and how TLS handshakes are essentially paranoid diplomatic ceremonies. But knowing how to read a map is useless if you don't know how to drive the car.

It is time to open the terminal. 

This chapter contains hands-on exercises you can run directly from your laptop right now. You aren't just going to read about it; you are going to physically watch a MAC address get discovered, trace a packet as it jumps between cities, and manually construct the two ends of a socket connection. 

You don't need a cloud account for the first section. We are going to rely entirely on the native, ancient tools built into every single operating system. 

Some of these commands will work perfectly on the first try. Others will inevitably hang, timeout, or fail because of a strict firewall on your corporate Wi-Fi or a weird router configuration in your apartment. When that happens, don’t immediately Google the error code. Lean on the mental model. Ask yourself: *Did the envelope even make it to the lobby? Did the concierge know the route? Is the bouncer actively rejecting me, or is the mail slot just glued shut?*

Let's do this.

---

### Lab 1: Ping and Traceroute (Following the Envelope)

We spent a lot of time talking about DNS acting as the city directory and routers acting as concierges. Let’s watch them actually do their jobs.

First, ask the directory for an address:
- **macOS / Linux:** `dig +short google.com`
- **Windows:** `nslookup google.com`

Instead of getting "Main Street, Building 12," the terminal spits out a raw IP address. You just did a DNS lookup. You found the coordinates.

Now, let's throw a basic envelope at that building to see if anyone is home:
- **macOS / Linux:** `ping -c 5 google.com`
- **Windows:** `ping -n 5 google.com`

`ping` literally just hurls an ICMP echo request (a very specific type of envelope) at the destination and waits for them to throw one back. The output shows you the exact round-trip time in milliseconds. If you see "Request timeout," it means the envelope got lost on the streets, or a firewall bouncer at the destination just threw it in the trash without telling you.

Finally, let's map the exact route the envelope took:
- **macOS:** `traceroute google.com`
- **Linux:** `traceroute -n google.com`
- **Windows:** `tracert google.com`

Every single line that prints out is a different router (concierge) touching your envelope. You are watching the packet jump from your local floor, to your ISP, to a major internet backbone, all the way to Google's front door. If you ever have a network outage, `traceroute` tells you exactly which concierge dropped the ball.

---

### Lab 2: Inspecting Your Own Blueprint

Before you can explore outside the building, you need to know what floor you are actually standing on and where your local elevator is. 

- **Linux:** Run `ip -4 addr show`. This shows your current IP address (your temporary room placard) and your subnet mask (the blueprint of the floor). Next, run `ip route` to find your "default gateway"—the exact IP address of the elevator lobby.
- **macOS:** Run `ipconfig getifaddr en0` to get your room number (you might need to try `en1` if you are on Wi-Fi). Then run `netstat -nr | grep default` to find the elevator lobby.
- **Windows:** Run `ipconfig /all`. This dumps everything at once: your IP, your subnet mask, your gateway, and the address of your local DNS server.

Write down your default gateway. If your computer ever needs to talk to an IP address that doesn't fit inside your local subnet mask, it blindly throws the packet at that exact gateway address, washes its hands of the problem, and hopes the router knows what to do.

---

### Lab 3: Watching ARP Shout Down the Hallway

In Part One, we established that your computer can't just slide an envelope under a door using an IP address; it needs the physical MAC address stamped into the metal doorknob. To find it, it steps into the hallway and screams an ARP request. 

Let's look at the notebook where your computer writes down the answers it hears.
- **Linux:** `ip neigh`
- **macOS / Windows:** `arp -a`

This prints out your ARP table. You will see a list of local IP addresses perfectly paired with MAC addresses (which look like `AA:BB:CC:11:22:33`). These are the door labels your computer already knows.

Let's force it to learn a new one. Find another device on your local Wi-Fi (like your phone's IP address) and ping it: `ping [phone-ip-address]`.

By running that command, your computer just shouted down the wireless hallway: *"Who has this IP? Tell me your MAC address right now!"* Your phone heard it and replied.

Run `arp -a` again. You should see a brand new entry in the notebook. This shouting match is constantly happening in the background of every network on earth; you just forced it to happen on command.

---

### Lab 4: Opening Your Own Mail Slot

In Chapter 6, we talked about ports acting as mail slots on a door. Port 80 is for regular web traffic, and Port 443 is for secure HTTPS traffic. Let's actually cut a new mail slot into your computer's door and watch traffic flow through it.

If you have Python installed, open your terminal and run this:
`python3 -m http.server 8000`

You just opened mail slot 8000 on your laptop and put a tiny Python web server there, sitting in a chair, waiting for envelopes. 

Now, open a *second* terminal window and send an envelope to that exact slot:
`curl http://127.0.0.1:8000`

The `curl` command writes an HTTP request, addresses it to `127.0.0.1` (the universal, undeniable IP address for "myself"), and shoves it into slot 8000. 

Notice what is happening here: because the destination is your own room, the envelope never actually enters the hallway. It never touches your physical Wi-Fi card or Ethernet port. It is the networking equivalent of passing a note from your left hand to your right hand. Your Python server receives it, processes it, and hands the HTML response right back. 

*Bonus:* Find your actual LAN IP address from Lab 2. Leave the Python server running, pick up your phone (connected to the same Wi-Fi), and type `http://[your-lan-ip]:8000` into your mobile browser. You just sent an envelope across the physical hallway of your house. 

---

### Lab 5: Observing the Two Ends of a Conversation

A TCP conversation always requires two mail slots: a permanent one on the server, and a temporary (ephemeral) one on your computer to receive the reply. Let's watch this happen in real time.

In your terminal, start a connection to a website that stays open for a second:
`curl -I https://google.com`

Right after you run that (or while it's running if you download a large file), we can inspect all the open mail slots on your machine.
- **Linux:** `ss -tnp | head`
- **macOS:** `netstat -anp tcp | head`
- **Windows:** `netstat -ano | find ":443"`

Look through the output for the connection to `google.com`. You will see two port numbers for that single connection:
1. **The Remote Port (443):** This is the permanent, well-known mail slot on Google's server reserved specifically for encrypted web traffic.
2. **The Local Port (e.g., 54321):** This is the temporary burner phone your operating system randomly assigned to `curl`. When the command finishes, the OS immediately destroys that slot so it can be reused. This is exactly how you can have fifty Chrome tabs open without the responses getting jumbled.

---

### Lab 6: Netcat (The Courier vs. The Paperboy)

In Chapter 7, we compared TCP (The Meticulous Courier) to UDP (The Reckless Paperboy). The `nc` (netcat) tool lets you experience the difference between these two protocols side by side. It is the duct tape of networking.

Open two terminal windows side by side. 

In the first window, open a **TCP** listener on port 9999:
`nc -l 9999`

In the second window, connect to it as a client:
`nc 127.0.0.1 9999`

Type a message in the client window and hit Enter. It instantly appears in the server window. This is TCP. The two windows performed a formal three-way handshake before you even typed a single character. They confirmed both parties were ready, and TCP is mathematically guaranteeing that your text is delivered. If you go to the server window and kill it (`Ctrl-C`), the client window immediately crashes because it knows the connection dropped.

Now, let's try **UDP**.
In the first window, start a UDP listener on port 9998:
`nc -u -l 9998`

In the second window, connect with UDP:
`nc -u 127.0.0.1 9998`

Type a message. It still appears on the other side, but notice there was no connection ceremony. It just showed up.

Here is the kicker: go to the first window (the server) and kill it with `Ctrl-C`. Now go back to the client window and keep typing messages. Hit enter. Type another one. Hit enter. 

The client will happily keep sending them into the absolute void, completely unaware that nobody is listening on the other side. UDP does not give a damn. It just throws the postcards out the window at forty miles an hour and keeps driving.

---

### Lab 7: Inspecting the Diplomatic Credentials

In Chapter 15, we talked about the TLS handshake, where a server presents a mathematical certificate to prove its identity before it agrees to invent a shared secret with your browser. 

Let's stop trusting the browser to hide this and demand to see those credentials ourselves. 

Run this command in your terminal:
`openssl s_client -connect google.com:443 -servername google.com -showcerts < /dev/null`

This command initiates a TLS connection, forces the server to hand over its passport, dumps the raw diplomatic credentials to your screen, and immediately hangs up. 

Look through the wall of text for these key pieces of data:
- **Subject:** This is who the certificate belongs to (the server claiming to be `google.com`).
- **Issuer:** This is the Certificate Authority (the trusted notary) that actually signed the document, legally vouching for the server. 
- **Validity:** The strict expiration dates. If you ever try to visit a website and your browser throws a massive, terrifying red warning screen, 99% of the time it is just because this exact validity period has expired, and the bouncer is doing their job.

---

### Lab 8: Timing the City Directory (DNS Caching)

Every new connection starts with a lookup in the city directory, and this takes actual, physical time. When a website feels "sluggish," it is often just a slow DNS server struggling to find the address.

Let's time a lookup:
`dig github.com`

Look at the bottom of the output for the `Query time`. It might be 40, 50, or even 100 milliseconds. That is how long it took your computer to ask your ISP's DNS server, wait for it to check the global root servers, and report back. 

Now run the exact same command again:
`dig github.com`

The `Query time` should plummet to 0 or 1 millisecond. Your operating system (or your local router) wrote the answer down in its local cache. It didn't even bother asking the internet. 

If you are ever diagnosing a weird network outage where some sites load perfectly and others just spin forever, manually swapping the DNS server is usually the fastest way to prove it is a directory problem, not a physical network break. You can force `dig` to ask Google's public directory instead of your default one:
`dig @8.8.8.8 github.com`

---

### Lab 9: Dissecting a Slow Connection

When a user complains that an API is slow, the backend developers immediately blame the network team, and the network team immediately blames the backend developers. It's a tale as old as time. To settle the argument, you need to know exactly where the time is being spent: the directory lookup, the TCP handshake, the TLS ceremony, or the actual server processing.

`curl` has an incredibly powerful, rarely-used feature for dissecting this exact timeline:

`curl -o /dev/null -s -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://google.com`

This command throws away the actual webpage payload (`-o /dev/null`) and instead prints out a cumulative timeline of the request in seconds.
- **dns:** How long it took to read the city directory.
- **connect:** When the physical TCP handshake finished.
- **tls:** When the cryptographic ceremony finished.
- **ttfb (Time To First Byte):** When the server finally got off its ass and handed back the very first piece of actual data. 

If `ttfb` is three seconds higher than `tls`, you can confidently march over to the backend team and tell them their database query is garbage. The network is fine. You can't fix what you can't measure.

---

### Lab 10: The Wiretap (tcpdump)

Every lab so far has been a static test. You throw an envelope and check the receipt. But a real network isn't static; it is a chaotic, flowing river of data. To actually see it, you need a wiretap. 

`tcpdump` is the ultimate tool for this. It grabs every single envelope flying past your network interface and rips off the header so you can read the routing info. 

*(Warning: this requires admin privileges and will immediately print a massive, terrifying wall of text. Hit `Ctrl-C` to make it stop).*

- **macOS / Linux:** `sudo tcpdump -i any -n`

You are looking at absolute chaos. ARP requests shouting into the void, background applications calling home to AWS, random broadcast packets from your smart TV. This is the background noise of the city.

You can filter the noise to only watch specific mail slots. Let's only watch DNS lookups:
`sudo tcpdump -i any -n port 53`

Open a new terminal tab and run `ping netflix.com`. Look back at the `tcpdump` window. You will see the exact millisecond the DNS request leaves your machine, and the exact millisecond the answer comes back. 

Being able to read `tcpdump` output is the difference between guessing why a connection is failing and knowing exactly which router dropped the ball.

---

## Conclusion: The Map and the Territory

We've come full circle. We started in a single room with a MAC address stamped on the doorknob. We walked down copper hallways, took the elevator gateway to different floors, and eventually stepped out into the chaotic city streets. We watched routers consult their BGP binders, saw UDP postcards get thrown out the window, and watched TLS diplomats invent secret languages. 

The goal of this book was never to make you a networking expert. Becoming an expert requires years of actively breaking things in production environments and reading dry RFC documentation until your eyes bleed. 

The goal was to give you an intuitive map. 

The next time you are sitting in a freezing server room, or staring at a staging environment that mysteriously dropped offline during a deployment, and `traceroute` starts spitting asterisks at you, you won't just see random terminal noise. 

When you see a "Connection Refused" error, you will know the packet made it to the building, but the bouncer actively turned it away. When you see a "Request Timeout," you will know the packet got lost on the streets. When you see a `/24` subnet mask, you will know exactly how big the floor is. 

The vocabulary of technology changes constantly. Cloud providers will invent new acronyms, Wi-Fi will get new standards, and service meshes will get exponentially more complicated. But underneath all of that marketing fluff, the physics of the city remain exactly the same. 

You still have to answer the same three questions:
- *Who am I talking to?* (IPs and Ports)
- *Which path am I taking?* (Routes and Gateways)
- *Who is allowed in?* (Firewalls and IAM)

You have the map. You know how the streets connect. Now go build something, and try not to break the ARP tables.