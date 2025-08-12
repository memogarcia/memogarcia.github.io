---
title: "Understanding Computer Networks by Analogy - Part 1: Building the Foundation"
date: 2024-12-20T01:53:23+01:00
draft: false
---

I wrote this for the younger (and less handsome) version of myself from university who found networking concepts challenging. If you're reading this and you are also struggling with these concepts, just know this isn't a complete map of the "networking world", it is simply a different way to see it. I hope you find this analogy helpful.

I've decided to stick with analogies here instead of going deep into technical terms, you can find those easily anywhere, because I enjoy looking at the world from different perspectives. It's fascinating how many connections you can make when you approach things from a new angle.

I understand that analogies have their limits and sometimes you have to stretch things to make them work. In those cases, maybe it's better to stick to first principles. But honestly, I find analogies more fun, especially for abstract concepts like computer networks.

Finally, I want to emphasize that this analogy isn't meant to be an exact representation of the "world of networking". It's simply a learning tool to help view computer networks from a different perspective.

What to expect: We'll be comparing computer networks to things you encounter in everyday life. Our main analogy is that of buildings and cities:

 In Part 1 (Building the Foundation), we start small: a single building representing a network. We'll explore rooms (computers), hallways (connections), floor managers (switches), and so on  the fundamental pieces that make a network work internally.

 In Part 2 (Moving Around the City), we expand outward. Multiple buildings form a city  an analogy for the internet. We'll see how messages travel across the city, guided by concierges (routers) and roads (cables), and how global addressing and directories help data find its destination.

 In Part 3 (Hotels in the Cloud & Future Cities), we look at more advanced or modern networking concepts. We'll check into "hotels" (cloud computing) to see how renting a room in someone else's building works. We'll also touch on future-forward ideas and technologies  the "city planning" of networks  like IPv6 (a new addressing scheme), software-defined networking (rebuilding hallways on the fly), and more.

 In Part 4 (Becoming an Architect), we conclude by turning the analogy around: now that you've learned the layout, it's time to become the architect. This part guides you on how to design and think about networks (buildings and cities) yourself, bridging the analogy back to real-world network architecture.

 Finally, there's an Appendix with a handy concept mapping table (network terms to analogy terms) for quick reference.

## Networks as Buildings

Analogy: A computer network visualized as a building with many rooms and hallways. Imagine a large building filled with countless rooms, connected by hallways and staircases. Each room in the building represents a single computer or device, and the room's number (like "Room 101") acts as that computer's address on the network (its IP address). People (or let's say, messages) walk through hallways to visit different rooms  this movement through hallways is like data moving between computers within a network.

In this simple analogy, the entire building is a network. The rooms inside are the individual devices, and the hallways are the communication links that allow movement (data transfer) within the building. Just as you might talk to someone in another room by walking down the hallway and knocking on their door, one computer sends data to another by sending it through the network's "hallways."

Let's break down the basic components of this building analogy:

- **Building = Network**: The whole structure containing everything is the network itself. A small building might be like a home network, whereas a huge skyscraper could represent a large corporate network.

- **Room + Room Number = Computer + IP Address**: Each room is a computer or device. The room number (e.g., Room 101) is the unique identifier for that room within the building  similarly, an IP address uniquely identifies a device on the network (at least within its own network).

- **Hallways = Network Connections (Cables/Wi-Fi)**: The corridors, staircases, and doors connecting rooms are the pathways data takes. Whether it's an Ethernet cable or a Wi-Fi signal, these are like hallways that allow movement within the building.

- **Language = Network Protocol**: In a building, people might all speak a common language to understand each other. In a network, devices must use the same protocol to communicate  a set of rules that define how messages are formatted and transmitted.

To extend this analogy: Buildings have specific purposes. Some are homes, others are offices, hospitals, or malls. Likewise, networks come in different types optimized for their use. A small home network (like a cozy house) is designed for simplicity and convenience. A business might have an office network (an office building) designed for efficiency and security. A data center network is like an industrial complex or a specialized facility built for heavy duty  optimized for large-scale data processing and storage. The design of each building reflects the needs of its occupants, just like a network's design reflects its intended purpose.

**Different "building" types = Different network types**: You can think of a LAN (Local Area Network) as a single building  typically under one roof, owned and operated by one entity (like your home or an office). A WAN (Wide Area Network), on the other hand, is more like a campus or a cluster of buildings in different locations connected by roads (communication lines). A data center network could be imagined as a highly optimized, specialized building (like a high-security bank or research lab) where the internal structure is built for speed and reliability above all.

Now, one building by itself is a contained world. But networks rarely live in isolation  just as buildings exist in neighborhoods and cities. Before we go city-wide, however, we need to further design our building's internal structure. Let's go floor by floor and room by room, fleshing out this analogy.

**Technical Perspective**: In reality, a computer network is a collection of interconnected devices (computers, servers, phones, etc.) that can communicate with each other. This communication follows standard protocols (rules), and each device is identified by an IP address (similar to how each telephone has a unique number or each house has a unique address). Networks can be small (a few devices in a home) or enormous (thousands of devices in a corporate or campus network). Just as a building might have internal room numbers that only make sense inside that building, many networks use private IP addresses internally. To the outside world (the internet), the entire network might be known by a single public IP address (comparable to the building's street address). The building analogy is a starting point: it helps illustrate concepts like internal structure, addressing, and the idea that a network has boundaries (walls) and entry/exit points (doors). Keep in mind that while the analogy simplifies things, a real network involves hardware (cables, routers, switches) and software working together according to networking protocols.

## Designing Network Floors

Every large building has multiple floors, and each floor groups certain rooms together. In our network-as-building analogy, each floor represents a subnetwork (subnet)  a subdivided portion of the larger network. We design floors in a building to organize rooms (maybe by department or function), and similarly we design subnets in a network to organize computers for security or efficiency.

**Analogy**: Different floors in a building represent different sub-networks within a larger network. Suppose you have a company's office building. The company decides that the HR department will occupy Floor 2 and the Engineering team will occupy Floor 3. By doing this, people (and communications) on the same floor can interact freely, while movement between floors is more controlled (perhaps you need to take an elevator or have permission to access a different floor). This is just like a network where you create subnets: computers on the same subnet (floor) can talk to each other easily, but to communicate with a different subnet (another floor) the traffic might need to go through some controlled gateway or router (more on elevators and routers soon!).

Why would we separate groups like this? In a real building, you might separate floors by department to reduce unnecessary foot traffic and increase security. In networks, we use subnets to localize traffic and improve performance and security. For example, the HR computers (handling sensitive data) stay within their own subnet so their traffic is isolated from Engineering's streaming of code builds or test data.

**Identifying a room by floor and number**: If someone tells you "Room 101" without context, you might ask, on which floor? In a building, Room 101 on Floor 1 is a different location from Room 101 on Floor 3. So usually we specify both floor and room: "Floor 3, Room 101." Networks do something similar. A device's full address can include the subnet info and the host info. For example, consider an IP address like 192.168.3.101. Here, part of it (192.168.3.x) could identify the subnet (floor) and the rest (x) identifies the specific room (device) on that floor. Within its own floor, you can reach Room 101 directly. But to reach "Room 101 in another building," you'd need that building's address too. In networking terms: inside your network, you use private addresses freely. But to go to a different network, you need that network's address (the public IP, plus some help from routers).

As an analogy, a full address might look like:

Building X, Floor 3, Room 101

This is akin to saying "Device at IP 192.168.3.101 in Network X." Within Building X you only needed "Floor 3, Room 101," but from outside you specify the building as well.

Designing a floor (subnet) effectively involves a couple of considerations:

- **Hallway Width (Bandwidth)**: How wide are the corridors on this floor? Hallway width represents network bandwidth on the subnet. Wider hallways (higher bandwidth) allow more people (data packets) to move simultaneously with ease. For high-traffic floors (say, the Engineering floor where they transfer big files), you'd design wider hallways. In network terms, this could mean using faster switches or higher capacity links for that subnet.

- **Number of Rooms (Subnet Size)**: How many rooms can you fit on this floor? This corresponds to how many IP addresses (devices) the subnet can accommodate. A small floor might have only a few rooms (a subnet that supports maybe 6 devices, e.g. a /30 subnet with 4 usable IP addresses), which is easier to manage and secure. A big floor can host many rooms (e.g. a /16 subnet with 65,536 addresses) but can be harder to manage if it's too crowded. There's a floor plan that governs this  in networking that's the subnet mask or prefix length. Think of the subnet mask as the blueprint that says "this floor can only have this many rooms." For instance, a subnet mask of 255.255.255.0 (a "/24" prefix) is like a floor plan that allows 254 rooms on that floor. If you need more rooms, you'd use a different mask (blueprint) or add another floor.

To illustrate subnet sizing:

- **Big floors**: A large subnet (like /16) is a floor with a huge number of rooms. Useful for a large office or campus where you might have tens of thousands of devices on the same network. But just as a massive single floor can get unwieldy (imagine trying to navigate a floor with 65,000 rooms!), a huge subnet can suffer from inefficiencies like broad traffic broadcasts.

- **Small floors**: A tiny subnet (like /30 or /29) might only allow a handful of rooms. This could be used for point-to-point links or very small offices. It's easy to manage but not very flexible if you need to add more rooms/devices.

In practice, network architects carefully plan how to "floor-plan" their networks: balancing size and performance. You wouldn't want a single floor for your entire corporation if it makes more sense to have each department on its own floor.

**Technical Perspective**: A subnet is a logically visible subdivision of an IP network. When we talk about subnets, we often use terms like subnet mask or CIDR prefix (e.g., /24) to denote how the IP addresses are split between the network portion and the host portion. The subnet mask is essentially the "floor plan"  it determines which part of an IP address denotes the subnet (floor) and which part denotes the host (room). For example, in the IP 192.168.3.101/24, the /24 mask means the first 24 bits (192.168.3) are the network portion (identifying Floor 3, so to speak) and the last 8 bits (101) are the host identifier on that subnet. Devices within the same subnet can reach each other directly (like people moving within the same floor) without involving a router. But when a device needs to talk to a device on a different subnet, it must go through a gateway (which we'll cover soon, analogous to an elevator connecting floors). In technical terms, subnets help manage traffic by limiting broadcast domains and organizing the network into smaller, more efficient segments. Networks are often designed with multiple subnets to improve performance and security  for instance, separating a guest Wi-Fi network from an internal company network is like giving guests their own floor in the building, with the elevator as a checkpoint between guests and secure areas.

## Computers as Rooms

If our building is the network, then each room inside it is a computer (or any networked device). Just like rooms in a building, computers in a network come in all shapes and sizes and serve different purposes: one room might be a quiet office, another a noisy cafeteria; one computer might be a server, another a user's laptop. Each room can be occupied (running applications) and has people coming in and out (data being sent/received).

A room's design and content depend on its occupants. In an office building, Room 101 might be Accounting, filled with filing cabinets and calculators (I know, cliché), whereas Room 102 is a conference room with projectors and speakerphones. In networking, a computer's role (what services or software it runs) determines what kind of "furniture" or setup it has. A database server is like a records room with locked cabinets (lots of data stored securely). A web server might be like a reception room with lots of pamphlets ready to give out (it serves web pages to anyone who asks).

**Doors = Network Interfaces**: How do things get in and out of a room? Through doors. In networking, a door represents a network interface on the computer. Most rooms have at least one main door; most computers have at least one primary network interface (like your laptop's Wi-Fi or Ethernet port). Some rooms have multiple doors  maybe a door to the hallway and another connecting to an adjacent room. Similarly, a computer can have multiple network interfaces: perhaps an Ethernet connection and Wi-Fi, or even Bluetooth  each is a "door" connecting it to some network.

Let's explore the idea of multiple doors in a room:

### Multiple Doors

A single room can indeed have several doors leading to different places, and each door provides a unique way to enter or exit the room. Here's how that maps to computers:

- **Main Door**: The primary way in and out. For a device, this is typically its primary network interface  often an Ethernet port or Wi-Fi antenna. This is how the bulk of traffic comes and goes. It's like the front door where regular visitors enter. For example, your PC's Ethernet port connecting to the office LAN, or your phone's Wi-Fi radio connecting to your home router.

- **Maintenance Door**: Some rooms have a back door for staff or deliveries. On a computer, this could be a secondary interface used for special purposes, such as a management network or a VPN connection. Think of servers that have a dedicated management port  it's not used by general traffic, only by administrators (janitors of the network) to perform maintenance. Another example: your computer might have a second network card or a USB tethering interface  not the main one you use for everyday internet, but there in case it's needed.

- **Emergency Exit**: This is rarely used but absolutely crucial in a crisis  like those fire exits you only open when something's really wrong. For networking, an "emergency exit" could be a backup connection. Imagine a critical server that normally uses a wired connection but has a 4G wireless backup link if the wired network fails. Or a secondary ISP link for when the primary goes down. It could also be an automatic failover interface. Most of the time it sits unused (door is closed), but when disaster strikes (the main door is blocked), it becomes vital.

Each door (network interface) has its own identifier, just like each door in a real building might have a unique key or number. In networking, the unique ID for a door is often the MAC address  a hardware address assigned to the network interface. You can think of the MAC address as a "door ID" that ensures the right person or packet goes to the right door. So even if two rooms have the same layout, their doors are uniquely labeled so the floor manager (switch) can tell them apart.

Also, some rooms have internal doors connecting to adjacent rooms (like suites of offices with interior connecting doors). Similarly, a computer might have a virtual or internal network connecting to another (for example, virtual machines on one host connecting via an internal bridge  but that's like secret passages which we won't dive too deep into here).

One more point: If a door is locked or broken, the room is inaccessible. In network terms, if a network interface is shut down or misconfigured, that computer effectively can't be reached from that path  like a closed door. This is why network downtime often feels like you're knocking on a door nobody is opening.

We now have a building with multiple floors (subnets) and rooms (computers) with doors (interfaces). But how do we make sure messages get to the right room efficiently? In a big building, you don't wander the halls randomly hoping to find "Bob in Room 203." Instead, large buildings have some directory or at least someone to ask for directions. In our network building, that role is handled by devices like switches and routers  the subject of the next chapters.

**Technical Perspective**: An individual computer or host on the network is identified by its IP address (analogy: room number) and communicates through one or more network interfaces (doors). Each network interface has a MAC address (a unique physical identifier for that interface) which operates at Layer 2 of the OSI model (the data link layer). In technical terms, if a computer has multiple network interfaces, it can be connected to multiple networks or multiple segments of the same network. For example, a workstation might be connected to both a wired Ethernet and a Wi-Fi network simultaneously (just as a room might have two doors to different hallways). Networking software on the computer handles each interface separately, and typically the system decides which interface to use for outgoing traffic based on routing rules (often the main interface unless a specific route says otherwise). The concept of an "emergency exit" in networking might correspond to redundancy: mission-critical systems often have redundant network connections (and even redundant power) so that if one fails, the other picks up  this is seen in servers with dual NICs (Network Interface Cards) configured for failover. The MAC addresses ensure that switches can direct traffic to the correct interface. If you send a packet to an IP, it gets resolved (via ARP) to a MAC address  essentially finding which door leads to that IP  and then delivered to that specific interface. If the interface is down, no entry. Thus, managing interfaces (doors) is a key part of network administration: enabling/disabling ports, setting up secondary links, etc., all ensure that the "rooms" stay accessible and communication flows through the right "doors."

## Switches as Floor Managers

So you're on Floor 2 of the building, and you want to send a file (message) to your colleague in Room 203 on the same floor. How do you ensure it gets there? You could wander the hallway, knocking on every door, "Is this 203? No... Is this 203?" That's terribly inefficient. In well-run buildings, there's usually a floor manager or a directory on each floor to direct you.

In our network building, a switch is like the floor manager (or a helpful concierge on that floor). The switch knows exactly which door corresponds to Room 203. In practice, when you (Room 201, say) send data intended for Room 203, the switch on that floor checks the destination and says, "Ah, Room 203 is down the hall, third door on the left," and forwards your message directly to that door. You, the sender, don't have to broadcast your message to every room hoping it finds the right one; the switch takes care of delivering it to the correct recipient.

How does the switch know which door (network interface) belongs to Room 203 (a specific computer)? It maintains a list  essentially a mapping of room numbers (IP addresses) to door IDs (MAC addresses) on that floor. This is analogous to an employee directory listing who's in which room, or a guest list that the floor manager checks. If you tell the floor manager "I need to get this to Alice in Room 203," the manager quickly references the list and hands the message to the door for Room 203. In networking, switches keep a table often called a MAC address table that maps MAC addresses to the physical ports on the switch. And ARP (Address Resolution Protocol) serves as a kind of "guest list" mechanism where devices learn the MAC corresponding to a given IP so that the switch can route accordingly.

Another important point: Switches work within a single floor (single subnet). A floor manager doesn't care about what's happening on Floor 3 or Floor 10; they only deal with their floor's rooms. If you ask them about a room on another floor, they'll likely send you to the elevator (gateway) or the building concierge (router)  which we'll get to in a moment. This means a switch is typically used for LAN (Local Area Network) connectivity, forwarding data between devices in the same network segment. It uses MAC addresses (layer 2 information) to make forwarding decisions, ignoring any external networks.

To summarize the role of a switch: it efficiently connects devices within the same network. By delivering messages only to the intended recipient, it reduces unnecessary traffic (imagine if every conversation on a floor had to be shouted to all rooms  chaotic!). Switches essentially create a direct line between the sender and receiver on that floor once they know each other's addresses, much like a good floor manager quietly delivers mail to the exact office without bothering the others.

**Technical Perspective**: A network switch operates at the Data Link layer (Layer 2 of the OSI model). It's a device with multiple ports, each port usually connected to one device (or one room, in our analogy). When a frame (a data packet at Layer 2) arrives at a switch, the switch looks at the frame's destination MAC address. It consults its MAC address table to see which port (door) corresponds to that MAC. If it finds a match, it forwards the frame out only that port, effectively delivering the message to the correct device. If it doesn't know the MAC (like someone new moved into Room 203 and the floor manager hasn't met them yet), the switch may broadcast the frame to all ports on that subnet to ask "Who has this MAC address?" (this is analogous to calling out "Room 203, where are you?"). The device with that MAC will respond, and the switch learns which port that device is on and updates its table. All this happens in milliseconds. Switches greatly increase network efficiency compared to older hubs (which were like shouting to all rooms because hubs send incoming data to all other ports blindly). Also, ARP (Address Resolution Protocol) is the mechanism where a device that knows another device's IP address can learn its MAC address by broadcasting a query on the LAN. The response (from the target device) lets the sender and the switch know the mapping of IP to MAC (room number to door ID). In short, switches + ARP together ensure that within a LAN, traffic goes only where it needs to, and every device's "door" is known to the network. Remember, switches do not typically look at IP addresses or route between networks  that's the router's job (coming up next). They simply switch frames on the local network, making them one of the fundamental building blocks of a LAN.

---

*Continue to [Part 2: Moving Around the City](/posts/understanding-networks-by-analogy-2)*