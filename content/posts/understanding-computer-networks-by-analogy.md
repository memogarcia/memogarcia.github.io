---
title: "Understanding Computer Networks by Analogy"
date: 2024-12-20T01:53:23+01:00
draft: false
---

I'm writing this for the version of me back in university who struggled to grasp networking concepts. This isn't a full map of the networking world, but it's a starting point. If you're also finding it tricky to understand some of the ideas that make the internet works, I hope this helps.

I’m sticking with analogies here instead of going deep into technical terms—you can find those easily anywhere. I just enjoy looking at the world from different perspectives. It’s fascinating how many connections you can spot when you approach things from a new angle.

I get that analogies have their limits and sometimes you have to stretch things to make them work. In those cases, maybe it’s better to stick to first principles. But honestly, I find this approach more fun.

> For me, analogies are a powerful way to make sense of the world, especially when I’m working with abstract concepts like computer networks.
> I want to emphasize that this analogy isn’t meant to be an exact representation of the topics discussed here. It’s simply a learning tool to help you view networks from a different perspective.

## Networks as buildings

Think of a building with many rooms connected by hallways and staircases. Each room represents a computer, and its room number is like an IP address. Just as people move between rooms, data moves between computers. In this setup, rooms (computers) can communicate directly with each other using network protocols, which are like different languages—some rooms might “speak” Japanese, others Spanish, and so on.

1. Building = Network  
2. Room + Room Number = Computer + IP Address  
3. Language = Network Protocol  

> Buildings have specific purposes—some are residential, others commercial, or industrial. Similarly, networks can be designed for home use, business operations, or data centers. The design of each building reflects the needs of its occupants, just like networks are optimized for their intended applications.

---

## Subnets as floors

Now, if you want to limit communication to certain areas, you can divide the building into floors. Each floor acts as a subnet, allowing rooms on the same floor to communicate freely while restricting access to other floors. This is similar to creating subnetworks in a computer network, where groups of computers can talk to each other but not to other groups.

Identifying a room becomes easier: Room 101 is on Floor 1, Room 1. Similarly, a computer’s IP address might be 192.168.1.1. Remember, this room number is unique within your building, but other buildings can have a Room 101 too. So, within your building, you can reach Room 101 directly, but to contact Room 101 in another building, you need its full address (or public IP).

    Building X, Floor 1, Room 101

### Designing a floor (Subnetting):
- Hall Width: Represents bandwidth. Wider halls allow more people (data packets) to move between rooms. For high-traffic areas, you’d design wider hallways (subnets with more bandwidth).
- Number of Rooms: A floor has a maximum capacity based on how many rooms you can fit (IP addresses in the subnet). Smaller floors are easier to manage, but larger floors can handle more people.

### Subnet sizes:
- Big floors: These can host many rooms (e.g., a /16 subnet with 65,536 IPs). Useful for large offices but harder to manage.
- Small floors: Limited to a few rooms (e.g., a /30 subnet with 4 IPs), good for point-to-point links but less flexible.

---

## Computers as rooms

Each room represents a computer. It has specific purposes based on its occupants and their tasks. Rooms have doors for entry and exit, which correspond to network interfaces.

### Multiple Doors (Interfaces):
A single room can have several doors, each leading to different parts of the building or even outside:
- Main Door: Used for regular visitors (primary interface, e.g., Ethernet or Wi-Fi).
- Maintenance Door: For janitors or delivery services (secondary interface, e.g., VPN or dedicated management port).
- Emergency Exit: Rarely used but vital in crises (backup interface or failover link).

Each door has a unique identifier, like a MAC address, ensuring the right person or data packet reaches the right room.

- Some rooms have private, internal doors connecting to other rooms, like internal VLANs or private networks.
- If a door (interface) is locked or broken, the room becomes inaccessible to outsiders (network failure or misconfiguration). 

Let’s keep building this analogy (pun intended) to explain more about how networks work.

So far, we’ve focused on the inner workings of a single building—our network. We’ve covered floors, rooms, switches, routers, and gateways. But what happens when you need to reach a room in another building or send something outside your own property?

---

## Switches as the floor manager

Think of the switch as the floor manager. If you want to send a message to Room 203, you don’t wander around knocking on every door. Instead, the floor manager (switch) has a list of which doors (MAC addresses) belong to which rooms and quickly delivers your message to the correct one.

Switches are efficient because they only work within a single floor (or subnet). They don’t worry about what’s happening on other floors or in the rest of the building—they stick to managing traffic in their own space.

- In networking terms: A switch connects devices on the same local network (LAN) and uses MAC addresses to figure out where to send data packets.

---

## Routers as the building concierge

When you need to send a message to Room 504 on a different floor, the floor manager (switch) hands your message off to the building concierge—a router. The router’s job is to figure out how to get your message between floors.

The router has a detailed map of the building (a routing table) that helps it decide the best way to send your message. It chooses the fastest or most efficient elevator (gateway) to move your message to Floor 5. Once it gets there, the floor manager on Floor 5 takes over to deliver the message to Room 504.

- In networking terms: A router connects different subnets or networks and uses IP addresses to determine the best route for your data.

---

## Gateways as the elevators between floors

Elevators act as gateways connecting the floors. They don’t care about the contents of your message—they just move it to the correct floor. Once the elevator delivers your message, the floor manager on the destination floor takes over to ensure it reaches the right room.

- In networking terms: Gateways link different networks or subnets and ensure data is transferred correctly, even when moving between entirely different systems or protocols.

---

## Putting It All Together: A Message’s Journey

Here’s an example of how communication works in this building setup:

1. Starting Point: Room 101 (your computer) wants to send a message to Room 504.
2. Switch Takes Over: The floor manager (switch) on Floor 1 checks its records and realizes Room 504 isn’t on this floor.
3. Hand-Off to Router: The switch passes the message to the router (concierge).
4. Routing the Message: The router looks at its map and picks the best elevator (gateway) to get to Floor 5.
5. Delivery on Floor 5: The elevator takes the message to Floor 5, where the local switch delivers it to Room 504.

---

## Private vs. Public IP Addresses: Inside vs. Outside the Building

Inside your building, rooms have numbers you can reuse across many buildings. Room 101 exists in this building, and another building can have a Room 101 too. These are like private IP addresses—unique within your own network, but not necessarily unique everywhere.

When you need to receive mail from outside or send something beyond your building, you need a public IP address. Think of a public IP as the official street address of your entire building. Delivery trucks (internet traffic) from other cities (networks) use it to find you. From there, your building’s staff (routers, NAT devices) figure out which specific room should receive the incoming message.

- In networking terms:
  - Private IP: Your room number that only matters inside your building’s network.
  - Public IP: Your building’s official street address known to everyone outside.

---

## DNS: The Public Directory for Computers

Imagine you want to send a letter to “Hotel Sunrise” in another city, but you don’t know its exact address. You might look it up in a telephone directory or online. In networking, this is what DNS (Domain Name System) does.

DNS acts like a giant, public directory for computer names. Instead of memorizing an IP address like 203.0.113.5, you can remember a simple name like “memo.mx.” When you send mail, your building staff (your network and DNS servers) will look up that name and find the correct address, so your message can be delivered.

- In networking terms: DNS translates human-friendly names (like websites) into IP addresses. It’s like a global phonebook for the internet.

---

## TCP and UDP: Different Ways to Send Messages

When you send something to another room or building, how it’s packaged and delivered matters. In networking, messages are sent in packets—little bundles of data. The two most common ways to send these packets are TCP and UDP, which work like different types of mail services.

1. **TCP (Transmission Control Protocol):**
   - Think of TCP like a registered mail service. Every letter you send requires a confirmation that it arrived. If something gets lost, the mail carrier sends it again. It’s reliable, but this back-and-forth check can slow things down a bit.

2. **UDP (User Datagram Protocol):**
   - UDP is like dropping a letter in a public mailbox without tracking. There’s no confirmation it arrived. It’s fast and simple, but you don’t get any guarantees. UDP is good when speed matters more than reliability, like a live audio or video stream.

In networking terms:
- TCP ensures data arrives in order and without errors, but requires more overhead.
- UDP is quick and lightweight, but might drop or misorder packets without warning.

---

## Ports: Specific Service Entry Points

Imagine that each room has multiple little mailboxes or service windows, each dedicated to a different task. These mailboxes or windows are like ports. The room (computer) has one address (the IP), but it can offer many services at the same time, each at its own port. Just like a hotel room might have a separate slot for mail, room service orders, and maintenance requests, a computer can run multiple services—web, email, file sharing—each listening on a different port.

- **IP Address = Room Number**  
- **Port = Specific Service Window in that Room**  

For example:  
- **Port 80 or 443:** Where the room offers a web service to visitors.  
- **Port 25:** Where the room handles incoming mail.  
- **Port 22:** Where the room provides a secure way to connect and manage it (SSH).

---

## Protocols: The Rules of Conversation

Knowing which window to approach is only half the story. Once you get to that service window, how do you talk to the person inside? You need a common set of rules or a language. In networking, these sets of rules and formats are called protocols.

Protocols define how messages are structured, what words mean, and how the back-and-forth conversation goes. Think of each service window as a booth operated by someone who only speaks a specific language. If you show up at the web service window (port 80/443) speaking HTTP, you’ll have a nice, structured conversation and get web pages as replies. But if you start speaking email commands (SMTP) at the web window, you’ll get nowhere.

- **HTTP or HTTPS:** Protocols used when visiting websites.  
- **SMTP:** Protocol for sending email.  
- **FTP:** Protocol for transferring files.  
- **SSH:** Protocol for securely managing computers remotely.

---

## Putting It All Together: Reaching the Right Service, Speaking the Right Language

Let’s say you’re in Room 101 again and you want to load a webpage from “memo.mx.” You already know how to find the building using DNS (to get its IP), and you know the building’s public IP address.

1. **Find the Address and Port:**  
Your request is addressed to “memo.mx” on port 443 (a common web port for secure connections). The building’s network staff (routers and switches) bring your request to the right floor and room.

2. **Arrive at the Correct Window (Port):**  
Once you’re at the correct room (IP address), you ask at the window labeled “443.” This tells the occupant which service you need.

3. **Speak the Correct Protocol (Language):**  
You use the HTTPS protocol, saying “I’d like the homepage, please.” The occupant understands and hands you the requested webpage data.

---

## The Internet: A Vast City of Buildings

If your building is one network, then imagine the internet as a massive city packed with countless buildings of all shapes and sizes: schools, offices, hotels, libraries, and more. Each building represents a different network:

- Some buildings are small homes (personal networks).  
- Others are huge skyscrapers (large company networks or data centers).  
- Some might specialize in certain activities (gaming servers, streaming services, online stores).

All these buildings connect together through roads, highways, and bridges. These connections are like undersea cables, fiber lines, and wireless links that span the globe. With so many buildings and complex paths, finding your way requires reliable guides and well-planned routes.

---

## Routers as City Maps

Inside your building, the router helps you find the right floor. But to travel across the entire city, you need a network of routers sharing their maps. When you send data out to the internet, your local router passes it along to other routers, each making a step-by-step decision to move your data closer to its destination.

This chain of routers acts like a series of street signs and traffic lights guiding you along the route. Each router knows a bit about which roads lead where, and by passing your message from router to router, the data eventually arrives at the destination building on the other side of the world.

---

## Routing Tables: The City’s Navigation System

How do all these routers know where to send your data? They rely on routing tables, which are like city maps updated in real-time. These maps help each router pick the best road at every intersection. If a road closes or a new road opens, routers adjust their maps to keep data flowing smoothly.

In short, routing tables keep track of the entire city’s layout so that no matter where your message needs to go, it can find a way.

---

## Traffic, Congestion, and Detours

Just like a city has rush hours and traffic jams, the internet sees periods of heavy data flow. When too much data travels the same route, congestion slows everything down. Routers might pick alternative routes (detours) to avoid slowdowns and keep things moving.

This adaptability makes the internet resilient. Even if one road (cable) fails, data can find a different path. Think of it like having multiple ways to get from one side of the city to the other. You’re never stuck in just one path.

---

## A Global Neighborhood

From your single room, inside your building, on your floor, you can reach another building on the opposite side of the globe. You do this by leveraging all the concepts we covered:

- IP and Ports: Find the right building and room.  
- DNS: Translate a known name into a location you can reach.  
- Protocols: Speak the right language at the right window (port).  
- Routers and Gateways: Pass data through countless intersections in the global city.  
- Public/Private IPs: Distinguish between private spaces and public addresses that anyone can find.

In the end, the internet is just a giant city connecting infinite buildings. While complex, it follows the same principles we’ve talked about. It’s an enormous, interconnected web of rooms, floors, and buildings, all able to send and receive messages at incredible speed.

---

## ISPs: The Utility and Road Builders

An ISP is responsible for laying the roads (cables, fiber lines, wireless connections) that link your building to the rest of the city. Without them, you’d be isolated, cut off from all the other buildings and services. Just like you depend on water and electricity companies for everyday needs, you rely on your ISP to deliver internet access.

- **In networking terms:** Your ISP provides the “last mile” connection, the pipeline that brings data from the global internet (the city) straight to your building’s doorstep.

---

## Infrastructure and Maintenance

ISPs maintain and upgrade the infrastructure that keeps data flowing smoothly. When roads wear out or become too crowded, ISPs add new cables, improve existing links, and invest in better equipment. They also monitor traffic patterns and help ensure fair and steady data flow.

This investment and maintenance keep your connection stable and efficient. Without it, you’d experience slow speeds, frequent outages, or poor reliability.

---

## Peering and Interconnection

Imagine multiple utility companies that operate in different parts of the city. To give you access everywhere, they form partnerships and connect their networks at certain points. This process, called peering, ensures that even if you’re signed up with one ISP, you can still reach buildings served by another ISP.

- **In networking terms:** ISPs build or lease connections to each other at Internet Exchange Points (IXPs). These “meeting places” let traffic flow smoothly across different networks, giving you access to content and services from all over the city and beyond.

---

## Different Tiers and Roles

Not all ISPs are the same. Some are local providers who focus on getting you connected at home. Others are large “Tier 1” ISPs who provide the backbone infrastructure connecting entire regions or countries. These top-tier ISPs are like massive highway developers, running huge pipes of bandwidth to ensure that everyone else can build their smaller roads off of them.

- **Local ISP:** Brings the “last mile” connection directly to your building.  
- **Regional ISP:** Covers a bigger area, often connecting multiple local ISPs.  
- **Tier 1 ISP:** Runs the main highways of the internet, ensuring global coverage.

---

## Enabling Global Communication

Ultimately, ISPs are the reason your building can talk to any other building in the world. They maintain and expand the web of roads, highways, and tunnels (fiber, cables, wireless links) that let data travel far and wide. By doing so, they empower you to reach beyond your own four walls, floors, and networks—into the vast city of the internet.

---

## Network Security: Locking Doors and Guarding Entrances

Think of network security as setting up locks, guards, and checkpoints throughout your building. Firewalls are like gates that check everyone coming in or going out. They allow only approved visitors (traffic) and block suspicious ones. Encryption is like sealing letters in tamper-proof envelopes, making sure that even if someone intercepts them, they can’t read the contents. By adding these security measures, you prevent break-ins, theft, and damage to your property.

---

## VPNs and Tunnels: Secret Passages Between Distant Buildings

A Virtual Private Network (VPN) acts like a hidden passageway that connects your building to another one, far away. Even though these buildings are separated by city blocks (different networks), the VPN tunnel creates a secure, private route. Outsiders see only the regular streets, but you and your partner building use a hidden corridor that keeps your conversations confidential. It’s a way to communicate securely, even in a crowded city.

---

## Load Balancing and Redundancy: Sharing the Work and Having Backups

Large networks get busy, just like bustling hotel lobbies at check-in time. Load balancers are like extra staff members who guide guests to different reception counters so that no single counter is overwhelmed. This splits the workload evenly, speeding things up and improving service. Redundancy ensures that if one route, staff member, or piece of equipment fails, another is ready to take over. This keeps everything running smoothly, even when problems arise.

---

## Content Delivery Networks (CDNs): Local Branches for Faster Access

When you want something delivered quickly, it helps if there’s a local branch nearby. CDNs are like little storage hubs placed around the city. Instead of making you travel across town, the CDN lets you pick up what you need from a closer location. This reduces travel time (latency) and makes the experience faster for everyone. By caching popular content in many places, CDNs help websites load quickly no matter where you are.

---

## Cloud Computing: Renting Rooms in Someone Else’s Building

Sometimes you don’t need to build your own floors or maintain your own rooms. You can rent space in someone else’s massive skyscraper where they handle all the maintenance and services. Cloud computing lets you pay for what you use, scale up if you need more space, and scale down when you don’t. It’s like having access to a fully-staffed, well-maintained building without needing to construct anything yourself.

---

## Quality of Service (QoS): Priority Lanes for Important Traffic

Not all traffic is equal. Some messages are urgent (video calls), while others are less time-sensitive (emails). QoS acts like special priority lanes on the road. Important vehicles (data packets) get to bypass traffic jams, ensuring smooth, uninterrupted communication. This helps critical services run smoothly while still allowing everyday traffic to flow at a reasonable pace.

---

## NAT (Network Address Translation): Translating Room Numbers at the Door

Your building uses private room numbers internally, but outside visitors rely on your building’s public address. NAT is like having a front desk clerk who translates the building’s single public street address into the correct internal room number. When data arrives from the internet, NAT directs it to the right room. When data leaves your building, NAT replaces the room number with the building’s public address. It’s how multiple rooms share one public-facing identity.

---

## Network Monitoring and Logging: Keeping Track of Who Comes and Goes

Just as a concierge might note who enters and leaves, network monitoring and logging keep records of data traveling through your building. This can help identify suspicious activity, diagnose problems, and ensure that everything is running as expected. By reviewing these logs, you can find out if someone tried to sneak in, where things got delayed, and what adjustments to make next time.

---

## Software-Defined Networking (SDN): Reconfiguring Rooms and Hallways on the Fly

Usually, changing a building’s layout takes time and money. But SDN is like having the ability to rearrange rooms and hallways instantly with a remote control. Instead of physically rewiring things, you use software to shape how data flows. This gives you agility—if you need a new passage or want to close a certain hallway, you can do it with a few clicks, adapting to changes in real-time.

---

## IPv4 and IPv6: Different Ways of Numbering Rooms

Early on, buildings used a certain numbering system for rooms (IPv4), but as the city grew, they began to run out of unique numbers. IPv6 came along with a much larger numbering scheme, ensuring there are enough unique addresses for every possible room. It’s like upgrading from a simple numbering system to one with far more digits, so you never run out of unique room numbers again.

---

## Network Topologies: Mapping the Rooms, Floors, and Buildings

A network topology is like the blueprint that shows how rooms connect to each other, how floors are laid out, and how buildings link to the city. Some designs arrange rooms in a line (bus topology), others form loops (ring), or branch out like trees (star or hierarchical). The way you arrange connections can affect speed, reliability, and how easy it is to add more floors or rooms. Choosing the right topology ensures that your building runs efficiently, is easy to manage, and scales as you grow.
