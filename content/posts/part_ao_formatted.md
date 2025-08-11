# ISP Connections and Network Tiers

## ISP Connections

No single ISP covers the entire globe; they need to connect with each other so that data from one provider's network can reach another's. Think of multiple utility or road companies operating in different regions – to give you universal access, they form partnerships and interconnections at certain points. In the internet world, ISPs interconnect through arrangements known as **peering** or **transit**, often happening at physical locations like Internet Exchange Points (IXPs).

### Analogy:

Imagine different railway companies each built tracks in different parts of the country. To allow passengers to travel everywhere, they agree to connect their tracks at certain junctions. Perhaps Company A's line meets Company B's line at a major station hub; there, they transfer cars or allow through-running of trains.

Similarly, ISPs meet and exchange traffic at neutral "hubs" (IXPs) or direct connections so that data from one can enter the network of another.

### Types of ISP Interconnections:

**Peering**: Two networks exchange traffic between their customers without money changing hands (usually, if the traffic volumes are roughly balanced or both see benefit). It's like a handshake deal: "I'll carry your traffic to my customers, you carry my traffic to yours – we both gain." Peering usually happens at IXPs or via direct fiber cross-connections between ISPs in the same facility.

**Transit**: One network pays another for access to the rest of the internet. If ISP A is smaller and doesn't connect to everyone, it might pay ISP B (a larger one) to carry its traffic to all other networks – similar to buying a ticket on another company's railway to reach cities your line doesn't go to. Transit is essentially purchasing internet access from an upstream provider. From our analogy: a smaller road company pays a bigger highway company to use its highways to reach other regions.

### Internet Exchange Points (IXPs)

At Internet Exchange Points (IXPs) (like big meet-me rooms):

- Many ISPs (and content networks) have routers plugged into a common switching fabric. They can peer with dozens of others via that one connection. It's like a giant roundabout where many roads meet and drivers (packets) can easily go from one company's road to another's.
- IXPs improve efficiency: instead of each ISP needing a separate link to every other ISP (which would be like every road company building individual interchanges with each other – inefficient), they all connect to the IXP and can exchange traffic over it.

### Why Do ISPs Connect This Way?

Without it, an ISP's customer couldn't reach a customer of another ISP unless those ISPs were connected somehow. The internet's whole premise is interconnection, so ISPs either peer or use transit to achieve universal connectivity.

For example, if you use ISP A and want to visit a website hosted on ISP B, somewhere along the path A's network must hand off the traffic to B's network. That handoff might occur directly if A and B peer, or indirectly via a chain of networks (A buys transit from C, B peers with C, so C is the common intermediary).

The goal is to ensure that any two points on the internet can reach each other, even if it means traversing multiple ISPs. ISP connections (peering/transit agreements) are what guarantee the "network of networks" functions as a single global network.

The text mentions: *ISPs connect at certain points called Internet Exchange Points (IXPs), ensuring that even if you're with one ISP, you can reach buildings (networks) served by another ISP*. In essence, the exchange is like a meeting place where traffic flows smoothly across company lines.

### Redundancy in Connections:

- Large ISPs will have multiple peering points with the same other ISP in different cities, so if one path fails, traffic can go another way (like multiple border crossings between two countries).
- Many ISPs have a mix of peering and transit: They prefer to use peering (free) for any destination that's reachable via peers, and use transit (paid) only for destinations not covered by peers.

### Example Scenario:

- ISP A (a local provider) pays ISP B (a regional provider) for transit to reach the whole internet.
- ISP B peers with ISP C (another regional provider) at an IXP for mutual traffic exchange.
- ISP B also has transit from Tier1 D to reach everything else not on its peer list.

So if A's customer wants a site on C, path: A → B (as transit) → B to C (via peering at IXP) → C to its customer. If wanting something on a network only reachable via D, path: A → B (transit) → B → D (transit) → D to that network.

It's complex underneath, but usually invisible to users. What matters is these connections exist so that any ISP's clients can talk to any other's.

### Business and Regulatory Aspects:

These agreements are often private. Sometimes disputes happen (like one ISP feels another sends too much traffic one way and not balanced, and might want payment – leading to peering disagreements which have in past caused temporary traffic blocks or slowdowns between those ISPs until resolved).

But generally, the global mesh is robust due to thousands of interconnects.

In analogy form, think utility companies interconnecting their grids:

Electric grids of neighboring regions sync up to share load and backup each other in case of plant failure.

Similarly, networks interconnect to share traffic so that no matter the origin and destination, there is a path.

Finally, note Internet service tiers:

We'll talk in next chapter about Tier 1/2/3 distinctions (which ties into who peers with whom vs who buys transit).

But basically Tier 1's are at top and mostly peer with each other, forming the core. Tier 2's often peer a lot regionally but still need transit from Tier 1's for full reach. Tier 3's mostly purchase transit.

So ISP connections are the glue holding the entire internet together:
They form the roads between different ISP "cities".

> **Technical Perspective:**
>
> **IXPs**: often use a shared Layer2 fabric (Ethernet switch). Participants connect a router interface to it and establish BGP sessions with various other participants. E.g., LINX in London, AMS-IX in Amsterdam, DE-CIX in Frankfurt are big ones with hundreds of networks connected and exchanging terabits of traffic.
>
> **Peering agreements**: settlement-free usually when traffic ratio is roughly balanced and both benefit. Otherwise, paid peering or sender-pays arrangements might occur if one side sends a lot more traffic (some content-heavy networks pay ISPs for stable peering if needed, or host caches within ISPs).
>
> **Transit**: an ISP advertises to its transit customer "I can reach all these destinations" (basically the whole internet) and in BGP the customer usually defaults to sending all unknown traffic to transit provider. The provider charges per bandwidth (e.g., per Mbps of traffic, often 95th percentile billing).
>
> ISPs also interconnect privately (private peering) aside from IXPs – if two networks exchange a ton of traffic, they might set up a direct fiber link between them in a data center for peering instead of through an IXP switch (to save costs or for capacity).
>
> **BGP**: the protocol used at these connections to exchange route info. Peering BGP sessions typically exchange routes to each other's customers (but not to third parties), while transit BGP sessions one side gets full routes and the other gets the customer's routes.
>
> Without these connections: networks would be isolated clusters at best, or everyone would have to individually connect to everyone (impossible). BGP and peering/transit architecture scales the interconnection problem.
>
> Example: When you request a website not on your ISP, your ISP's router finds via BGP that to reach that IP, go to peer X or transit Y. That decision is thanks to these ISP connection agreements and the routes they exchange.

So, ISP connections ensure the "Internet" is truly an inter-network (between networks). Each ISP is a building, and these connections are the "bridges" between the buildings. Traffic flows smoothly across the bridges, often orchestrated by BGP's exchange of route info.

Next, likely talk about ISP tiers and roles (local vs global providers etc.). We sort of did, but there's likely a formal chapter on it.

## ISP Tiers and Roles

Not all ISPs are equal – they have different scopes and roles in the internet's structure. We often categorize them into tiers to denote their reach and how they connect with others:

### Tier Classifications:

**Tier 1 ISPs**: The giants that form the core of the internet's backbone. They have networks so extensive that they don't need to pay anyone for transit; they peer with each other (typically settlement-free) to reach the entire internet. Think of them as the massive highway developers that run the main arteries of the internet across regions and countries. They provide connectivity that everyone else can build off.

**Tier 2 ISPs**: These are typically large regional or national ISPs. They might peer with other networks where possible, but they usually also pay some Tier 1 ISPs for transit to parts of the internet they can't reach via peering. They could be seen as regional road providers – they cover a big area and often connect multiple local ISPs and also connect to Tier 1 backbones.

**Tier 3 ISPs**: These are the local access providers – the ISPs that directly serve homes or businesses in a specific area. They usually entirely pay upstream providers for internet access (transit), as they often have little or no peering on their own. They're like the last-mile or local road companies focusing on connecting end users to the broader network.

### Roles:

- **Local ISP (Tier 3)**: Brings the internet to your doorstep – the "last mile" connection (be it DSL, cable, fiber, wireless) that directly connects you (the building) to the internet road system.
- **Regional ISP (Tier 2)**: Often aggregates traffic from many local ISPs or cities and provides connectivity between them. For instance, a state-wide ISP might link all city networks in that state and then hand off to a Tier 1 for other countries.
- **Tier 1 ISP**: Runs major international or cross-country links (the big highways). They essentially ensure global coverage by interconnecting with other Tier 1s. These Tier 1 networks are the reason any corner of the internet can reach any other – they carry traffic across long distances and different networks connect to them. They're like having no-toll superhighways connecting entire continents that everyone else can indirectly use.

An analogy offered: Local ISPs focus on the "last mile" (connecting buildings), regional ISPs cover bigger areas and often connect multiple locals (like state highways linking towns), and Tier 1 ISPs run the main backbone (like the interstate highways).

The text snippet describes:

- Local ISP: brings "last mile" directly to your building
- Regional ISP: covers a bigger area, connecting multiple local ISPs (like a middle layer).
- Tier 1 ISP: runs the main highways, ensuring global coverage – they are at the top of the hierarchy.

### Why Tiers Matter:

**Routing and economics**: Tier 1s don't pay anyone for transit, so they exchange traffic on a peer basis. Tier 2s often peer with as many networks as possible to reduce transit costs, but still need some transit (from Tier 1s) to reach everywhere. Tier 3s almost always pay upstreams for full connectivity.

It means if you're connected to a Tier 3, your traffic might go: Tier 3 → Tier 2 → Tier 1 → maybe another Tier 1 → Tier 2 → Tier 3 to reach the destination. There's a hierarchy of hand-offs.

Tier classification can be fuzzy; sometimes a large Tier 2 might not need to pay for transit in their region but still buys for some routes – but the concept stands.