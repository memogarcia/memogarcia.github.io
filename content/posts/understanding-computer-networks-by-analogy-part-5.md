---
title: "Understanding Computer Networks by Analogy - Part 5 - Internet"
date: 2023-03-04T01:53:23+01:05
draft: false
---

We’ve talked about your building (your network), how to find the right floor and room, and how to speak the correct language once inside. But what if you want to send messages beyond your neighborhood of buildings and reach distant places you’ve never visited before?

## The Internet: A Vast City of Buildings

If your building is one network, then imagine the internet as a massive city packed with countless buildings of all shapes and sizes: schools, offices, hotels, libraries, and more. Each building represents a different network:

* Some buildings are small homes (personal networks).
* Others are huge skyscrapers (large company networks or data centers).
* Some might specialize in certain activities (gaming servers, streaming services, online stores).

All these buildings connect together through roads, highways, and bridges. These connections are like undersea cables, fiber lines, and wireless links that span the globe. With so many buildings and complex paths, finding your way requires reliable guides and well-planned routes.

## Routers as City Maps

Inside your building, the router helps you find the right floor. But to travel across the entire city, you need a network of routers sharing their maps. When you send data out to the internet, your local router passes it along to other routers, each making a step-by-step decision to move your data closer to its destination.

This chain of routers acts like a series of street signs and traffic lights guiding you along the route. Each router knows a bit about which roads lead where, and by passing your message from router to router, the data eventually arrives at the destination building on the other side of the world.

## Routing Tables: The City’s Navigation System

How do all these routers know where to send your data? They rely on routing tables, which are like city maps updated in real-time. These maps help each router pick the best road at every intersection. If a road closes or a new road opens, routers adjust their maps to keep data flowing smoothly.

In short, routing tables keep track of the entire city’s layout so that no matter where your message needs to go, it can find a way.


## Traffic, Congestion, and Detours

Just like a city has rush hours and traffic jams, the internet sees periods of heavy data flow. When too much data travels the same route, congestion slows everything down. Routers might pick alternative routes (detours) to avoid slowdowns and keep things moving.

This adaptability makes the internet resilient. Even if one road (cable) fails, data can find a different path. Think of it like having multiple ways to get from one side of the city to the other. You’re never stuck in just one path.

## A Global Neighborhood

From your single room, inside your building, on your floor, you can reach another building on the opposite side of the globe. You do this by leveraging all the concepts we covered:

* IP and Ports: Find the right building and room.
* DNS: Translate a known name into a location you can reach.
* Protocols: Speak the right language at the right window (port).
* Routers and Gateways: Pass data through countless intersections in the global city.
* Public/Private IPs: Distinguish between private spaces and public addresses that anyone can find.

In the end, the internet is just a giant city connecting infinite buildings. While complex, it follows the same principles we’ve talked about. It’s an enormous, interconnected web of rooms, floors, and buildings, all able to send and receive messages at incredible speed.