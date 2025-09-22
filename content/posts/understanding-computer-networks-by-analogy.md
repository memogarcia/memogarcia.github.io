---
title: "Understanding Computer Networks by Analogy"
date: 2024-12-20T01:53:23+01:00
draft: false
---

> Understanding computer networks is like following the journey of a letter you send to your friend across a city, navigating streets, buildings, and neighborhoods until it reaches their hands

I'm writing this for my younger (and admittedly less handsome) self back in university, who constantly struggled to grasp networking concepts, particularly subnetting.

I chose analogies for this book because they're powerful tools for understanding complicated ideas. There's an old saying: "the map is not the territory." Analogies function in a similar way. You can't perfectly map every technical detail onto an analogy one-to-one. I'll make sure to clearly indicate whenever an analogy is being stretched too far or simply doesn’t align perfectly. Being transparent about these limitations will help maintain clarity.

The story I want to tell is about how I learned networking by visualizing computer networks as buildings, with rooms, floors, and entire cities representing different network components. I'll also sprinkle in personal experiences, especially my journey moving to another country. Living in Tokyo, a megacity where even the language was completely new to me, has given me countless metaphors to understand how networks connect and communicate.

I hope you enjoy reading this as much as I've enjoyed writing and experiencing it.

## Chapter 1: Networks

Imagine you've just arrived in Tokyo, a huge and unfamiliar city. Everything around you feels new. You’ve just received the keys to your apartment, your own personal space with a unique address, much like your computer has its own IP address. Your friend also lives somewhere in this city, in another apartment with their distinct address. To send your friend a letter, your message must move through the complexity of buildings, floors, rooms, and hallways, ensuring it reaches its intended destination.

### Buildings are Networks

In this analogy, each building represents a separate network, hosting many apartments (computers). Just as buildings have specific functions (residential, commercial, industrial), networks are also designed for different purposes, such as homes, businesses, or massive data centers.

### Floors as Subnets

Buildings are divided into floors, much like networks are divided into subnets. Apartments on the same floor can easily communicate, similar to computers within the same subnet. However, getting your message to a different floor requires using specific pathways. Subnets help organize the flow of traffic, ensuring messages reach the correct destinations without confusion.

Apartment numbering makes this easy: apartment 203 is on the 2nd floor, apartment 3. Similarly, an IP address like 192.168.2.3 clearly tells you exactly where a computer is located within the subnet (floor).

### Hallways Represent Bandwidth

Wide hallways mean more people can pass through comfortably, just like a network with high bandwidth allows more data packets to move swiftly. If your floor is designed with narrow hallways, it will get congested easily, slowing down message delivery. Thus, hallways (bandwidth) must be planned according to expected traffic.

### Apartments as Computers

Each apartment represents a computer. Every apartment has doors, which serve as interfaces allowing messages (people, mail, deliveries) to enter and leave:

- Front Door: Regular visitors (primary network interface, such as Ethernet).
- Back Door: Special use or maintenance (secondary interface, such as VPN).
- Emergency Exit: Backup access, rarely used but essential (failover link).

Each door has a unique identifier, like a MAC address, ensuring deliveries and visitors arrive correctly.

Sometimes, doors break or get locked, preventing access. Similarly, network interfaces can fail or become misconfigured, causing communication problems.

### Switches: Your Friendly Floor Manager

When sending a letter to your friend in apartment 203, you don’t need to knock on every door. Instead, you hand your letter to the floor manager (the switch). The floor manager knows exactly which door belongs to apartment 203 and quickly delivers your message. Switches efficiently handle traffic within their own subnet (floor) by remembering each apartment's (computer's) location.

### Routers: The Building Concierge

If your friend lives on another floor, the floor manager passes your letter to the building concierge (router). The concierge has a detailed map (routing table) of the entire building, knowing exactly how to get your letter from your floor to your friend's floor. They select the best elevator (gateway) to carry your message efficiently.

### Gateways as Elevators

Elevators connect floors and transfer messages between them. They don’t care about the content of your message; their sole job is moving it to the right floor. Once your letter arrives on the correct floor, the floor manager there takes over again, delivering it to your friend's apartment.

### Your Letter’s Journey Across the City

Let’s follow your letter’s journey step by step:

1. You write a letter (your data packet) in your apartment (computer).
2. You give it to your floor manager (switch), who realizes your friend lives on another floor.
3. Your floor manager hands the letter to the building concierge (router).
4. The concierge checks the building map (routing table) and picks the best elevator (gateway).
5. The elevator takes your letter to your friend's floor.
6. The floor manager on your friend’s floor takes the letter and delivers it directly to your friend's apartment (computer).

Throughout this book, we'll explore each part of this journey in more detail, helping you fully grasp how networks connect and communicate by using relatable, everyday analogies from life in a city.

---

## License

*This draft is shared under [CC BY-NC-ND 4.0(https://creativecommons.org/licenses/by-nc-nd/4.0/). The final published version may contain expanded content and updates not included here.*
