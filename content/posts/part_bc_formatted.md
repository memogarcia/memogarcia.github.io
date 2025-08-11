# Understanding Computer Networks by Analogy - Part BC

## Routing Tables

If routers are our guides with maps, a **routing table** is essentially the map or directory that a router consults to decide the best route for a packet. It's like a list of "known destinations" and directions on how to get there.

Think of a routing table as a real-time map or cheat-sheet for the router:

- It might list, for example:
  - "All addresses starting with 203.0.113.* are via gateway A" (in network terms, a route for 203.0.113.0/24 with a next-hop).
  - "All addresses in 198.51.100.0/22 go via interface X toward neighbor B."
  - "Anything I don't have an explicit route for, send to my default gateway Z (perhaps an ISP)."

- The router uses the destination IP of each incoming packet to look up the longest prefix match in this table and figures out the next hop.

### In analogy:

It's like a sheet a traffic officer might have that says, "For any address on Maple Street, send drivers down Highway 5; for any address on Oak Street, send them via Bridge 7; if address is unknown, send them to Central Hub." It's a set of instructions for various regions of the city.

A routing table is built and updated by routing protocols (or static configuration). It's not static; if roads (links) change, the table is updated accordingly:

- For instance, if gateway A (to 203.0.113.*) goes down, the router might remove that entry or replace it with an alternate route if it knows one (maybe via a different neighbor).

- If a new network is added (say a new building pops up with a new IP block), routers that learn about it (through BGP updates, etc.) will insert a new entry like "for that new address range, go via X."

These tables can be huge on the internet core. But each router only stores the routes it needs (often the entire internet's prefixes for core routers, which is ~900k prefixes in 2021; smaller routers might not store everything if they have default routes to bigger routers).

### To use the analogy of maps:

A routing table is like a combination of a map and GPS directions in text form. The router doesn't visualize roads; it just has an entry that directly tells it which direction to send a packet.

For example, a router's entry might effectively mean: "Destination building in area code 100 (like prefix 100.x.x.x) – go north via neighbor N." It doesn't care about the exact journey after neighbor N, because it trusts neighbor N has further instructions from there. Each router just gets the packet closer.

Routers use this at incredible speed: when a packet arrives, the router performs a lookup on the destination address through its routing table (which might be structured as a tree/trie for efficient longest prefix matching). It then forwards the packet out the appropriate interface to the next hop.

One thing the analogy in the content might emphasize: routing tables are like **city maps updated in real-time**. Indeed, they adapt to conditions:

- If a road closes, routing protocols update the tables to avoid that road (like detour).
- If a new faster highway opens, the tables update to use that (like if a shorter path appears, routers will propagate that route and others will prefer it if metric indicates better path).

No matter where your message needs to go, as long as the routing tables are updated, the routers will have an entry that eventually guides it:

E.g., to get from your home to a specific server, your router might not have a direct entry, but it likely has a default route to your ISP. Your ISP's router might not have a specific entry for that server's small network, but it might have a default to a larger ISP or an entry to that general region. The bigger ISP's core router likely has a specific route to that server's network via some peer. So collectively, hop by hop, the specific route is found.

You can almost imagine the packet's address being like a phone number that each router partially decodes: first digits (prefix) tell first router which direction, next digits tell next router further, etc., though in practice routers all look at the whole IP but match the longest prefix they know.

### In smaller networks (like within a company), a routing table could be small and even static. But on the internet scale, it's dynamic and large.

For an internal example:

- In a company, a routing table might say: "for our branch office subnet 10.2.0.0/16, send to WAN router; for our data center subnet 10.3.0.0/16, send to data center link; for everything else, send to internet gateway."
- That's the map for that company's router.

So, routing tables keep track of the entire layout of connectivity that a router cares about, ensuring that no matter where a packet needs to go, the router has an idea of at least which direction to forward it next.

To tie analogy: if a city's layout changes (new roads), maps are updated – similarly if the internet's layout changes (new network appears, or link fails), routing tables are updated via routing protocols, so routers always have an up-to-date "atlas" to consult.

> **Technical Perspective:**
>
> In routing tables, entries often look like: `203.0.113.0/24 via 198.51.100.1 dev eth0 metric 100` in a Linux style, meaning send to next hop 198.51.100.1 out interface eth0.
>
> **Longest prefix match:** If a packet's dest IP is 203.0.113.5, and table has route for 203.0.113.0/24 and also a default 0.0.0.0/0, it will choose the /24 route as it's more specific.
>
> If multiple equal specifics, it may use other metrics or do load-balancing.
>
> Routing protocols populate the table. For example, OSPF calculates shortest path tree from itself to all others in area, and installs routes. BGP receives lots of prefixes from neighbors, picks the best per prefix (based on its policies) and installs those.
>
> The global BGP table is huge (~900k IPv4 prefixes as noted, plus IPv6 ~150k). Routers need large memory and fast lookup (they use specialized hardware like TCAM or algorithms like tries/compressed tries).
>
> If a new prefix is advertised via BGP (say a new company gets a block of IPs and announces it via their ISP), within seconds to a minute that gets to other routers and they add it to tables. If a prefix is withdrawn (network down), routers remove it and might rely on a less specific (like default route) or alternate path.
>
> There's something called the "default-free zone" (DFZ) which is the set of routers (like at large ISPs) that have a full table and no default route (they know how to reach every specific prefix via some neighbor). Smaller routers might not store everything – they might just default to a provider (like many home routers just send non-local traffic to ISP, not caring about specifics).
>
> **Routing table vs Forwarding table:** Routing table (RIB) is the full set of learned routes (including maybe multiple choices), the Forwarding Information Base (FIB) is what's used to actually forward (the chosen best route entries, optimized for lookup).
>
> **"Real-time updated city map":** Protocols like BGP propagate changes often within seconds for most changes, but some worst-case or policy issues can cause slower convergence. Still, on human timescales, it's near real-time adaptation.

In sum, the routing table is the tangible data structure representing the "knowledge" a router has of the network topology. Without it, a router wouldn't know where to send packets except maybe a blind default. With it, even complicated journeys can be handled stepwise.

Think of the internet like a huge puzzle, and routing tables are each router's piece of the solution – no single router sees the entire picture alone, but through distributed algorithms, each builds a piece of the map that, when used collectively, routes traffic properly.

## Traffic and Detours

In any big city, traffic patterns vary – there are rush hours, accidents, road constructions. Similarly, on the internet, sometimes the usual routes get congested or fail, and the network has to adapt by finding alternate paths, or detours, to keep data flowing.

### Analogy:

- Imagine a city with rush-hour traffic jams. If the main highway is clogged, drivers (or modern GPS apps) will look for side roads or alternate highways to reach the destination, even if it's a bit longer.

- If a road is completely closed due to an accident, traffic must reroute entirely around that section – maybe taking a loop around the city to get back on track on the other side of the closure.

- The flexibility of having multiple roads between areas makes the city resilient. If you only had one road to an area and it's blocked, you're stuck.

### In networks:

- **Congestion** is like a traffic jam: too many packets trying to go through a link than it can handle, causing delays and possibly packet loss if buffers overflow.

- Routers can detect persistent congestion (e.g., through packet loss or explicit signals) and may route packets via an alternate route if one exists and if their protocols allow it (some dynamic routing protocols can load-share or change metrics if links saturate, but classic IP routing doesn't dynamically reroute purely due to congestion – however, higher-level traffic engineering or SDN can).

- More commonly, **endpoints adjust**: TCP has congestion control algorithms that slow down the sending rate when they detect loss (like drivers easing off gas when seeing traffic).

- **Failures** (like a link or node going down) are detected by routing protocols (hello messages stop, or signals get sent) and then routers will recalculate routes to avoid that part of the network, similar to how if a road is reported closed, GPS recalculates a new route.

- This recalculation is usually automatic and fast (for example, OSPF might converge in a few seconds or less in a well-tuned network; BGP can take longer, but typically within tens of seconds for major shifts).

- While recalculating, a few packets might be lost or take a wrong turn (like drivers initially heading down a closed road and having to turn around). But soon the new detour route is in place and traffic resumes via that.

### The result is the internet is very resilient:

- You might not even notice when a major cable cut happens, because your data seamlessly detours through another path (maybe with slightly higher latency).

- For example, if a transatlantic fiber is cut, traffic might reroute through another continent's cables. It could be slower, but it still gets there – akin to a detour that's longer but keeps you moving.

- Or if a big router fails, its neighbors stop sending traffic through it and find alternatives (if available).

This adaptability is one of the design strengths of packet-switched networks. There's an oft-cited phrase: **"the Internet routes around damage"** – meaning if part of it goes down, the protocols try to find new routes as long as there's some connectivity remaining.

### However, it's not magic:

- If there truly is no alternative path (like a single cable to an island is cut and there's no satellite backup), that network gets isolated (like an island with its only bridge collapsed – no one gets in or out until fixed).

- But in the core of the internet, there are usually multiple redundant links between major hubs, so complete disconnection is rare.

### Also, traffic engineering can be done:

- Network operators sometimes proactively reroute or load-balance traffic if one path is nearing capacity. It's like city planners opening an extra lane or rerouting trucks via a bypass to ease downtown congestion.

- Protocols like BGP allow setting preferences (if one path becomes less desirable, e.g., due to cost or performance, they can shift traffic to another by adjusting route advertisements).

- New protocols and SDN (Software Defined Networking) approaches even allow near real-time traffic management – akin to smart traffic control systems.

### So, in summary:

- The internet sees periods of heavy flow (like rush hours) – e.g., when a major event is live-streamed, certain links may be very busy. Routers might then choose alternate routes or users might experience some slowdowns (like traffic slow).

- If one route is congested and an alternate exists with free capacity, some routing protocols (especially at equal cost) might split flows or a network engineer might manually adjust metrics to spread the load.

- If a link goes down (road closed), routers definitely will remove that from their tables and find any other path (if available) – a **detour**.

- Packets can find multiple ways to get to a point, so you're "never stuck in just one path" unless you're at the absolute edge of connectivity.

### From user perspective:

- Normally, you don't notice these dynamics except maybe a slight blip or increased latency if you traceroute after a problem.

- When big issues happen (e.g., a major undersea cable cut with no spare capacity), some users might see slowdowns or outages. But often traffic shifts around globally until it's fixed.

### Think of a specific scenario: Suppose a big router in New York fails:

- Traffic that normally went through New York from, say, Europe to parts of the US might reroute through other nodes like via London->Toronto->Chicago, or London->Ashburn->Chicago, etc. People might not notice except maybe a tiny delay difference.

- The network "self-heals" by these detours.

This chapter emphasizes the robustness and adaptability of the network: Even with heavy use or partial failures, it keeps "things moving" by finding other ways.

> **Technical Perspective:**
>
> **Congestion handling:** Primarily done by endpoints (TCP backing off). Network devices may implement QoS (Quality of Service) to prioritize important traffic (we have a QoS chapter coming) and may do load balancing if multiple equal-cost paths (ECMP). Some advanced networks use adaptive routing where if one path's latency rises, they switch traffic to another (some SDN or proprietary protocols can do this).
>
> **Link failure detection:** Routing protocols have hello/dead intervals (OSPF might detect in <1s if tuned, BGP might take a bit longer unless BFD (Bidirectional Forwarding Detection) is used to quickly sense loss of peer). Once detected, the protocol recalculates. OSPF finds new shortest path if available. BGP withdraws routes through that peer, and other routers will use alternate BGP routes if they have any.
>
> **Example:** In 2008, a major submarine cable cut caused Middle East traffic to reroute via different paths, leading to slower speeds – but most traffic still flowed, just via longer routes (detours).
>
> **Network redundancy design:** Good network design ensures no single failure will isolate a network – multiple links (like ring topologies in metro fiber networks allow traffic to go the other way around the ring if one side breaks).
>
> **Traffic jam analogy:** At packet level, when a link is congested, routers queue packets. If queue is full, packets drop (which TCP interprets as loss -> slow down). So it's like cars being queued at an on-ramp or being forced to slow. If it's too jammed, some "cars" never get through (packets dropped) until senders send less.
>
> **Alternate route use:** If a router has two paths to a destination (say via A or via B) and one is congested but still up, classic IP routing doesn't automatically shift traffic just due to congestion (except some multipath splitting). But some modern networks with dynamic routing metrics (like EIGRP or even OSPF TE extensions) could factor link utilization. Generally though, IP routing is not traffic-aware beyond simply splitting across equal-cost links. However, network engineers might manually adjust if persistent congestion (like re-route some BGP traffic by changing route preferences).
>
> **Resilience example stats:** The Internet has survived large-scale events (earthquakes, power outages) relatively well because of detours. E.g., after a Japan earthquake, traffic to/from Japan re-routed via other cables through different countries.

So, the Internet's ability to "find another way" is a big reason it's so reliable for communications. This was a design goal: ARPANET (precursor) was designed to still function if parts were destroyed (Cold War context), by automatically routing around damage – and it works!

Thus, even if part of a network goes down or is congested, communication can often continue **via another path** – exactly what our analogy highlights.