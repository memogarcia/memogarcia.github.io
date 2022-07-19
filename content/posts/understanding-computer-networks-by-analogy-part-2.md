---
title: "Understanding Computer Networks by Analogy - Part 2 - Switches and Routers"
date: 2020-08-21T00:53:23+01:00
draft: false
---

## Switches or "The floor concierge"

Imagine that you want to send a package from room 69 to room 62. In a typical building you cannot go to your neighbor and give them the package, it’s rude, you need to do it through the floor concierge.

The concierge or [switch](https://en.wikipedia.org/wiki/Network_switch) has a table of everyone's door numbers:

    | Floor | Room number | Door number |
    |-------|-------------|-------------|
    | 6     | 602         | 1           |
    | 6     | 609         | 1           |

Remember that each room can have many doors.

In reality the switch has a table that looks like this:

    | Vlan | MAC Address       | Port  |
    |------|-------------------|-------|
    | 6    | aa:aa:aa:aa:aa:aa | fa0/2 |
    | 6    | ff:ff:ff:ff:ff:ff | fa0/3 |

The concierge knows to which door exactly to deliver the package.

In other words, **a switch connects computers in a network**.

Now, the concierge's capacity is limited by several factors:

1. Size of the sending door - _speed of your interface_
2. Size of the receiving door - _speed of their interface_
3. Size of the hallway in which the package is moving - _"medium speed" (cable, wireless, etc.)_
4. Size of the concierge desk - _switch port speed_

![concierge1](/img/concierge1.png)

Your concierge (switch) have multple roles as well.

1. Package monitoring - _Traffic monitoring_
2. Package priority - _QoS_
3. Bundle many doors for improved speed or redundancy - _link aggregation_
4. Block packages from unwanted rooms - _MAC filtering_ or _port disabling_
5. Door monitoring - _SNMP_
6. And many more

But, what if you want to send your package to your neighbor in the 2nd floor?

Enter the...

## Routers or "The building concierge"

This building concierge or [router](https://en.wikipedia.org/wiki/Router_(computing)) is the one handling the packages from one floor to another.

In other words, **a router connects many networks together**.

Same as the floor concierge, it has a table of rooms, but it uses the room number rather than the door number.


    | Floor destination | Room quantity | Elevator door number | Room number | Notes            |
    |:-----------------:|:-------------:|:--------------------:|:-----------:|------------------|
    | 6                 | 256           | 1                    | 9           | Easy to deliver  |
    | 2                 | 256           | 1                    | 2           | Deliver at night |


This table will translate to something like this:


    | Network destination |     Netmask     |   Gateway   |  Interface  | Metric |
    |:-------------------:|:---------------:|:-----------:|:-----------:|--------|
    | 192.168.6.0         | 255.255.255.255 | 192.168.6.1 | 192.168.6.9 | 1      |
    | 192.168.2.2         | 255.255.255.255 | 192.168.2.1 | 192.168.2.1 | 10     |


The building concierge (router) has an entry for notes (metrics) to decide which route or time is best to deliver the package to its destination.

But it cannot do it alone, it needs the floors to be connected somehow... like with an elevator or [gateway](https://en.wikipedia.org/wiki/Gateway_(telecommunications))

This elevator behaves like a normal room, in the sense that it has a door, but it can move from floor to floor, which means that it has a door "assigned" in floor 2 and 6.

This door is managed by the building concierge (router) not the floor concierge (switch). When a package needs to leave the floor, the floor concierge sends the package to the building concierge and it deliver the package to its destination.

![concierge2](/img/concierge2.png)

From the floor concierge (switch) perspective, is another room with a door number (MAC Address) and it can send/receive packages in the same way as if the packages were in the same floor.

![concierge3](/img/concierge3.png)

Over time, the building concierge (router) can learn new ways to deliver the packages more efficiently and work with packages based on priority or _QoS_. 

## Series

1. [Networks and subnets or building layouts](../understanding-computer-networks-by-analogy/)
2. [Switches and Routers or how rooms can communicate between floors](../understanding-computer-networks-by-analogy-part-2/)
3. Network protocols or how rooms communicate
4. Internet, public IPs, NAT, DNS or how to connect rooms between buildings
5. High performance networking or how to speed up the communication between rooms using high speed roads and other techniques
6. SDN or dynamic floor arrangement

## Contributions

If you want contribute, please send a pull request or open an issue to this [repo](https://github.com/memogarcia/memogarcia.github.io/)