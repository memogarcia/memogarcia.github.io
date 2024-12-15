---
title: "Understanding Computer Networks by Analogy - Part 3 - Sending messages"
date: 2023-03-04T01:53:23+01:03
draft: false
---

So far, we’ve focused on the inner workings of a single building—our network. We’ve covered floors, rooms, switches, routers, and gateways. But what happens when you need to reach a room in another building or send something outside your own property?

## Private vs. Public IP Addresses: Inside vs. Outside the Building

Inside your building, rooms have numbers you can reuse across many buildings. Room 101 exists in this building, and another building can have a Room 101 too. These are like private IP addresses—unique within your own network, but not necessarily unique everywhere.

When you need to receive mail from outside or send something beyond your building, you need a public IP address. Think of a public IP as the official street address of your entire building. Delivery trucks (internet traffic) from other cities (networks) use it to find you. From there, your building’s staff (routers, NAT devices) figure out which specific room should receive the incoming message.

* In networking terms:
* Private IP: Your room number that only matters inside your building’s network.
* Public IP: Your building’s official street address known to everyone outside.

## DNS: The Public Directory for Computers

Imagine you want to send a letter to “Hotel Sunrise” in another city, but you don’t know its exact address. You might look it up in a telephone directory or online. In networking, this is what DNS (Domain Name System) does.

DNS acts like a giant, public directory for computer names. Instead of memorizing an IP address like 203.0.113.5, you can remember a simple name like “memo.mx.” When you send mail, your building staff (your network and DNS servers) will look up that name and find the correct address, so your message can be delivered.

* In networking terms: DNS translates human-friendly names (like websites) into IP addresses. It’s like a global phonebook for the internet.

## TCP and UDP: Different Ways to Send Messages

When you send something to another room or building, how it’s packaged and delivered matters. In networking, messages are sent in packets—little bundles of data. The two most common ways to send these packets are TCP and UDP, which work like different types of mail services.

1.	TCP (Transmission Control Protocol):

Think of TCP like a registered mail service. Every letter you send requires a confirmation that it arrived. If something gets lost, the mail carrier sends it again. It’s reliable, but this back-and-forth check can slow things down a bit.

2.	UDP (User Datagram Protocol):

UDP is like dropping a letter in a public mailbox without tracking. There’s no confirmation it arrived. It’s fast and simple, but you don’t get any guarantees. UDP is good when speed matters more than reliability, like a live audio or video stream.

In networking terms:

* TCP ensures data arrives in order and without errors, but requires more overhead.
* UDP is quick and lightweight, but might drop or misorder packets without warning.