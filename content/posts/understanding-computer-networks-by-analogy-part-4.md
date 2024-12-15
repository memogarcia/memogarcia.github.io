---
title: "Understanding Computer Networks by Analogy - Part 4 - Ports and Protocols"
date: 2023-03-04T01:53:23+01:04
draft: false
---

We’ve looked at how data finds the right building, floor, and room. But once you’re at the right room, how do you figure out what kind of service you need? Think about what happens inside a single room. A room might have different activities going on—like a guest reading a newspaper by the window, a small coffee stand in the corner, and a desk where someone can answer questions.

## Ports: Specific Service Entry Points

Imagine that each room has multiple little mailboxes or service windows, each dedicated to a different task. These mailboxes or windows are like ports. The room (computer) has one address (the IP), but it can offer many services at the same time, each at its own port. Just like a hotel room might have a separate slot for mail, room service orders, and maintenance requests, a computer can run multiple services—web, email, file sharing—each listening on a different port.

In networking terms:

* IP Address = Room Number
* Port = Specific Service Window in that Room

For example:

* Port 80 or 443: Where the room offers a web service to visitors.
* Port 25: Where the room handles incoming mail.
* Port 22: Where the room provides a secure way to connect and manage it (SSH).

A person visiting the room needs to know not just the room number (IP) but also which service window (port) they should use. Without the right port, they might knock on the wrong window and not get what they came for.

## Protocols: The Rules of Conversation

Knowing which window to approach is only half the story. Once you get to that service window, how do you talk to the person inside? You need a common set of rules or a language. In networking, these sets of rules and formats are called protocols.

Protocols define how messages are structured, what words mean, and how the back-and-forth conversation goes. Think of each service window as a booth operated by someone who only speaks a specific language. If you show up at the web service window (port 80/443) speaking HTTP, you’ll have a nice, structured conversation and get web pages as replies. But if you start speaking email commands (SMTP) at the web window, you’ll get nowhere.

In networking terms:

* HTTP or HTTPS: Protocols used when visiting websites.
* SMTP: Protocol for sending email.
* FTP: Protocol for transferring files.
* SSH: Protocol for securely managing computers remotely.

Each protocol has its own way of saying “hello,” asking for information, and ending the conversation. Without a common protocol, you and the service can’t understand each other.

## Putting It All Together: Reaching the Right Service, Speaking the Right Language

Let’s say you’re in Room 101 again and you want to load a webpage from “memo.mx.” You already know how to find the building using DNS (to get its IP), and you know the building’s public IP address.

1.	Find the Address and Port:

Your request is addressed to “memo.mx” on port 443 (a common web port for secure connections). The building’s network staff (routers and switches) bring your request to the right floor and room.

2.	Arrive at the Correct Window (Port):

Once you’re at the correct room (IP address), you ask at the window labeled “443.” This tells the occupant which service you need.

3.	Speak the Correct Protocol (Language):

You use the HTTPS protocol, saying “I’d like the homepage, please.” The occupant understands and hands you the requested webpage data.