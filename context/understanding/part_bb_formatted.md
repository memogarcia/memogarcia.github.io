# Understanding Computer Networks by Analogy - Part BB

## The Internet: A City of Buildings

**Figure:** The entire internet visualized as a vast cityscape of interconnected buildings (networks) linked by roads and highways (communication links). If your building is one network, then imagine the internet as a massive city filled with countless buildings of all shapes and sizes: homes, offices, skyscrapers, data centers, schools, etc. Each building represents a different network.

Let's build on that:

- **Some buildings are small houses** – these could be personal home networks or small office networks. They might have just a handful of rooms (devices).

- **Others are huge skyscrapers** – these might be large corporate networks or big data centers with thousands of servers (rooms) and complex internal structures.

- **Some buildings specialize in certain activities** – like a library building could be analogous to a network of servers for a search engine, or a streaming service's data center might be like a giant multiplex cinema building (specialized for delivering video).

- **City infrastructure** – the buildings are connected by roads, highways, and bridges which are like the internet's physical infrastructure (copper/fiber cables, wireless links, satellite links). These links interconnect the networks, allowing data to travel from one building to another.

### In this city:

- If you want to send data from your network (building) to another network (another building across town or across the globe), your data travels through these roads (network links).

- Just as a city has local streets, arterial roads, highways, the internet has local links (like your Ethernet or Wi-Fi connecting to your router), regional links (your ISP's network connecting to other ISPs), and backbone links (major international fiber routes).

- **Routers are like the traffic lights and signs at intersections** that guide packets along the correct route through this city. Actually, routers in different networks exchange information (via routing protocols) to know how to reach various "addresses" (IP prefixes) across the city.

One point to note: the internet is literally a **network of networks** – that's the origin of the name (inter-network). Each network (building) is managed by some entity (people or organizations) and they agree to connect (through contracts or peering agreements) at exchange points (like roads meeting at city boundaries). There's no single owner of the whole "city" – it's a collaborative, decentralized system, much like a city grows with contributions from many builders and planners.

### In our city analogy:

- Your **home network** is a house on a street. The street connects to a neighborhood road (your ISP's local node).
- That **neighborhood road** connects to a highway (the ISP's backbone).
- The highway might lead to other highways (inter-provider connections).
- Eventually, to reach another city (say a server in another country), data might traverse undersea cables (bridges across oceans) and arrive in that region's network roads.

## An example path:

When you accessed memo.mx in the earlier example, perhaps:

1. Your data left your house (home network) and got on your ISP's local road.
2. It then hit a major router (maybe at a regional datacenter) which put it on a high-speed backbone (an internet highway).
3. It traveled across states or countries on that backbone.
4. Reached an exchange point where memo.mx's network (or its CDN's network) connected with your ISP or their transit provider.
5. Then it went into memo.mx's network (the building's local roads) and to the server.

The figure caption mentions **city of buildings connected by roads, highways, bridges... spanning the globe, requiring guides and routes**. We'll get into how routers act as city maps and how global routing works next.

In a city, finding your way from one building to another might require consulting a map or asking directions at multiple points. On the internet, no single router knows the whole path to every network, but through routing protocols they each know next steps – like a series of signposts taking you closer to the destination.

### So envision the internet as a global metropolis:

- **Data packets** are like vehicles traveling.
- **IP addresses** are like street addresses.
- **Routers** are like navigation signposts or even traffic cops at intersections guiding packets based on addresses.
- **Links** are the roads – some are small (low bandwidth), some are multi-lane highways (high bandwidth fiber).
- Certain places like **Internet Exchange Points** are major interchanges where many networks meet (like a big highway junction connecting many roads).

This city is constantly bustling with billions of packets moving at any given second. But despite the chaos, the system is designed to route each packet to its destination building quickly.

### A remarkable thing is the scale:

Just as a huge city has to manage millions of people moving around, the internet handles an enormous scale of data. But the principles we learned still apply globally, just with more intermediate steps:

- Your data may hop through 10–20 routers (hops) before reaching a distant server. Each router is like a checkpoint in the city where routing decisions are made (like "take the next highway exit toward that region").

- Protocols like **BGP (Border Gateway Protocol)** are used between networks (buildings) to share route information – they essentially are agreements that "my network can reach these addresses, send that traffic my way" etc. That's the city's guidebook being constantly updated (we'll likely discuss BGP implicitly with city maps analogies).

All this is to realize that **from your single room, inside your building, on your floor, you can reach another building on the opposite side of the globe**. That is like being able to send a courier from your office to any other office worldwide thanks to this interconnected city of networks. It's quite amazing – and it works because of the layered structure and cooperation of different entities.

In the coming sections, we'll discuss more about the roles of routers in this city (maps), how traffic is managed (detours), and who builds and maintains these roads (ISPs) in this city-of-the-internet.

But for now, hold the mental image that the **internet = an immense city of networks**, where each network (building) can communicate with any other via the network of roads (the internet infrastructure), guided by routers (the city's navigation system).

> **Technical Perspective:**
>
> At this city level, the key topics are:
>
> **Autonomous Systems (AS):** Each building (network) can be an AS with an ID number. They exchange reachability info using BGP (the protocol of the city roads). BGP tells routers in different ASes which IP blocks are reachable via which neighbors (like, "to reach building X's addresses, go through me").
>
> The internet's structure is not a simple hierarchy, but more a mesh of interconnections, though there are major "tier 1" networks (we will likely cover this in ISP roles). They form the core highways connecting continents and countries.
>
> **Internet Exchange Points (IXPs):** Locations where many ASes meet to exchange traffic freely or at low cost, like big transportation hubs.
>
> **Propagation of data:** The "global city" sees data sometimes traveling surprisingly indirect routes (due to economics or link availability). A packet from one city to a nearby city might sometimes route via a far city if direct links are congested or not present – akin to a flight with a layover in another country. But generally, the network tries to route in a reasonable way.
>
> The core idea of the internet as network-of-networks means each network can have its own internal design (like one building could be ring inside, another star inside) – BGP doesn't care about that, it treats each as a node that can forward to certain address ranges.
>
> End-users don't see this complexity; we use DNS names and get our data. But traceroute (a diagnostic tool) can show you the intermediate hops, often revealing city or ISP names (like you might see a path go through ae-1-51.edge3.NewYork.Level3.net etc., indicating a router in New York).
>
> It's decentralized: if one part of the internet (a set of buildings or a major highway) goes down, routers recalc routes to detour traffic (like after an earthquake cuts a fiber, traffic can often reroute the long way around the globe if needed).

In summary, on the global scale, the building analogy helps visualize that your data doesn't magically jump from your network to another – it travels through a series of connected networks. Routers at each boundary make decisions on where next to send it based on their "city map" knowledge (routing tables). We'll explore that next (Routers as City Maps & Routing Tables chapters).

## Routers as City Maps

Inside your building, the router acted like a concierge with a map of floors. In the city-sized internet, routers act like a network of knowledgeable traffic guides, each holding a partial map of the city that helps them direct data along streets and highways toward its destination.

### Consider how you might drive across a country:

- You don't have a single sign telling you the entire route. Instead, at each major intersection or highway junction, there are signs pointing you toward the next city or region. By following those step by step, you eventually reach the target city.

- Similarly, no single router knows the full path to every possible network, but it knows (thanks to routing protocols) the direction (next hop) to send packets for each destination network, or at least for large regions (IP prefixes).

Routers share information with each other to build a **routing table**, which is like an ever-updating map or GPS system for the internet roads. Each router's map isn't visual but in data form: entries like "Network X can be reached via Router Y" – basically pointers to which road (interface) leads closer to that network.

### When you send data out to the internet:

1. Your local router (in your house or ISP) might not know exactly where "203.0.113.5" is, but it knows "I should send this to my upstream router at the ISP" (like getting on the on-ramp to the highway).

2. The ISP's core router receives it and consults its routing table (map). Maybe it sees that IP 203.0.113.0/24 is reachable via a peer connection to AnotherISP. So it forwards it that way.

3. That next ISP's router might know exactly which of its customers or routes handles 203.0.113.5 and sends it onward to the destination's router.

This chain of routers is like a series of **street signs and traffic lights guiding you along the route**. Each router knows a bit about which direction (which neighboring router) leads closer to various destinations.

### Routers communicate among themselves using routing protocols:

- **Within a single organization** (an Autonomous System), they might use protocols like OSPF or IS-IS (like an internal map for that company network).

- **Between organizations**, they use BGP (Border Gateway Protocol) to exchange reachability info (like different city's transportation departments coordinating: "to reach addresses in my area, send traffic to me").

- BGP doesn't give a detailed map of every hop, but rather the high-level routes (like highway routes between ASes).

So, you can imagine each router has a mini-map (routing table) that says:

- Destinations in Network A – go out interface 1 (toward Router X).
- Destinations in Network B – go out interface 2 (toward Router Y).
- Everything else (maybe default route) – send to big upstream router Z.

As data goes from router to router, the address on the packet (the destination IP) stays the same, but each router is essentially reading that address and consulting its map for the best next hop.

If there's a change in the "city" – say a road closes (link goes down) or a new road opens – routers update each other (BGP updates, OSPF flooding updates) so they can adjust the routes. This is akin to a live traffic-aware GPS re-routing you if it detects a road closure or jam (which we'll explore more in Traffic and Detours chapter).

### Routers as city maps also implies:

- They have to store and update these maps (routing tables). Internet core routers have extremely large routing tables (on the order of 900k+ routes as of 2021 and growing) – basically entries for every public network block. They update them in real-time as BGP announcements happen (like some network goes down, BGP withdrawals propagate; new network appears, BGP announcements propagate).

- They base decisions typically on things like shortest paths (in OSPF/IS-IS metrics or BGP policies which can also include business preferences, not just physical distance).

- Each router acts independently, in the sense that it uses its local table to forward, but that table is built by cooperating with other routers. It's a distributed system – no single router knows the whole Internet perfectly, but collectively they route packets to destinations effectively.

### To put in analogy:

Think of a network of city maps and guides: Each router is a guide at an intersection. You (the packet) reach a guide, show the guide the address (IP) you need to reach. The guide quickly checks its map (routing table) and points you down a certain road (interface) saying "head that way." You follow that road to the next guide. Eventually one guide says "oh, this address is actually in a building just down this street – go straight and you'll see it" (that's the last router connected to the destination network, which then hands the packet to the destination device).

If a road was closed, a guide would know because their map updates (maybe a fellow guide told them via protocol). So then at a prior intersection, they'd point you on a detour route.

So, routers collectively form the navigation infrastructure of the global internet, ensuring that from any source building to any destination building, there is a path (or multiple) and that packets will be guided along it step by step.

> **Technical Perspective:**
>
> **Routing Table Entries:** Typically have an IP prefix (destination network) and a next-hop (and interface). They might also have metrics or preferences. Longest prefix match is used (most specific route wins).
>
> **Interior Gateway Protocols (IGPs):** e.g., OSPF (Open Shortest Path First), IS-IS (Intermediate System to Intermediate System) – used within an AS to propagate routes. They create a complete view of network topology and calculate shortest paths. That's like each guide within one organization having the full map of that organization's roads.
>
> **Exterior Gateway Protocols:** e.g., BGP – used between ASes. BGP doesn't consider "shortest path" in a simple way, it uses policies and AS hop counts. It's more like a trade network – each AS announces which destinations (prefixes) it can deliver to, and neighbors decide which announcement to use based on factors (like shortest AS path, local pref, etc.). BGP routers thus know, for each prefix, an AS path (route through other networks) to reach it and a next-hop router. They then advertise that to their neighbors (with their own AS added to path).
>
> A router at the edge of an ISP might have routes like:
> - 203.0.113.0/24 via Peer1 (AS path says through SomeISP)
> - 198.51.100.0/22 via Peer2
> - 0.0.0.0/0 via Upstream (default route for all else).
>
> Each router's FIB (Forwarding Information Base) is optimized for fast lookup, often in hardware (TCAM, etc.) so it can route millions of packets per second.
>
> **Convergence:** When network changes occur, routing protocols converge (IGPs usually in < second for small networks, BGP can take longer globally). During convergence, like if a major fiber cut, some packets might get lost or loop until everyone updates their maps.
>
> The internet doesn't have a single "map server" – it's distributed. Each BGP router exchanges info with neighbors. Over time, this results in a fairly consistent set of routes (with minor transient differences).
>
> Analogous to maps: People often compare routing to maps and GPS. In fact, algorithms like Dijkstra's used in OSPF are essentially what a GPS does (shortest path). BGP's analogy is more policy-driven routing – it's like preferring certain roads due to business deals (e.g., an ISP might prefer sending through a peer (free) vs a transit (paid) even if slightly longer).

So, routers truly are the "maps" and "guides" making the global network navigable. Without them, having addresses alone wouldn't be enough – you need to know how to get to an address.

In simpler terms: If IP addresses are like street addresses, routers and routing protocols are like the entire postal system's routing logic that figures out how mail should travel from any post office to any other. We users usually don't see it, but that system of logistics is what makes addressing useful.