---
title: "Understanding Computer Networks by Analogy - Part 1 - Networks and subnets"
date: 2020-08-20T07:53:23+01:00
draft: false
tags: networking
toc: true
---

## Prologue

There are many ways to learn something new and no approach is best. But, what works best for me is a combination of `trial and error` and learning by `first principles`. But, as someone once said:

> Knowledge is only valuable when it leads to taking action on an idea.

And as long as you share that knowledge you are taking action on an idea.

Just one big question is: **how to share them?**
I find that analogies are a great tool to do that.
They let you group together many ideas and present them as a whole to new audiences in a very fun way.

In this series of posts I propose a not so perfect analogy for computer networks represented as buildings.

## Networks or "The buildings"

This building represents a "network" of "connected rooms".

Think of each room as a computer with a room number as an [IP address](https://en.wikipedia.org/wiki/IP_address).

    room + room number == computer + ip address

![building1](/img/building1.png)

In this network, each room can communicate directly to any other room using [network protocols](https://www.cloudflare.com/learning/network-layer/what-is-a-protocol/) that will be represented as a `packages`.

But now you are wondering... I don't want to send packages to all my neighbors...I just want to communicate with specific ones.

Enter the...

## Subnets or "The floors"

By dividing your building into floors you can now isolate the communication between them.
Neighbors in the 6th floor cannot communicate with neighbors in the 9th floor.

This is called a [subnet](https://en.wikipedia.org/wiki/Subnetwork)

![floor1](/img/floor1.png)

You can identify the rooms by the room number or IP address.

Example room 69 can be idenfied as:

    floor 6, room 9

or as an IP address:

    192.168.6.9

This room number is unique to your building but the next building can have a room 69 in its building as well (I will cover this in a later post about private vs public IPs).

## Computers or "The rooms"

In reality, your room number is not tied to the physical space in the building but to the door that allows access to it.

![room1](/img/room1.png)

Which means that your room can have many doors with different properties:

1. A door for maintenance,
2. A door for guests,
3. And so on.

Within the floor (subnet) your door have a unique number called [MAC address](https://en.wikipedia.org/wiki/MAC_address)

In other words, your room is identified by an door number rather than a room number within a subnet.

    room -> door 1 -> room 69

or as a relation between Computer, MAC and IP

    computer interface eth0 -> ff:ff:ff:ff:ff:ff -> 192.168.6.9

## Series

1. [Networks and subnets or building layouts](../understanding-computer-networks-by-analogy/)
2. [Switches and Routers or how rooms can communicate between floors](../understanding-computer-networks-by-analogy-part-2/)
3. Network protocols or how rooms communicate
4. Internet, public IPs, NAT, DNS or how to connect rooms between buildings
5. High performance networking or how to speed up the communication between rooms using high speed roads and other techniques
6. SDN or dynamic floor arrangement

## Contributions

If you want contribute, please send a pull request or open an issue to this [repo](https://github.com/memogarcia/memogarcia.github.io/)