---
title: "Understanding Computer Networks by Analogy - Part 2 - Switches and Routers"
date: 2023-03-05T01:53:23+01:00
draft: false
---

Let’s keep building this analogy (pun intended) to explain more about how networks work.

Each room is a computer with a unique number (IP address) that makes it easy to locate. Hallways connect the rooms, floors act as subnets, and elevators or staircases connect the floors. But how does everything work together?

## Switches as the floor manager

Think of the switch as the floor manager. If you want to send a message to Room 203, you don’t wander around knocking on every door. Instead, the floor manager (switch) has a list of which doors (MAC addresses) belong to which rooms and quickly delivers your message to the correct one.

Switches are efficient because they only work within a single floor (or subnet). They don’t worry about what’s happening on other floors or in the rest of the building—they stick to managing traffic in their own space.

* In networking terms: A switch connects devices on the same local network (LAN) and uses MAC addresses to figure out where to send data packets.

## Routers as the building concierge

When you need to send a message to Room 504 on a different floor, the floor manager (switch) hands your message off to the building concierge—a router. The router’s job is to figure out how to get your message between floors.

The router has a detailed map of the building (a routing table) that helps it decide the best way to send your message. It chooses the fastest or most efficient elevator (gateway) to move your message to Floor 5. Once it gets there, the floor manager on Floor 5 takes over to deliver the message to Room 504.

* In networking terms: A router connects different subnets or networks and uses IP addresses to determine the best route for your data.

## Gateways as the elevators between floors

Elevators act as gateways connecting the floors. They don’t care about the contents of your message—they just move it to the correct floor. Once the elevator delivers your message, the floor manager on the destination floor takes over to ensure it reaches the right room.

* In networking terms: Gateways link different networks or subnets and ensure data is transferred correctly, even when moving between entirely different systems or protocols.

## Putting It All Together: A Message’s Journey

Here’s an example of how communication works in this building setup:

1.	Starting Point: Room 101 (your computer) wants to send a message to Room 504.
2.	Switch Takes Over: The floor manager (switch) on Floor 1 checks its records and realizes Room 504 isn’t on this floor.
3.	Hand-Off to Router: The switch passes the message to the router (concierge).
4.	Routing the Message: The router looks at its map and picks the best elevator (gateway) to get to Floor 5.
5.	Delivery on Floor 5: The elevator takes the message to Floor 5, where the local switch delivers it to Room 504.