---
title: "Understanding Computer Networks by Analogy: Part 1 - Buildings as Networks"
date: 2024-12-20T01:53:23+01:00
draft: false
---

> Think of a network as a building full of rooms, doors, and hallways. You move information the same way you'd move letters and packages between apartments.

License: CC BY-NC-ND 4.0

---

# Prologue: The Day Everything Stopped

The office is quiet in a way that offices should never be quiet.

No keyboards clicking. No notification sounds. No music bleeding out of someone's headphones. Just the low hum of the air conditioning and the occasional frustrated sigh.

You arrived twenty minutes ago for your first day at the new job. You were supposed to spend the morning filling out paperwork, getting your laptop configured, meeting your team. Instead, you're standing near your assigned desk watching a dozen people refresh the same unresponsive web page over and over.

"It's the network," someone says, loud enough for the room to hear. A few heads turn toward you. The new hire. The one who supposedly knows computers.

You do know computers. You can write code. You can spin up a container. You can configure a cloud instance if someone tells you which buttons to click. But the network? The actual infrastructure that connects everything to everything else? That's always been a black box. Packets go in, packets come out. Magic happens in between.

Today, the magic is broken.

Someone from IT rushes past, muttering about "the gateway" and "routing tables." You nod like you understand. You don't. Not really. You know the words the way you know the names of distant countries you've never visited. You couldn't draw a map if your life depended on it.

The outage lasts three hours. Three hours of dead screens and frustrated pacing and leadership calls that keep dropping. When connectivity finally returns, cheers ripple through the office like someone just scored a winning goal. People go back to their work as if nothing happened.

But something has changed for you.

You realized, during those three hours, that you've been building a career on foundations you don't understand. You've been renting space in a building whose floor plan you've never seen. Every day, you trust the hallways to take you where you need to go, but you couldn't explain how any of it actually works.

That needs to change.

This book is the explanation you wish someone had given you on that first day. It won't make you a network engineer overnight. But it will give you a mental model you can actually use. A map of the building, the city, and the world beyond.

The next time someone says "it's the network," you'll know what they mean. Better yet, you'll know where to start looking.

Let's begin with the building you're standing in.

---

# Part One: Buildings as Networks

## Chapter 1: Your Room in the Building

Imagine you've just moved into a new apartment building.

The building super meets you at the entrance and walks you to your unit. She points out the essentials as you go. The hallway on this floor connects about twenty apartments. Your door is the third one on the left, painted a faded blue that probably looked better in the 1990s. The number on the door is 10-101: floor ten, room one hundred and one.

She hands you a key and leaves you to unpack.

This building is your local network. Your apartment is your device. The door is your network interface. And that number on the door, the one that tells delivery drivers where to find you, is your address.

Every device on a network lives in a building like this. Your laptop, your phone, the printer down the hall, the server humming in the supply closet. Each one has a room. Each room has a door. Each door has a number.

When you want to send a message to your neighbor three doors down, you don't leave the building. You walk into the hallway, find their door, and slide the envelope underneath. The whole transaction stays on your floor. It's fast, simple, and private.

This is what happens when two devices on the same local network communicate. They don't need to involve the outside world. They're neighbors sharing a hallway.

But what happens when you need to reach someone who doesn't live in your building? We'll get there. For now, let's make sure you understand your own floor.

### The Door and Its Labels

Your door has two important identifiers.

The first is stamped into the door itself, permanently, at the factory. This is the MAC address. Think of it as a serial number that uniquely identifies this particular door in this particular building. No two doors in the world have the same one. The MAC address matters for local deliveries. When another device on your floor wants to send you something, it uses this identifier to make sure the message reaches your specific door and not someone else's.

The second identifier is written on a small placard beside the door. This is your IP address. Unlike the MAC address, this one can change. If you move to a different building, or even a different floor in the same building, you'll get a new placard. The IP address matters because it encodes not just "which door" but "which floor in which building." It's the address that makes sense to the wider world.

For now, remember the distinction this way: the MAC address is the permanent serial number on your door. The IP address is the room number that tells delivery people where to find you in the building's organization.

### A Technical Sidebar: Devices and Interfaces

You can skip this section if you're in a hurry. It fills in some practical details for the curious.

A host is any device with a network connection. Servers, laptops, phones, printers, smart thermostats. If it can send or receive data over a network, it's a host. Each host has at least one network interface, and many have several. Your laptop probably has both an Ethernet port and a Wi-Fi card. A server in a data center might have four or more physical network connections plus several virtual ones.

Each interface has its own MAC address, assigned during manufacturing. MAC addresses are 48-bit numbers, usually written as six pairs of hexadecimal digits separated by colons. Something like `AA:BB:CC:11:22:33`. You don't need to memorize the format. Just know that this address is globally unique and doesn't change unless you go out of your way to spoof it.

IP addresses come in two flavors. IPv4 addresses look like four numbers separated by dots: `192.168.1.101`. IPv6 addresses are longer and use hexadecimal: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`. Most of this book uses IPv4 examples because they're easier to read, but the concepts apply to both.

---

## Chapter 2: The Hallways Between Rooms

You've seen your door. Now look at the hallway.

Hallways in buildings can be constructed in different ways. Some are narrow and cramped. Others are wide enough for two people to pass comfortably while carrying furniture. Some stretch the length of the building. Others are short connectors between sections. Some have thick walls that muffle sound. Others let every footstep echo.

The hallway's construction affects how easily you can move through it, how many people can use it at once, and how much privacy you have while doing so.

Network connections work the same way. The "hallway" between your device and your neighbor's device is built from a physical medium. That medium has properties that determine how fast data can travel, how far it can go, and how reliable the connection will be.

Three materials dominate modern networking.

### Copper

Copper is the classic. Ethernet cables, the ones with the chunky plastic clips that snap into your laptop, are built from twisted pairs of copper wire. They're affordable, easy to install, and fast enough for most purposes. A standard office Ethernet connection delivers a gigabit per second. Fancier cables push ten gigabits or more.

Copper has limits. Signals weaken over distance. A single run of Ethernet cable shouldn't exceed about a hundred meters before you need a repeater or switch to boost the signal. And copper is vulnerable to electrical interference. If you run your network cable right next to a power line or an old fluorescent light, you might see errors and slowdowns.

Still, for connecting rooms on the same floor, copper is reliable and well understood. Most office buildings are wired with it.

### Glass

Fiber optic cables use light instead of electricity. Thin strands of extremely pure glass carry pulses of laser light across distances that would defeat copper. Where a copper run struggles past a hundred meters, fiber can span kilometers without breaking a sweat.

Fiber is also fast. Ten gigabits is common. Forty, a hundred, even four hundred gigabits per second are possible with the right equipment. When you need to move serious data over serious distances, fiber is the answer.

The downside is cost and fragility. Fiber cables are more expensive than copper. The connectors require precision. Bend a fiber cable too sharply and you'll damage it. For these reasons, fiber is typically used for the backbone connections between floors, between buildings, or across cities. Individual office workstations usually stick with copper.

### Air

And then there's the wireless option.

Wi-Fi dispenses with cables entirely. Your device sends radio waves into the air. An access point receives those waves and converts them back into data. No need to drill holes in walls or run cables across ceilings.

The convenience is obvious. You can move your laptop from the desk to the couch to the conference room without unplugging anything. Phones and tablets live their entire lives on Wi-Fi.

But wireless has trade-offs. Radio waves are a shared medium. Every device within range is competing for the same airspace. When traffic is light, this works fine. When traffic is heavy, devices have to take turns, and performance suffers. Physical obstacles like walls and floors weaken the signal. Other electronic devices, from microwaves to baby monitors, can cause interference. And because the signal travels through open air, anyone nearby can potentially eavesdrop unless you encrypt the connection.

For convenience and flexibility, wireless is hard to beat. For predictable performance and security, wired connections still have the edge.

### Bandwidth and Latency

Two terms come up constantly when discussing hallways.

Bandwidth is the width of the hallway. It describes how much data can flow through per second. A 100 Mbps connection can push a hundred million bits through every second. A 1 Gbps connection can push a billion. More bandwidth means more capacity.

Latency is the length of the hallway. It describes how long a single piece of data takes to travel from one end to the other. A latency of 10 milliseconds means a packet takes ten thousandths of a second to arrive. Lower latency means faster response times.

You can have a wide hallway that's also very long. That gives you high bandwidth but high latency. You can have a narrow hallway that's short. That gives you lower bandwidth but snappy responses. The ideal depends on what you're doing. Downloading a large file benefits from bandwidth. Playing an online game depends on latency.

### A Technical Sidebar: Physical Media Details

Copper Ethernet comes in categories. Cat5e handles gigabit speeds. Cat6 and Cat6a handle ten gigabits, though Cat6 only manages that over shorter distances. The differences are in shielding, wire quality, and twist rates. For most purposes, Cat6 is a safe choice that will serve you for years.

Fiber comes in two main types. Single-mode fiber uses a very thin core and a single beam of light. It travels longer distances with less signal loss. Multi-mode fiber uses a thicker core and multiple light paths. It's cheaper but limited to shorter runs. Data centers use both, depending on the connection.

Wi-Fi standards are named by generation. Wi-Fi 5 (802.11ac) is common in devices from the mid-2010s. Wi-Fi 6 (802.11ax) improves performance in crowded environments. Wi-Fi 6E extends into the 6 GHz band, offering more channels and less interference. Wi-Fi 7 is beginning to appear in high-end devices.

---

## Chapter 3: Floors as Subnets

Walk back out into the hallway and look around.

Your floor has about twenty apartments. Down the hall, you can see your neighbors' doors. The mailroom is around the corner. There's a shared laundry room at the end. Everyone on this floor shares the same space, the same hallways, the same elevator lobby.

Now imagine if the building had no floors. Just one enormous level with thousands of apartments sprawling in every direction. Finding anyone would be a nightmare. The hallways would be impossibly crowded. Every announcement would echo across the entire building, even if it only mattered to three people in one corner.

That's why buildings have floors. A floor groups a manageable number of rooms together. People who live near each other and need to interact regularly share a floor. Different departments, or different functions, or different tenants, get their own floors. The boundaries keep things organized.

Networks do the same thing with subnets.

A subnet is a floor in the building. It groups together a set of IP addresses that share the same network prefix. Devices in the same subnet can talk to each other directly, like neighbors walking down the hall. Devices in different subnets have to go through a gateway, like taking the elevator to a different floor.

Why bother with subnets? Three reasons.

First, broadcast control. Some network messages are sent to everyone on the segment. These broadcasts are like someone standing in the hallway and shouting. On a single floor, a few dozen people hear the shout. Manageable. If the whole building were one floor, thousands of people would hear every shout. Chaos.

Second, security. You can put sensitive resources on their own subnet and control access to that floor. The accounting servers don't need to be reachable by guest Wi-Fi devices. Separate subnets make that separation possible.

Third, organization. Subnets give structure to IP address allocation. Floor ten might use addresses starting with 192.168.10. Floor twenty might use 192.168.20. When you see an address, you can immediately tell which floor it belongs to.

### The Elevator Lobby

So how do you get from one floor to another?

Every floor has an elevator lobby. In networking terms, this is your default gateway. The default gateway is a router that connects your floor to the rest of the building and, eventually, to the outside world.

When your device wants to send a message, it asks itself one question: is the destination on my floor?

If yes, it walks down the hallway and delivers directly. No need for the elevator.

If no, it sends the message to the default gateway. The elevator takes it from there.

Your device figures this out by comparing the destination IP address against its own address and subnet mask. The subnet mask defines where the floor boundary is. If the destination falls within that boundary, it's local. If not, it goes to the gateway.

You don't need to understand the binary math right now. The concept is what matters. Same floor: deliver directly. Different floor: send to the gateway.

### A Technical Sidebar: Subnets and VLANs

A subnet mask looks like an IP address but isn't one. Common examples include 255.255.255.0 (which corresponds to a /24 network) or 255.255.0.0 (a /16 network). The mask tells you how many bits of the IP address identify the network versus the specific host.

For 192.168.10.0/24, the first 24 bits (192.168.10) identify the subnet. The remaining 8 bits identify the specific device. That gives you 254 usable addresses on this floor (192.168.10.1 through 192.168.10.254).

VLANs (Virtual LANs) let you create multiple logical floors on the same physical infrastructure. Imagine painting some doors blue and others green, then declaring that blue doors are on the "engineering floor" and green doors are on the "sales floor" even though they're physically on the same level. Traffic between VLANs has to go through a router, just like traffic between physical floors. VLANs are useful for segmenting networks without rewiring the building.

---

## Chapter 4: Sending Your First Letter

Let's put it all together.

You're sitting in your apartment, room 10-101, and you want to send a file to your colleague in room 10-115. You know their IP address. How does your message get there?

First, your computer checks: is 10-115 on my floor? The subnet mask says yes. Both addresses share the same network prefix. This is a local delivery.

But your computer only knows their IP address. To actually deliver the message, it needs their MAC address. Their door's serial number. So it sends out a broadcast: "Hey, who has IP 192.168.10.115?" This broadcast reaches every device on the floor.

The device in room 10-115 responds: "That's me. My MAC address is `AA:BB:CC:DD:EE:FF`."

Your computer notes this mapping and saves it for future use. Then it packages your file into frames, addresses each frame to that MAC address, and sends them down the hallway. The switch in the wiring closet (think of it as the hallway traffic director) makes sure the frames reach the right door.

Done. Your colleague receives the file. The whole transaction stayed on your floor.

Now imagine you want to send a file to someone on floor twenty. The same process starts. Your computer checks: is this address on my floor? The subnet mask says no. This is a different floor.

Your computer doesn't try to deliver directly. Instead, it sends the message to the default gateway, the elevator lobby. The gateway's MAC address is already known (if not, your computer will ARP for it just like before). The frame gets sent to the gateway, and from there, the building's internal routing takes over.

We'll follow that journey in Part Two. For now, you understand your floor: your room, your door, your hallways, your neighbors, and the elevator that connects you to everyone else.

---

You've been living in your building for a while now. You know your floor. You've sent plenty of messages to your neighbors. But today, you need to reach someone who doesn't live here.

Your friend lives across town, in a completely different building. To reach her, your envelope has to leave your floor, exit your building, and navigate the city's streets.

That journey begins in Part Two.
