---
title: "Understanding Computer Networks by Analogy - Part 1 - Networks and subnets"
date: 2023-03-04T01:53:23+01:00
draft: false
---

## Networks or "The buildings"

Imagine a building with many rooms connected by hallways and staircases. This building is a lot like a computer network, where each room is a computer with its own room number called an IP address. Just like people move between rooms in a building.


![building1](/img/building1.png)

In this building, each room can communicate directly to any room. That communication is done using [network protocols](https://www.cloudflare.com/learning/network-layer/what-is-a-protocol/). Each network protocol is like a language, some rooms communicate with others in Japanese, some other in Spanish, and so on.

    building           => network
    room + room number => computer + ip address
    language           => network protocol


## Subnets or "The floors"

But what if you don't want to communicate with everyone in the building? That's where [subnets](https://en.wikipedia.org/wiki/Subnetwork) come in. By dividing the building into floors, you can isolate communication between them. This is like creating subnetworks in a computer network, where groups of computers can communicate with each other but not with other groups.

![floor1](/img/floor1.png)

Now is easy to identify a room in a building by its floor and room number.

Example room 101 can be idenfied as:

    floor 1, room 1

Similarly, you can represent a computer by its IP address:

    192.168.1.1

Remember that this room number is unique to your building and each building can have a room 101 in its building as well.

For example, within your building you can communicate with room 101 using its room number, but if you want to communicate with room 101 in another building, you need to use its full address (or its public IP)

    building X, floor 1, room 101

## Computers or "The rooms"

In reality, a room number is not tied to the physical space in that floor but to the door that allows access to it.

![room1](/img/room1.png)

A single room in your floor can have many doors, each door can have a different purpose.

    1. A main door,
    2. A door for maintenance,
    3. And so on.

This is similar to:

    1. Wifi interface,
    2. Ethernet interface,
    3. And so on.

Each door is identified by its name or [MAC address](https://en.wikipedia.org/wiki/MAC_address) and any message sent to that room is sent to a specific door in that room.

In other words, your room is identified by an door number rather than a room number within a subnet.

    room -> door 1 -> room 101

or as a relation between Computer, MAC and IP

    computer interface eth0 -> ff:ff:ff:ff:ff:ff -> 192.168.1.1

