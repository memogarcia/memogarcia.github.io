---
title: "Understanding Computer Networks by Analogy: Part 5 - Follow the Envelope"
date: 2025-10-20T09:00:00-07:00
draft: false
---

> License: CC BY-NC-ND 4.0

---

# Part Five: Follow the Envelope

## Chapter 17: Hands-On Practice

You've read about buildings, cities, and hotels. Now it's time to explore them yourself.

This chapter contains practical exercises you can run on your own computer or in a cloud environment. Each exercise connects back to the analogies we've built. You'll see addresses, paths, and permissions in action.

The exercises are divided into two groups. The core labs use tools available on most computers. The cloud labs require access to a cloud provider account and assume basic familiarity with creating resources.

Work through them at your own pace. When something fails, that's often the most interesting part. Figure out what went wrong, apply the mental model, and try again.

---

### Lab 1: Follow the Envelope with Ping and Traceroute

This is your first letter to the outside world. You'll resolve a name, check if the destination is reachable, and map the path your packets take.

Open a terminal. First, resolve a hostname to an IP address:

On macOS or Linux: `dig +short example.com`

On Windows: `nslookup example.com`

This queries the city directory. You should see one or more IP addresses.

Next, check if you can reach that address:

On macOS or Linux: `ping -c 5 example.com`

On Windows: `ping -n 5 example.com`

You should see responses arriving and round-trip times. If you see timeouts, something is blocking the path.

Finally, trace the route:

On macOS: `traceroute example.com`

On Linux: `traceroute -n example.com`

On Windows: `tracert example.com`

Each line shows one hop. You're watching your envelope pass from concierge to concierge across the city. Note where latency increases. Large jumps often indicate geographic distance or congestion.

---

### Lab 2: Inspect Your Local Network Configuration

Before you can leave the building, you need to know your address and where the elevator is.

On Linux: `ip -4 addr show` to see your IP and subnet mask. Then `ip route` to see your default gateway.

On macOS: `ipconfig getifaddr en0` for your IP. Then `netstat -nr | grep default` for your gateway.

On Windows: `ipconfig /all` shows everything: IP address, subnet mask, default gateway, and DNS servers.

Note your IP address and gateway. The gateway is the elevator lobby for your floor. Any traffic to destinations outside your subnet goes there first.

---

### Lab 3: Watch ARP Discover MAC Addresses

ARP is how your device learns the door labels (MAC addresses) for other devices on your floor.

First, check your current ARP table:

On Linux: `ip neigh`

On macOS or Windows: `arp -a`

You'll see IP addresses paired with MAC addresses. These are cached mappings.

Now ping another device on your local network, something you haven't communicated with recently. Then check the ARP table again. You should see a new entry. Your device shouted "who has this IP?" and received an answer.

---

### Lab 4: Start a Server and Connect to a Port

Ports are mail slots. Let's open one.

On a machine with Python installed, start a simple web server:

`python3 -m http.server 8000`

This opens a mail slot (port 8000) and waits for connections.

In another terminal, connect to it:

`curl http://127.0.0.1:8000`

You should see a directory listing. The curl command sent an envelope to your own machine, addressed to port 8000. The web server received it and replied.

If you know your machine's LAN IP address, try connecting from another device on the same network. Whether it works depends on firewall settings.

---

### Lab 5: Observe TCP Connections

Every connection has two sockets: yours and theirs.

Make an HTTPS request:

`curl -I https://example.com`

While the connection is open (or immediately after), list your connections:

On Linux: `ss -tnp | head`

On macOS: `netstat -anp tcp | head`

On Windows: `netstat -ano | find ":443"`

Find the connection to example.com. Note the local port (something high, like 51234) and the remote port (443). The local port is ephemeral, assigned just for this conversation. When the connection closes, that port becomes available again.

---

### Lab 6: Compare TCP and UDP with Netcat

Netcat is a simple tool for sending data over the network.

Open two terminal windows. In the first, start a TCP listener:

`nc -l 9999`

In the second, connect as a client:

`nc 127.0.0.1 9999`

Type a message in the client window. It appears in the server window. TCP ensures delivery.

Now try UDP. In the first terminal:

`nc -u -l 9998`

In the second:

`nc -u 127.0.0.1 9998`

Send messages back and forth. Notice that there's no connection establishment. You just start talking. If you stop and restart the server, the client keeps sending into the void. UDP doesn't know or care.

---

### Lab 7: Inspect a TLS Certificate Chain

When you visit an HTTPS site, your browser verifies the server's certificate. You can do this manually.

`openssl s_client -connect example.com:443 -servername example.com -showcerts < /dev/null`

The output shows the certificate chain. Look for the subject (the site's name), the issuer (the CA that signed it), and the validity period. The chain might have multiple certificates: the server's certificate, one or more intermediate certificates, and implicitly the root CA that your system trusts.

---

### Lab 8: Measure DNS Lookup Time

DNS delays add to every new connection. Let's see how long lookups take.

`dig example.com`

Look at the "Query time" in the output. This is how long the lookup took.

Run it again. The second query is usually faster because the result is cached.

Force a fresh lookup by asking a different DNS server:

`dig @8.8.8.8 example.com`

This bypasses your local cache and asks Google's DNS server directly. Compare the timing.

---

### Lab 9: Test Maximum Packet Size

Networks have a maximum transmission unit (MTU), the largest packet they can carry without fragmentation. If your packet exceeds the path MTU, it must be broken into smaller pieces, which adds overhead.

You can probe for the path MTU:

On Linux: `ping -c 1 -M do -s 1472 example.com`

On Windows: `ping -f -l 1472 example.com`

The 1472 bytes plus headers should fit in a standard 1500-byte MTU. If it works, try increasing the number. When you exceed the path MTU, you'll get an error about fragmentation needed. The largest successful size tells you your effective MTU to that destination.

---

### Lab 10: Measure Connection Timing

When troubleshooting slow pages, it helps to know where time is spent.

`curl -o /dev/null -s -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://example.com`

This breaks down the total time: DNS lookup, TCP connection, TLS handshake, time to first byte, and total. If DNS is slow, investigate your resolver. If TLS is slow, the server might be distant or overloaded. If time to first byte is slow after TLS, the application is taking time to generate the response.

---

## Chapter 18: Cloud Labs

These exercises require access to a cloud provider. The specific steps vary by provider, but the concepts are universal.

### Cloud Lab A: Build a VPC with Public and Private Subnets

Create a new VPC with a CIDR block like 10.0.0.0/16. This is your private floor.

Create two subnets. One is public (10.0.1.0/24) and one is private (10.0.2.0/24). Place them in different availability zones for resilience.

Create an Internet Gateway and attach it to the VPC. Update the public subnet's route table so that traffic to 0.0.0.0/0 goes through the Internet Gateway.

Launch a small instance in the public subnet. Give it a public IP. Verify you can SSH to it from the internet.

Launch another instance in the private subnet. It has no public IP. Try to SSH to it from the internet. You can't. Now SSH to your public instance and try to connect to the private instance from there. If security groups allow it, you can.

You've built a floor with a public wing and a private wing.

---

### Cloud Lab B: Add a NAT Gateway

Your private instances can't reach the internet directly. But they might need to download updates.

Create a NAT Gateway in your public subnet. It needs an Elastic IP (a public address).

Update the private subnet's route table. Traffic to 0.0.0.0/0 should go through the NAT Gateway.

SSH to your private instance (through the public bastion). Try to reach the internet:

`curl https://example.com`

It works. Your private instance can initiate outbound connections. But nobody on the internet can initiate connections to it. The NAT Gateway is the staff exit.

---

### Cloud Lab C: Create a VPC Endpoint

Your instances might access cloud storage or other provider services. By default, that traffic goes through the internet (or NAT Gateway). A VPC endpoint keeps it internal.

Create a gateway endpoint for your provider's object storage service (like S3 on AWS). Associate it with your route tables.

From a private instance, access the storage service. If you have flow logs enabled, you can verify the traffic doesn't leave the VPC.

This is the private service door.

---

### Cloud Lab D: Security Groups vs Network ACLs

Create a web server in your public subnet. Configure its security group to allow inbound HTTP (port 80) from anywhere.

Access the web server from your browser. It works.

Now add a network ACL rule to the subnet that denies inbound traffic on port 80.

Try to access the web server again. It fails.

Remove the NACL rule. Access is restored.

Security groups are stateful (allow traffic in, and responses are automatically allowed out). NACLs are stateless (you must explicitly allow both directions). Understanding which layer blocked something is crucial for troubleshooting.

---

You've run the experiments. You've seen addresses, paths, and permissions in action. The theory has become tangible.

One chapter remains: the ending that circles back to the beginning.
