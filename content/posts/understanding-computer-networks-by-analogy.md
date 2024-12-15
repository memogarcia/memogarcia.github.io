---
title: "Understanding Computer Networks by Analogy - Part 1 - Networks and subnets"
date: 2023-03-04T01:53:23+01:00
draft: false
---

## Networks as Buildings

Think of a building with many rooms connected by hallways and staircases. Each room represents a computer, and its room number is like an IP address. Just as people move between rooms, data moves between computers. In this setup, rooms (computers) can communicate directly with each other using network protocols, which are like different languages—some rooms might “speak” Japanese, others Spanish, and so on.

1. Building = Network
2. Room + Room Number = Computer + IP Address
3. Language = Network Protocol

> Buildings have specific purposes—some are residential, others commercial, or industrial. Similarly, networks can be designed for home use, business operations, or data centers. The design of each building reflects the needs of its occupants, just like networks are optimized for their intended applications.


![building1](/img/building1.png)


## Subnets as Floors

Now, if you want to limit communication to certain areas, you can divide the building into floors. Each floor acts as a subnet, allowing rooms on the same floor to communicate freely while restricting access to other floors. This is similar to creating subnetworks in a computer network, where groups of computers can talk to each other but not to other groups.


![floor1](/img/floor1.png)

Identifying a room becomes easier: Room 101 is on Floor 1, Room 1. Similarly, a computer’s IP address might be 192.168.1.1. Remember, this room number is unique within your building, but other buildings can have a Room 101 too. So, within your building, you can reach Room 101 directly, but to contact Room 101 in another building, you need its full address (or public IP).

    Building X, Floor 1, Room 101

### Designing a Floor (Subnetting):
	
* Hall Width: Represents bandwidth. Wider halls allow more people (data packets) to move between rooms. For high-traffic areas, you’d design wider hallways (subnets with more bandwidth).
* Number of Rooms: A floor has a maximum capacity based on how many rooms you can fit (IP addresses in the subnet). Smaller floors are easier to manage, but larger floors can handle more people.

### Subnet Sizes:

* Big floors: These can host many rooms (e.g., a /16 subnet with 65,536 IPs). Useful for large offices but harder to manage.
* Small floors: Limited to a few rooms (e.g., a /30 subnet with 4 IPs), good for point-to-point links but less flexible.


## Computers as Rooms

Each room represents a computer. It has specific purposes based on its occupants and their tasks. Rooms have doors for entry and exit, which correspond to network interfaces

![room1](/img/room1.png)

Multiple Doors (Interfaces):
A single room can have several doors, each leading to different parts of the building or even outside:

* Main Door: Used for regular visitors (primary interface, e.g., Ethernet or Wi-Fi).
* Maintenance Door: For janitors or delivery services (secondary interface, e.g., VPN or dedicated management port).
* Emergency Exit: Rarely used but vital in crises (backup interface or failover link).

Each door has a unique identifier, like a MAC address, ensuring the right person or data packet reaches the right room.

* Some rooms have private, internal doors connecting to other rooms, like internal VLANs or private networks.
* If a door (interface) is locked or broken, the room becomes inaccessible to outsiders (network failure or misconfiguration).
