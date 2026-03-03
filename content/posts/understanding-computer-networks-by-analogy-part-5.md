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

Theory is great, but it only gets you so far. 

We’ve spent four chapters drawing a map. We’ve talked about how IP addresses act as apartment numbers, how routers behave like concierges, and how TLS handshakes are essentially secret diplomatic ceremonies in crowded rooms. But knowing how to read a map is very different from actually walking the streets. 

It is time to put the theory to work. 

This chapter contains hands-on exercises you can run directly from your own terminal. These are not abstract demonstrations. You are going to physically walk the digital hallways we’ve been discussing. You are going to watch MAC addresses get discovered in real-time, trace packets as they jump between cities, and manually construct the two ends of a socket connection. 

The first set of labs requires no cloud accounts or fancy software. They rely entirely on the native tools built into every modern operating system to show you exactly what is happening inside your own building.

Some of these commands will work perfectly on the first try. Others will inevitably fail or time out because of a strict firewall or a misconfigured router. When that happens, don’t panic. Lean on the mental model we’ve built. Ask yourself: *Did the envelope make it to the lobby? Did the concierge know the route? Is the mail slot on the door actually open?*

Let's open up a terminal.

---

### Lab 1: Ping and Traceroute (Following the Envelope)

We spent a lot of time talking about DNS acting as the city directory and routers acting as concierges. Let’s actually watch them work.

First, ask the directory for an address:
- **macOS / Linux:** `dig +short example.com`
- **Windows:** `nslookup example.com`

Instead of getting "Main Street, Building 12," the terminal spits out an IP address. You just did a DNS lookup. 

Now, let's send a basic envelope to that building to see if anyone is home:
- **macOS / Linux:** `ping -c 5 example.com`
- **Windows:** `ping -n 5 example.com`

`ping` literally just throws an envelope at the destination and waits for a reply. The output shows you the exact round-trip time in milliseconds. If you see "Request timeout," it means the envelope got lost on the streets or a firewall bouncer at the destination refused to let it in the door.

Finally, let's map the exact route the envelope took:
- **macOS:** `traceroute example.com`
- **Linux:** `traceroute -n example.com`
- **Windows:** `tracert example.com`

Every single line that prints out is a different router (concierge) touching your envelope. You are watching the packet jump from your local floor, to your ISP, to a major internet backbone, all the way to the destination. 

---

### Lab 2: Inspecting Your Own Blueprint

Before you can explore outside the building, you need to know what floor you are on and where your local elevator is. 

- **Linux:** Run `ip -4 addr show`. This shows your current IP address (your room number) and your subnet mask (the blueprint of the floor). Next, run `ip route` to find your "default gateway"—the exact IP address of the elevator lobby.
- **macOS:** Run `ipconfig getifaddr en0` to get your room number. Then run `netstat -nr | grep default` to find the elevator lobby.
- **Windows:** Run `ipconfig /all`. This dumps everything at once: your IP, your subnet mask, your gateway, and the address of your local DNS server.

Take note of your default gateway. If your computer ever needs to talk to an IP address that doesn't fit inside your local subnet mask, it blindly throws the packet at that gateway address and hopes the router knows what to do with it.

---

### Lab 3: Watching ARP Shout Down the Hallway

In Part One, we talked about how your computer can't just slide an envelope under a door using an IP address; it needs the physical MAC address stamped on the doorknob. To find it, it steps into the hallway and shouts an ARP request. 

Let's look at the notebook where your computer writes down the answers it hears.
- **Linux:** `ip neigh`
- **macOS / Windows:** `arp -a`

This prints out your ARP table. You will see a list of local IP addresses perfectly paired with MAC addresses (which look like `AA:BB:CC:11:22:33`). These are the door labels your computer already knows.

Let's force it to learn a new one. Find another device on your local Wi-Fi (like your phone's IP address) and ping it: `ping [phone-ip-address]`.

By running that command, your computer just shouted down the wireless hallway: "Who has this IP? Tell me your MAC address!" The phone heard it and replied.

Run `arp -a` again. You should see a brand new entry in the notebook. This shouting match is constantly happening in the background of every network on earth; you just forced it to happen on command.

---

### Lab 4: Opening Your Own Mail Slot

In Chapter 6, we talked about ports acting as mail slots on a door. Port 80 is for regular web traffic, and Port 443 is for secure HTTPS traffic. Let's actually open a mail slot on your machine and watch traffic flow through it.

If you have Python installed, open your terminal and run this:
`python3 -m http.server 8000`

You just cut a new mail slot (Port 8000) into your computer's door and put a little Python web server there to listen for envelopes. 

Now, open a *second* terminal window and send an envelope to that exact slot:
`curl http://127.0.0.1:8000`

The `curl` command writes an HTTP request, addresses it to `127.0.0.1` (the universal IP address for "myself"), and shoves it into slot 8000. 

Notice what is happening here: because the destination is your own room, the envelope never actually enters the hallway. It never touches your physical Wi-Fi card or Ethernet port. It is the network equivalent of sliding a note from your left hand to your right hand. Your Python server receives it, processes it, and hands the response back. 

*Bonus:* Find your actual LAN IP address from Lab 2. Leave the Python server running, pick up your phone (connected to the same Wi-Fi), and type `http://[your-lan-ip]:8000` into your mobile browser. You just sent an envelope across the physical hallway of your house. 

---

### Lab 5: Observing the Two Ends of a Conversation

A TCP conversation always requires two mail slots: one on the server, and a temporary (ephemeral) one on your computer to receive the reply. Let's watch this happen in real time.

In your terminal, start a slow connection to a website:
`curl -I https://example.com`

While that connection is running, we can inspect all the open mail slots on your machine.
- **Linux:** `ss -tnp | head`
- **macOS:** `netstat -anp tcp | head`
- **Windows:** `netstat -ano | find ":443"`

Look through the output for the connection to `example.com`. You will see two port numbers for that single connection:
1. **The Remote Port (443):** This is the permanent, well-known mail slot on the destination server reserved specifically for encrypted web traffic.
2. **The Local Port (e.g., 51234):** This is the temporary mail slot your operating system randomly assigned to `curl`. When the command finishes, the OS immediately destroys that slot so it can be reused. This is how you can have fifty browser tabs open without the responses getting mixed up.

---

### Lab 6: Netcat (Registered Mail vs. Postcards)

In Chapter 7, we compared TCP (Registered Mail) to UDP (Postcards). The `nc` (netcat) tool lets you experience the difference between these two protocols side by side.

Open two terminal windows side by side. 

In the first window, open a **TCP** listener on port 9999:
`nc -l 9999`

In the second window, connect to it as a client:
`nc 127.0.0.1 9999`

Type a message in the client window and hit Enter. It instantly appears in the server window. This is TCP. The two windows performed a three-way handshake before you even typed anything. They confirmed both parties were ready, and TCP is mathematically guaranteeing that your text is delivered. If you kill the server window (Ctrl-C), the client window immediately knows the connection dropped.

Now, let's try **UDP**.
In the first window, start a UDP listener on port 9998:
`nc -u -l 9998`

In the second window, connect with UDP:
`nc -u 127.0.0.1 9998`

Type a message. It still appears on the other side, but notice there was no connection ceremony. 

Here is the kicker: go to the first window (the server) and kill it with `Ctrl-C`. Now go back to the client window and keep typing messages. The client will happily keep sending them into the void, completely unaware that nobody is listening on the other side. UDP does not care. It just throws the postcards in the mailbox and moves on.

---

### Lab 7: Inspecting the Diplomatic Credentials

In Chapter 15, we talked about the TLS handshake, where a server presents a mathematical certificate to prove its identity before it agrees to invent a shared secret with your browser. 

Let's act like a browser and demand to see those credentials. 

Run this command in your terminal:
`openssl s_client -connect example.com:443 -servername example.com -showcerts < /dev/null`

This command initiates a TLS connection but immediately drops it, dumping the raw diplomatic credentials to your screen. 

Look through the output for these key pieces of data:
- **Subject:** This is who the certificate belongs to (the server claiming to be `example.com`).
- **Issuer:** This is the Certificate Authority (the trusted notary) that actually signed the document, vouching for the server. 
- **Validity:** The strict expiration dates. If you ever try to visit a website and your browser throws a massive red warning screen, it is usually because this exact validity period has expired, and the concierge refuses to let you into the building.
- **Public key**: The encryption key you'll use to send secure messages

You might see multiple certificates in the chain—the server's certificate, one or more intermediate certificates, and implicitly the root CA that your operating system trusts. This chain of trust works like a series of diplomatic introductions: "I trust the root CA, they trust the intermediate CA, and the intermediate CA trusts this server."

The `-servername` parameter sends the SNI (Server Name Indication) extension, which is crucial in our multi-tenant building analogy. Many servers host multiple websites on the same IP address (multiple diplomatic services in one building). SNI tells the server which credentials to present.

---

### Lab 8: Timing the City Directory (DNS)

Every new connection starts with a lookup in the city directory, and this takes actual, physical time. When a website feels "slow," it is often just a slow DNS server struggling to find the address.

Let's time a lookup:
`dig example.com`

Look at the bottom of the output for the `Query time`. It might be 40 or 50 milliseconds. That is how long it took your computer to ask your ISP's DNS server, wait for it to check the global root servers, and report back. 

Now run the exact same command again:
`dig example.com`

The `Query time` should plummet to 0 or 1 millisecond. Your operating system wrote the answer down in its local cache. It didn't even bother asking the network. 

You can force your computer to bypass the cache and ask a specific directory directly by adding `@` and an IP address. Let's ask Google's public DNS:
`dig @8.8.8.8 example.com`

If you are ever diagnosing a weird network outage where some sites load and others don't, manually swapping the DNS server like this is usually the fastest way to prove it is a directory problem, not a physical network break.

---

### Lab 9: Finding the Maximum Envelope Size (MTU)

Every hallway in our network city has a strict physical limit on how big an envelope can be. If you try to send something too large, the router has to pause, rip the data apart, stuff it into smaller envelopes, and send them separately. This causes massive overhead.

This maximum size is called the **MTU** (Maximum Transmission Unit). On standard Ethernet, it is usually 1500 bytes. Let's test the physical limits of your connection to `example.com`.

We are going to use `ping`, but we are going to set the "Don't Fragment" flag. We are explicitly telling the routers: *"If this envelope is too big for your hallway, don't chop it up. Just drop it and return an error."*

- **Linux:** `ping -c 1 -M do -s 1472 example.com`
- **macOS:** `ping -D -s 1472 example.com`
- **Windows:** `ping -f -l 1472 example.com`

*(Note: We use 1472 bytes of data because the IP and ICMP headers take up the remaining 28 bytes, hitting exactly 1500).*

If the ping succeeds, your path supports standard envelopes. Now try bumping the number up to `1500` or `1600`. The command will immediately fail, throwing an error like `Message too long` or `Packet needs to be fragmented but DF set`. You just hit the physical walls of the hallway. 

This matters in the real world. If you ever set up a VPN to your office and suddenly find that small text pages load perfectly, but downloading large files instantly hangs and times out, you have an MTU problem. The VPN tunnel adds extra headers to the envelope, pushing it over the limit. 

---

### Lab 10: Dissecting a Slow Connection

When a user complains that an API is slow, the backend developers blame the network team, and the network team blames the backend developers. You need to know exactly where the time is being spent: the directory lookup, the TCP handshake, the TLS ceremony, or the actual server processing.

`curl` has an incredibly powerful feature for dissecting this timeline:

`curl -o /dev/null -s -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://example.com`

This command throws away the actual webpage (`-o /dev/null`) and instead prints out a cumulative timeline of the request in seconds.
- **dns:** How long it took to read the city directory.
- **connect:** When the TCP handshake finished.
- **tls:** When the cryptographic ceremony finished.
- **ttfb (Time To First Byte):** When the server finally handed back the very first piece of data. 

If `ttfb` is three seconds higher than `tls`, the network is perfectly fine—the backend database query is just incredibly slow. You can't fix what you can't measure.

---

### Lab 11: The Wiretap (tcpdump)

Every lab so far has been a static test. You throw an envelope and check the receipt. But a real network is a chaotic, flowing river of data. To actually see it, you need a wiretap. 

`tcpdump` is the ultimate tool for this. It grabs every single envelope flying past your network interface and reads the headers. 

*(Warning: this requires admin privileges and prints a massive wall of text. Hit `Ctrl-C` to stop it).*

- **macOS / Linux:** `sudo tcpdump -i any -n`

You will see absolute chaos. ARP requests shouting into the void, background applications calling home, DNS queries flying by. 

You can filter the noise to only watch specific mail slots. To only watch DNS lookups:
`sudo tcpdump -i any -n port 53`

Open a new terminal tab and run `ping google.com`. Look back at the `tcpdump` window. You will see the exact millisecond the DNS request leaves your machine, and the exact millisecond the answer comes back. 

Being able to read `tcpdump` output is the difference between guessing why a connection is failing and knowing exactly which router dropped the ball.

---

## Chapter 18: Cloud Architecture (Mental Sandbox)

You can't easily spin up an entire enterprise cloud architecture on your local laptop, but we can walk through exactly how you would configure one in AWS or Google Cloud using the concepts we just learned. 

If you have a cloud account, you can build this. If not, just treat this as a mental sandbox to see how the hotel analogy translates into actual buttons and dropdowns in a cloud dashboard. 

### Building the Tower (VPC and Subnets)
First, you click **Create VPC**. It asks for a CIDR block. You type `10.0.0.0/16`. You just claimed an empty tower in the hotel with 65,000 available room numbers. 

Next, you build the floors. You click **Create Subnet**, name it `public-floor`, and assign it `10.0.1.0/24`. You create a second subnet, name it `private-floor`, and assign it `10.0.2.0/24`. To be safe from physical power outages, you tell the cloud provider to put the public floor in Availability Zone A, and the private floor in Availability Zone B. 

### Installing the Doors (Gateways)
Right now, your tower is completely sealed. 

To fix this, you click **Create Internet Gateway** and attach it to your VPC. You then go to the `public-floor`'s routing table (the concierge's binder) and add a rule: *"If the destination is `0.0.0.0/0` (anywhere outside the building), send it to the Internet Gateway."*

You spin up a Linux server on the public floor and give it a public IP address. Because the Internet Gateway is a two-way door, you can now SSH into that server from your laptop at home. 

Next, you spin up a Database server on the `private-floor`. You do *not* give it a public IP address. If you try to SSH into it from home, the connection times out. It is invisible to the internet. To reach it, you have to SSH into your public Linux server first, and then jump to the private database from the inside. 

But what if your database needs to download a software update? It can't use the Internet Gateway. So, you create a **NAT Gateway**, place it on the public floor, and update the private floor's routing table: *"If you need the internet, send traffic to the NAT Gateway."* Your database can now reach out to the internet, but the internet still cannot reach in.

### Security Checkpoints in Action
Finally, let's test the bouncers. 

You configure a **Security Group** for your public Linux server. You add an inbound rule allowing port 80 (HTTP) and port 22 (SSH). This is stateful. If you request a webpage from that server, the bouncer remembers you and lets the webpage back out.

But then your security team tells you that a specific IP address is trying to hack you. You don't update the Security Group. Instead, you go to the **Network ACL** for the entire `public-floor` subnet. You add a stateless rule to the perimeter fence: *"Deny all traffic from this specific IP."*

The next time the hacker tries to send a packet, the Network ACL shreds it before it even reaches the Security Group bouncer. 

---

## Conclusion: The Map and the Territory

We've come full circle. We started in a single room with a MAC address stamped on the door. We walked down copper hallways, took the elevator gateway to different floors, and eventually stepped out into the city streets. We watched routers consult their BGP binders, saw UDP postcards get dropped in the mail, and watched TLS diplomats invent secret languages. 

The goal of this book was never to make you a networking expert. That takes years of breaking things in production. 

The goal was to give you an intuitive map. 

The next time you are sitting in a windowless conference room, and the staging environment drops offline, and `traceroute` starts spitting asterisks at you, you won't just see random noise. 

When you see a "Connection Refused" error, you will know the packet made it to the building, but the bouncer turned it away. When you see a "Request Timeout," you will know the packet got lost on the streets. When you see a weird subnet mask, you will know exactly how big the floor is. 

The vocabulary of technology changes constantly. Cloud providers will invent new acronyms, Wi-Fi will get new numbers, and service meshes will get more complicated. But underneath it all, the physics of the city remain exactly the same. 

- *Who am I talking to?* (IPs and Ports)
- *Which path am I taking?* (Routes and Gateways)
- *Who is allowed in?* (Firewalls and IAM)

You have the map. You know how to read the streets. Now go build something.
