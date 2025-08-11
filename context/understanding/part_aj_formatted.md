# Private vs Public IP Addresses and Security

Security-wise, private IP addresses provide a basic firewall – outside devices can't directly initiate a connection to an internal private IP because they don't have a direct address for it (it's like not knowing someone's extension number, you only know the main line). The router, by default, won't forward unexpected incoming traffic to a private IP unless configured to (which provides some protection – your devices are not directly exposed).

We'll dive more into the mechanism (NAT) in a later chapter. But it's important to realize that your computer likely has **two IP addresses in play**: one that it knows (private) and one that the rest of the world sees (the public IP of your router). This is analogous to how you might have an internal phone extension at work, but people outside call the main number and the receptionist (router) connects them to you.

One more note: Not all networks require NAT. Businesses or servers can have public IPs assigned directly to devices (like having a building with a unique street address for every office – IPv6 will actually allow that easily since there are plenty of addresses). But with IPv4, public addresses are scarce, so NAT became very common.

> **Technical Perspective**: IP address classes and private ranges: The concept of private vs public IP addresses is defined by standards (RFC 1918 for IPv4 private ranges). The private IPv4 ranges are:
> 
> - **10.0.0.0 – 10.255.255.255** (a 10.x.x.x block, 16 million addresses possible – often used in large orgs)
> - **172.16.0.0 – 172.31.255.255** (16 blocks of 65k addresses each – medium networks)
> - **192.168.0.0 – 192.168.255.255** (256 blocks of 256 addresses – very common in home networks)
> 
> These addresses are not routable on the public internet – internet routers will not forward packets with these addresses as source or destination. That's why they are free to reuse internally.
> 
> A public IP is one that isn't in those private ranges (and isn't otherwise reserved) and can be reached from the internet. They are assigned by regional internet registries to ISPs and organizations. For example, your ISP might have a pool of public IPs and assign one to your home router (either dynamically via DHCP or statically).
> 
> **NAT (Network Address Translation)**: Typically implemented in your router, NAT will swap the source IP (and port) of outbound packets from private to public, and maintain a table to do the reverse when responses come in. We have a full chapter on NAT analogies later, but technically it's how multiple devices share one public IP. NAT has some side effects – e.g., a server on a private IP can't be directly contacted from outside unless the router is configured to forward certain ports to it (port forwarding). NAT also breaks the end-to-end connectivity principle, which was one impetus for IPv6 adoption (so every device can have a public IP again). But NAT does act as a basic firewall since inbound is blocked unless explicitly allowed.
> 
> **Private vs Public usage**: Usually, your personal devices have private IPs (e.g., 192.168.1.x at home), and your router's WAN interface has a public IP from the ISP (unless even your ISP does carrier-grade NAT, which some mobile networks do). When you go to memo.mx (with IP say 203.0.113.5), your PC (192.168.1.100) sends to router (192.168.1.1), router NATs it out as (203.0.113.42 source, for example), the server replies to 203.0.113.42, router gets it and NATs back to 192.168.1.100. All behind the scenes.
> 
> **Security**: While NAT prevents unsolicited inbound, it's not a full security measure—firewalls are still needed for more granular control. But it's true that a device on a private IP is a bit less exposed than one with a public IP (unless the router is configured to expose it). This is one reason home devices aren't directly hackable from internet unless you misconfigure the router or the device initiates something malicious.

So, private vs public IP is essentially local vs global addressing. Think of private IP as your inside identity and public IP as your outside identity. The mapping between them is handled by your network's gateway through NAT. This dual system allowed the internet to grow beyond the hard limit of ~4 billion IPv4 addresses by reusing the internal ranges in countless networks.

# DNS: The Public Directory

Continuing our city analogy: suppose you want to send a letter to "Hotel Sunrise" in another city, but you don't know its street address. You'd look it up in a directory or phone book. In networking, when you have a name like memo.mx or google.com but you need the numeric IP address to actually send data, you use DNS.

**DNS (Domain Name System) is like the public directory for the internet**. It's essentially the phone book or address book that maps human-friendly names to IP addresses. Humans are good at remembering names ("Hotel Sunrise" or "memo.mx"), whereas computers route information using numbers (IP addresses). DNS bridges that gap by translating names to numbers.

## How does it work in our analogy?

- Each building on the internet may register its name in a global directory service (DNS). For example, "memo.mx" is a name registered in DNS, and it corresponds to a certain IP address (like the building's street address).

- When your computer wants to send data to memo.mx, it doesn't know what numeric address to send to at first. It essentially asks DNS, "What's the address of the building named memo.mx?" This is like looking up a company's address in a phone book because you only know the company name.

- DNS servers around the world collaborate to maintain this directory. Your computer or local network will query a DNS server (often provided by your ISP or a public service like 1.1.1.1 or 8.8.8.8). If that server doesn't know the answer, it will go up the chain (to root servers, then to MX domain servers, etc.) to find who is authoritative for that name.

- Eventually, you get an answer: "memo.mx is at 203.0.113.5" (for example). Now your computer has the building's address and can proceed to send the data there.

- This process is usually invisible and fast (it can take just a few milliseconds as DNS is optimized with caching). It's like having a super-efficient global phonebook that everyone can consult in an automated way.

Another analogy: DNS is like calling directory assistance. You provide a name, and the service responds with a number. In fact, DNS is often called the "phone book of the internet." Without it, we'd be stuck memorizing IP addresses or maintaining our own lists.

## DNS Directory Structure

A bit more depth on how the DNS directory is structured:

- It's hierarchical, much like phone books might be organized by country and city. At the top are root servers (they handle the very top-level: they know where to find the servers for top-level domains like .com, .mx, .org, etc.).

- For a name like memo.mx, your DNS resolver would first ask a root server, "where can I find information about .mx domains?" The root would respond with the address of the .mx TLD name servers (the directory for .mx).

- Then the resolver asks one of those, "where can I find the server for memo.mx domain?" The .mx server replies with the address of the authoritative name server for memo.mx (maybe Memo's own DNS server or the provider's).

- Finally, that authoritative server is asked, "what's the IP for memo.mx?" and it gives the answer (203.0.113.5, for example).

- This sounds like a lot, but it's distributed and cached. Typically, your local DNS resolver will have some info cached (like it may know the .mx servers already, etc.). And once it learns memo.mx's IP, it will cache that so next time it doesn't need to repeat the whole process (at least until the cache expires).

So effectively, DNS acts like a giant, distributed directory assistance for the internet. Instead of you memorizing an IP like 142.250.64.78, you just remember google.com and DNS does the rest. It's so integral that most network applications automatically use DNS under the hood to translate names to addresses.

If you recall our earlier private vs public IP discussion: we said you often access things by name, not by number, and DNS is why that works. It's also flexible: if a website changes its server IP, they just update DNS – users keep using the same name and hardly notice anything changed.

One more layer of analogy: think of DNS like having not just a phone book, but a whole chain of directory services: local (your OS cache), then your ISP's (regional directory), then the global root/TLD (the "international directory"). This multi-tiered approach ensures that queries are resolved efficiently and the system can scale to millions of names.

> **Technical Perspective**: DNS (Domain Name System) is a decentralized naming system for devices/services. When you type a hostname (like example.com), a DNS resolver breaks it down:
> 
> **Root query**: It contacts a root server (there are 13 root server clusters globally, serving the root zone). The root server responds with referrals to TLD name servers (e.g., for .com).
> 
> **TLD query**: It contacts the TLD server for .mx, which responds with the authoritative name server for memo.mx (the NS record, basically "ask that server").
> 
> **Authoritative query**: It then contacts that authoritative server which finally returns the IP (the A record for IPv4, or AAAA record for IPv6).
> 
> **Caching**: Each step's result is cached by your resolver (and often by your local OS). So subsequent lookups for the same name (or even same TLD) can skip earlier steps for a while (controlled by DNS record TTLs).
> 
> Your computer typically doesn't do the full recursion; it asks a recursive resolver (often at your ISP or a public one like Google's 8.8.8.8 or Cloudflare's 1.1.1.1). That resolver does the above steps (root -> TLD -> auth) and returns the answer to your computer, then caches it for other users. If next time some other user asks for the same hostname, the resolver can reply immediately from cache.
> 
> DNS queries usually use UDP on port 53 (since the query/response are small), falling back to TCP for larger responses (like DNS zone transfers or very long records). Modern DNS has extensions and even encryption (DNS over HTTPS/TLS) to address privacy and security, but the basic concept remains mapping names to addresses.
> 
> It's not just IP addresses: DNS also stores other info, like MX records (mail server for a domain), TXT records (text info, often for verification/keys), CNAME (alias from one name to another), etc. But the A/AAAA record (name to IP) is the most fundamental for general browsing.
> 
> Without DNS, the internet as we know it would be very user-unfriendly (imagine sharing a website by saying "go to 142.251.32.110" instead of "go to google.com"). It also decouples the service location from its name – servers can move IPs, and DNS updates keep the name working for users. It's like a dynamic phone book that can update entries as needed.
> 
> One can appreciate that while DNS is like a "phonebook," it's much faster and automated than a human-accessed phonebook – usually resolving names in a fraction of a second, and it handles billions of queries per day across the world.

So, DNS is our public directory service, ensuring that when we use human-friendly names, the network can still route to the correct numeric addresses. It's a behind-the-scenes hero of internet usability.

# TCP vs. UDP

Now let's shift gears a bit. We've been focusing on addresses and delivery, which is like ensuring the mail gets to the right building and room. But what about how the messages themselves are sent and received? In networking, two major "delivery services" govern how data packets get transported: **TCP and UDP**. Think of them as two different mailing services with their own policies about delivery guarantees and speed.

Using our analogy: when you send a package or a letter, you have options. You could send it registered mail – where the postal service ensures it gets to the recipient and you get a confirmation receipt, and if it's lost, they try to resend. Or you could drop it in a mailbox with a regular stamp without tracking – it's simpler and usually fine, but you won't know if it arrived, and there's no automatic retry. That's the difference between TCP and UDP in a nutshell.

## TCP (Transmission Control Protocol) – Reliable Registered Mail

TCP is like using a reliable courier or certified mail service. When you send data over TCP, the protocol establishes a connection (like a handshake agreement) and ensures that every packet of data is received and acknowledged by the other side. If something gets lost along the way, TCP will detect that (because it won't get an acknowledgment for that packet) and resend it.

It's as if every letter you send requires the recipient to sign a receipt and send it back to you. If the receipt doesn't come, you send another copy of the letter. This makes TCP reliable – data will arrive intact and in order, or if not, the sender will know and can retry.

The trade-off is that this back-and-forth (acknowledgments, possible resending, and ordering) adds overhead and can slow things down a bit, especially if there's any loss or delay. It's like how certified mail is slower and a bit more effort than just dropping letters in the mailbox.

TCP is great when you need accuracy – for example, loading a webpage, transferring a file, or sending an email. You don't want missing pieces or scrambled order in those. TCP provides features like sequencing (so packets reassemble in correct order) and error checking.

## UDP (User Datagram Protocol) – Quick Regular Mail

UDP is like sending a postcard or a standard letter with no tracking. You write it, send it, and assume it will get there, but you don't get a confirmation. If it gets lost, you might not know unless the recipient tells you they didn't get it (and then you'd have to decide to resend manually).

UDP is thus unreliable in the sense that it doesn't guarantee delivery or order. However, it is very lightweight – there's no establishment of connection, no ongoing acknowledgments, no built-in retransmission. It's basically fire-and-forget. This makes it fast and with lower latency overhead.

UDP is useful when you value speed over absolute reliability, or when the application can handle any necessary error correction itself. Classic examples are:

- **Live audio or video streaming**: In a live video call, if a packet is lost, by the time you notice, that moment of audio/video is already in the past – there's no point asking for a resend because it would arrive too late to be useful. It's better to tolerate a bit of static or a skipped video frame and keep going in real-time.

- **Online gaming**: If one update of game state is lost, you don't want to pause everything; a new update will come soon anyway.

- **DNS queries**: Simple queries use UDP typically – if a query packet is lost, the application (the DNS resolver) will just send another query; we don't need TCP's heavy machinery for such a small transaction.

UDP suits these use cases because it doesn't wait for acknowledgments – it keeps sending the next packets.

## Summary Comparison

To summarize in analogy terms:

- **TCP is like registered mail** – you get a confirmation for every packet delivered and the mail service will retry if needed. It's reliable but has extra steps (handshakes, receipts) that can slow things down slightly.

- **UDP is like standard mail** – you send it off and assume it gets there. There's no built-in recovery if it doesn't, but it's simple and fast, and often it's good enough.

### Multi-page Document Example

Let's illustrate with a scenario: sending a multi-page document:

- **If you use TCP**: It's as if you number each page, send them one by one, and after each page the recipient sends a note back "Got page 5" etc. If the recipient notices a page is missing (number 7 didn't arrive), or you don't get confirmation, you resend that page. In the end, the recipient can collate all pages 1 through N in order.

- **If you use UDP**: You just stuff all the pages into envelopes and send them out. You don't wait to hear back. If the recipient finds page 7 missing, they can either request the whole thing again or just live with a gap. UDP itself doesn't have a mechanism to request "just resend page 7" (that would have to be handled by the application if needed).

Most of the core internet applications in the early days (like web, email, file transfer) chose TCP because integrity was more important than speed. But as we started doing more live media and interactive stuff, UDP became crucial for those real-time applications.

## Ordering and Buffering

One more aspect: with TCP, because it ensures ordering, if packet #7 is delayed, packet #8 will wait even if it arrived, until 7 is delivered – similar to how a conveyor belt might pause until a missing item is put back in sequence. This can introduce delay (buffering) if some packets are slow. UDP doesn't have this issue; packet #8 just gets processed immediately even if 7 is missing (you'll just have a gap for 7).

## When to Use Which?

Neither is "better" universally; they serve different needs:

- **Use TCP when you need reliability and in-order delivery**: web pages, file downloads, financial transactions, etc.

- **Use UDP when you need speed and can tolerate some loss**: live streams, VoIP, online games, or simple query/response where you'll handle retry at application level if needed.

> **Technical Perspective**: TCP and UDP are transport layer protocols on top of IP:
> 
> **TCP (Connection-oriented)**: Before sending data, TCP performs a three-way handshake (SYN, SYN-ACK, ACK) between client and server to establish a connection. This is like both parties agreeing "we're going to have a conversation". Once established, TCP ensures reliable delivery: it numbers bytes with sequence numbers, the receiver sends back acknowledgments (ACKs) for data received. If sender doesn't get an ACK for some data in a certain time, it assumes it was lost and retransmits it. TCP also ensures data is delivered in the order sent and with no duplicates (it will reorder if needed and discard duplicates). It provides flow control (so a fast sender doesn't overwhelm a slow receiver) using a window mechanism, and congestion control (so it doesn't overload the network) by algorithms like AIMD (Additive Increase Multiplicative Decrease), slow start, etc. All these features make TCP robust and fair but add overhead and complexity. Each TCP segment carries sequence numbers, ACK numbers, flags, etc., and establishing a connection plus error recovery can add latency. Maximum throughput of a single TCP flow can also be influenced by round-trip time and packet loss (because of how congestion control works).
> 
> **UDP (Connectionless)**: UDP just sends independent packets called datagrams. There's no handshake, no acknowledgment, no built-in ordering. A UDP header is very small: just 4 fields (source port, dest port, length, checksum). If packets are lost, UDP itself doesn't detect or correct it (the receiving application might notice missing data in its own context, but UDP won't resend). If packets arrive out of order, UDP doesn't reorder them (again, application can handle if it cares). The upside is minimal overhead: no waiting for ACKs, no keeping track of lots of state. This is ideal for simple query-response protocols like DNS (one small question, one small answer – doing a whole TCP handshake for that would be overkill and slower), or for streaming where continuous sending matters more than perfect delivery. Applications using UDP often implement their own reliability mechanisms if needed (e.g., some video protocols may request a key frame if too many packets were lost, or games might have their own sequence numbers for game state updates but choose to ignore old ones).
> 
> **Ports**: Both TCP and UDP use port numbers to allow multiple conversations on one host (we'll talk about ports more soon). For instance, TCP port 80 is typically HTTP web server. UDP port 53 is DNS.
> 
> Because TCP provides a stream abstraction, the application just sees a continuous stream of bytes as if it was a direct pipe to the other end. UDP preserves message boundaries (each datagram is delivered as a discrete packet to the application).
> 
> **Examples**:
> - Web browsing: TCP (overwhelmingly, because we need all HTML, CSS, JS to arrive fully)
> - Video call: typically UDP (using RTP protocol over UDP) because timely delivery is more important than completeness (and some higher-level concealment is done for losses)
> - File download (FTP, HTTP, etc.): TCP for reliability
> - Live broadcast: UDP or specialized protocols (some streaming uses HTTP over TCP actually which can cause buffering, but newer approaches like QUIC seek to blend UDP's speed with reliability)
> - DNS: UDP for queries (with a TCP fallback if the response is too large or for zone transfers)
> - Gaming: often UDP because if one update of game state is lost, you don't want to pause everything; a new update will come soon anyway
> 
> TCP has built-in congestion avoidance which plays nice with other TCP flows (each TCP will slow down if it detects loss). UDP has no such mechanism, so uncontrolled UDP flows can be problematic (they won't slow down on loss, potentially flooding network – but usually the application using UDP implements some rate control; also some routers do QoS to prevent UDP from starving TCP).
> 
> Newer protocols like QUIC (used in HTTP/3) actually run over UDP but implement reliability and ordering in the application layer, aiming to get the best of both worlds (faster setup, better multiplexing like UDP, but still reliable like TCP).

So, understanding TCP vs UDP is crucial for choosing the right tool for the job and also for configuring networks (e.g., knowing that UDP is connectionless helps in setting up firewall rules or diagnosing why something might not reconnect on a NAT, etc.). In short:

- **TCP = phone call** (ensuring every word is heard, with "can you repeat that?" when needed)
- **UDP = radio broadcast** (you speak, not knowing exactly who hears; if someone misses a word, you can't resend it)