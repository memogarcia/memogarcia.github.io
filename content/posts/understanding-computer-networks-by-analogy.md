---
title: "Understanding Computer Networks by Analogy: Part 1 - Buildings as Networks"
date: 2024-12-20T01:53:23+01:00
draft: false
---

> Think of a network as a building full of rooms, doors, and hallways. You move information the same way you'd move letters and packages between apartments.

License: CC BY-NC-ND 4.0

---

# Preface: For a Younger Version of Myself

This book is for the younger, slightly less handsome version of myself who struggled doing subnetting in my networking classes. I remember spending a lot of time trying to imagine how those "network configurations" look in real time—where they actually "live" and how that mythical network packet moves through the network. Networking is often taught as a pile of abstract layers and acronyms, but I desperately needed a way to visualize it.

That is why we are going to use analogies. Analogies are a powerful tool for understanding networks. They have their limitations, of course, because they cannot fully represent the real world. As the saying goes, "the map is not the territory." An analogy gives you a map. It gives you a tangible starting point that you can draw from when trying to make sense of the abstract reality.

Instead of jumping straight into the OSI model, we will build a mental model you can walk through. We will talk about buildings, hallways, and cities. We are prioritizing intuition over trivia, because having an intuitive map is what saves you when you are trying to untangle a confusing problem in the real world.

# Prologue: The First Outage

In 2014, a customer's production database cluster vanished from the network during a change window.

I was sitting at a terminal in their office. The lead engineer leaned over my shoulder and mentioned they had just pushed a rule change to the core firewall. He asked if someone had messed up the subnet mask on the inside interface and if we could even reach the gateway.

I opened a shell and pinged the gateway (`10.50.2.1`). Destination Host Unreachable. I ran a traceroute to the database (`10.50.2.100`) and just got timeouts.

I knew how to run the commands from the runbooks, but I couldn't interpret the output in the context of the physical topology. The engineer was trying to figure out if the firewall was routing traffic or if the ARP table was wrong because of a subnetting error. I knew the definitions of those terms from a textbook, but I couldn't picture the actual path the packets were taking. I had no intuition for how the pieces physically connected.

Many of us learn networking in the dark, during live outages, memorizing CLI commands and hoping they work. But networking is built from repeatable physical patterns. Once you can visualize how those patterns connect, the terminal output makes a lot more sense.

---

# Part One: Buildings as Networks

## Chapter 1: The Room, The Door, and the Placard

Think of moving into an apartment. The building super meets you at the entrance, hands you a key, and walks you to your unit, say room 10-101 (floor ten, room one hundred and one).

In our model, this building represents your local network, and the apartment is your device. In networking, any device capable of sending or receiving data—a laptop, phone, or server—is called a host, and every host needs a room.

Your door is your network interface. A physical Ethernet port is one door. The Wi-Fi card is another. Large servers often have multiple doors (interfaces) connecting them to different parts of the network.

Every door has two important labels dictating how mail gets delivered.

The first label is stamped right into the metal of the doorknob at the factory. This is your MAC address (Media Access Control). It’s a 48-bit permanent serial number (like `AA:BB:CC:11:22:33`) that makes this specific piece of hardware globally unique. MAC addresses are strictly for local, floor-level deliveries. If a neighbor wants to send you a note, they use that factory stamp to verify they have the right door.

The second label is the plastic placard screwed into the wall next to the door. This is your IP address (like `192.168.1.101`). Unlike the permanent stamp on your doorknob, this placard is situational. It tells delivery drivers exactly where you fit into the building's current organization. If you move your laptop to a coffee shop, your MAC address stays the same, but the coffee shop's network gives you a new IP placard that makes sense for their building.

When two devices on the same floor need to communicate, they figure out each other's local MAC addresses and send data directly. It’s fast and stays within the building. But to understand how that actually happens, we need to look at the hallways.

---

## Chapter 2: The Hallways Between Rooms

Not all connections are built the same. The physical medium connecting your device to the rest of the floor dictates how fast you can move data and how far you can travel. 

Most of the time, in standard offices, the connections are copper Ethernet cables (Cat5e or Cat6). Think of an Ethernet cable not as a shared public hallway, but as a private pneumatic tube running directly from your door to a central mailroom on your floor. It's a dedicated, point-to-point link. Copper is cheap and reliable for short distances, but if you run it past 100 meters, the electrical signal degrades.

For massive distances—connecting different floors, buildings, or cities—we use fiber optic cabling. Instead of copper wire, thin strands of glass shoot laser pulses back and forth. Fiber is incredibly fast and stretches for kilometers without losing the signal, though it's more fragile and expensive.

If you don't want cables, you use Wi-Fi. Instead of a private tube, Wi-Fi is like an open-plan shared lobby. Your device uses radio waves to talk to an access point on the ceiling. Because radio waves travel through open air, this medium is completely shared. Everyone is shouting in the same airspace. If the network is crowded or there's physical interference, your connection suffers.

### Measuring the Connection

We measure these connections using two metrics: bandwidth and latency.

Bandwidth is the width of the tube or hallway. It dictates how much data can move through it at the exact same time. A 10 Gbps fiber connection is a massive multi-lane concourse compared to a narrow 100 Mbps connection. 

Latency is the length of the connection. It measures how long it takes for a single piece of data to travel from point A to point B. A latency of 10 milliseconds means a packet arrives almost instantly. You can have high bandwidth but high latency—meaning you can carry a ton of data, but it takes a while to get there.

---

## Chapter 3: Floors as Subnets

Imagine if an apartment building had no floors and was just one endless, sprawling level containing thousands of apartments. Finding a specific unit would be difficult, and if the building super made an announcement over a megaphone, thousands of people would have to stop and listen.

Architects separate buildings into floors to group a manageable number of rooms together. Networks do this using subnets.

A subnet is a floor in the building. It logically groups together a set of IP addresses sharing the same network prefix. Devices in the same subnet can talk directly to one another. If a device wants to talk to a different subnet, it has to go through a gateway, like taking the elevator to another floor.

We break networks into subnets primarily to manage broadcast traffic. Devices constantly send out broadcast messages to everyone on the local segment (e.g., "Who has this IP address?"). On a single floor with a few dozen devices, this is fine. On a massive flat network, the noise would overwhelm everything. 

Separating things into floors also provides security and organization. You can isolate backend databases on their own floor and put guest Wi-Fi on another using VLANs (Virtual LANs). Think of a VLAN as taking a single physical floor, painting half the doors green and half blue, and logically declaring them isolated from each other.

### Finding the Boundaries and the Elevator

To keep this organized, we use a subnet mask. If an IP address is your apartment number, the subnet mask is the blueprint telling your device where the floor boundary ends. 

A subnet mask like `255.255.255.0` (or `/24`) means that if your IP is `192.168.10.101`, the first three numbers (`192.168.10`) represent the floor, giving you about 254 usable apartment numbers on that level. 

When you want to talk to someone, your device checks their IP address against the subnet mask. If they aren't on your floor, your device knows it has to hand the traffic to the default gateway. 

The default gateway is the elevator lobby. It connects your floor to the rest of the building and the outside world. If you try to reach an address outside your subnet, your device hands the traffic to the default gateway, trusting the building's infrastructure to route it. Same floor? Deliver it locally. Different floor? Hand it to the elevator.

---

## Chapter 4: Sliding the Envelope

You are in room 10-101 and need to send a document to your colleague in room 10-115. 

Your device checks the subnet mask and sees `192.168.10.115` is on the same floor. It's a local delivery. 

To physically send the data, your device needs their permanent MAC address. So, your device sends a broadcast message to the floor: "Who has IP address `192.168.10.115`? What is your MAC address?" 

This broadcast is an ARP request (Address Resolution Protocol). Everyone on the floor hears it. The colleague in room 10-115 responds: "That's my IP! My MAC address is `AA:BB:CC:DD:EE:FF`." Your computer records this in its ARP table for next time.

Now, your device packages the document into data frames, stamps the destination MAC address on the outside, and sends it down its private Ethernet tube. 

At the other end of all these tubes is a central mailroom on your floor—the Switch. The switch looks at the MAC address on your envelope, checks its directory to see which specific tube leads to that MAC address, and sends the frame down that exact path. Your colleague gets the file without anyone leaving the floor.

When you want to send a file to someone on floor twenty, the process starts the same way. Your computer realizes the destination is on a different floor. It doesn't broadcast for their MAC address; it needs the MAC address of the elevator (the default gateway). Once it has the elevator's MAC address, it stamps it on the frame and sends it to the switch. 

The switch guides the frame to the elevator lobby, and the building's internal routing takes over.