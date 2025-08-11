# ISPs and Network Maintenance

## Internet Service Providers (ISPs)

You pay an ISP for internet access (like paying for a road toll or utility bill). In exchange, they give you the means to reach any other network.

If you have issues (like can't reach something), often the first suspect is either your ISP or the destination's ISP having an issue.

So this chapter sets the stage that the internet's "roads" are not just naturally there – companies (ISPs) intentionally build and interconnect them. And they come in different scales and roles, which we'll explore in the next chapters (ISP Connections, Tiers, etc.).

> **Technical Perspective:**
> 
> ISPs range from local broadband providers to giant global carriers:
>
> e.g., Comcast, AT&T, Verizon, Level 3, NTT, Telia, etc.
>
> - **Tier 1** (like Level3, now Lumen, or Telia, NTT) have global networks and mainly exchange traffic with each other without cost (settlement-free peering).
> - **Tier 2** (like many national ISPs) might peer where possible but also pay Tier1s for transit to parts of internet not reachable via peers.
> - **Tier 3** (local/regional) usually pay upstream providers for transit.
>
> **Last mile technologies**: DSL (using phone lines, up to certain speeds/distance), Cable (DOCSIS on coaxial cable TV lines), Fiber (FTTx like GPON or active Ethernet), Wireless (4G/5G for mobile, or fixed wireless), Satellite (like Starlink).
>
> ISPs also often manage PoPs (Points of Presence) in various cities where customers connect and where they interconnect with other ISPs. These are like major road hubs.
>
> They adhere to standards for physical (like fiber optic standards, DOCSIS for cable, etc.) and for routing (they run BGP, etc.). They also often handle consumer issues like NAT (ISP might do Carrier-grade NAT for mobile).
>
> **Maintenance**: ISPs have NOCs (Network Operations Centers) to monitor their network. They coordinate with other ISPs for repairs (e.g., an undersea cable cut might involve multiple companies cooperating to dispatch a repair ship).
>
> They invest in capacity: e.g., adding new fiber routes if traffic demand grows, upgrading from 10Gbps links to 100Gbps or 400Gbps technology on backbone, etc.
>
> Also, **content delivery**: Some ISPs host CDN caches inside their network to reduce external traffic (like Netflix or Akamai servers in ISP's local data centers).
>
> Without ISPs, an individual network would have to individually connect to every other network, which doesn't scale. ISPs serve as hubs and interconnect points. They often form a hierarchy (customer-provider, peer-peer relationships).
>
> The text specifically likens ISPs to road/utility companies, which fits well: you generally don't build your own highway; you use the ones provided by these companies.

So to recap: ISPs bring the internet to you and bring you to the internet. They're a crucial part of the ecosystem that we often take for granted (we just plug in and have internet, but that's because the ISP's infrastructure is there and functioning).

Next chapters likely delve into how ISPs interconnect (peering, etc.), different tiers, etc.

## Network Maintenance

ISPs (and network operators in general) not only build the roads but also have to maintain and upgrade the network infrastructure to keep data flowing smoothly. This is akin to how a city has road crews fixing potholes, widening highways, or upgrading traffic signals.

### Analogy:

Over time, roads wear out or become insufficient for the traffic load. Similarly, network links can get overloaded as internet usage grows, or equipment can become outdated or fail.

**Maintenance tasks include:**

- **Fixing broken cables** (like repairing a cut fiber – comparable to filling a pothole or repairing a broken bridge).
- **Replacing old routers/switches** with newer ones (like upgrading a two-lane road to a four-lane highway by putting in new infrastructure).
- **Upgrading capacity**: e.g., adding more fiber lines, or using higher-bandwidth technology on existing fiber (like adding new lanes or improving the road surface to allow faster speeds).
- **Routine checks**: monitoring the "traffic patterns" to foresee where to add capacity or adjust usage, much like city planners analyze where to build a new road or add a stoplight.

They also monitor traffic and ensure fair, steady flow – for instance, implementing Quality of Service or usage policies to prevent one user from clogging the network, analogous to enforcing traffic rules or metering heavy vehicles.

The text says: *When roads wear out or become too crowded, ISPs add new cables, improve existing links, and invest in better equipment*. That directly maps to:

- E.g., if an ISP sees a core link consistently at 90% utilization at peak, they might lay a new fiber along that route or upgrade both ends to a higher capacity transceiver (improve/widen the road).
- If a router is old and running out of processing power for routing more traffic, they'll replace it with a newer model (like installing a higher-capacity traffic signal system).
- Maintenance also covers resiliency improvements – adding redundant links so if one fails, others can carry the load (like building detour roads before an emergency happens).

### Dealing with Unforeseen Issues:

**Outages**: If an ISP's cable is accidentally cut by construction (happens often), their crew must quickly splice it or reroute traffic. They often have SLAs (service level agreements) committing to restore service within X hours. This is like emergency road repair crews fixing a major highway cut.

**Software updates**: Network gear runs software (OS/firmware) that needs updates (for bugs or security). ISPs schedule maintenance windows (often late night) to update router software or restart systems, aiming for minimal disruption. This is like doing roadwork at 3 AM to avoid rush hour.

**Managing network performance**: They might reconfigure routing protocols or peering to balance traffic. For example, if one path is congested and another is underused, a network engineer might tweak BGP preferences to move some traffic to the underused path (like opening a temporary extra lane or re-routing trucks along a bypass).

ISPs also keep logs and telemetry on network health (like which links are nearing capacity, error rates on links which might indicate a fiber issue). They proactively fix things (e.g., if a fiber strand starts to degrade causing errors, replace it before it fails completely).

### The Benefit of Good Maintenance:

Stable connection for you with minimal downtime. The text notes: *this investment and maintenance keep your connection stable and efficient, without which you'd see slow speeds, outages, etc*. So if you wonder why the internet in developed areas is so consistently on, it's because teams are constantly maintaining it. (Of course, in some places maintenance lags and users experience more issues – akin to a city with poor road upkeep.)

So network maintenance is an ongoing effort:

- like painting the Golden Gate Bridge – once they finish, they start over.
- The internet is never "set it and forget it". Traffic patterns change (e.g., new popular services can shift where data flows, requiring capacity upgrades on certain links).
- New tech (like moving from 4G to 5G in mobile, or DOCSIS 3.0 to 3.1 in cable, or deploying fiber deeper) needs to be rolled out to meet demand.

For analogy completeness:

Think of an ISP's network like a large building or road system that requires upkeep: cooling systems for data centers, backup power (generators) to keep routers running during power cuts, and people on call 24/7 to respond to alarms.

So while users only see the results (fast internet, rare outages), behind the scenes maintenance crews ensure "the lights stay on" and the "roads are clear".

> **Technical Perspective:**
>
> ISPs use various monitoring systems (SNMP, NetFlow, etc.) to observe link utilization, errors, device status. They have NOC dashboards with green/yellow/red statuses.
>
> When an issue arises (a link down triggers an alarm), they have procedures: e.g., if a backbone fiber is cut, they reroute traffic automatically via alternate paths (assuming network design has redundancy) and dispatch field teams to fix the fiber. They might notify other ISPs if capacity is reduced so that everyone can adjust.
>
> **Capacity planning**: A part of maintenance. They analyze growth trends and plan upgrades ahead of time (like noticing a 10Gbps link will be regularly full in 6 months at current growth, so order a 100Gbps upgrade).
>
> **Hardware upgrades**: They schedule maintenance windows to replace routers, line cards, etc. Often they have redundant paths so they can take one down at a time with minimal impact (like shifting traffic off one router, then upgrading it).
>
> **Peering adjustments**: If a particular interconnection gets saturated (like two ISPs exchange a lot of traffic and the link is full at peak), they may add more capacity (open additional ports, or upgrade to higher-speed ports). This is maintenance at the inter-ISP level.
>
> **Customer maintenance**: e.g., if they upgrade the neighborhood's equipment (like DOCSIS headend or DSLAM software), they might announce a small outage window. This is akin to telling a neighborhood "water will be off at midnight for 1 hour for maintenance."
>
> They also maintain routing hygiene: e.g., updating configurations, filtering invalid routes (to prevent misconfigurations from propagating – like a bad BGP route from one customer could cause trouble if not filtered, as happened in some past incidents).
>
> **Security maintenance**: Updating software to patch vulnerabilities (network gear also needs patching, e.g. major vendors release periodic updates).

All of this maintenance activity is crucial for the quality and reliability of the internet service. When it's done well, users hardly notice anything except maybe the occasional late-night outage notification.

In a poorly maintained network, you'd see frequent slowdowns (like congested roads), random outages (things breaking due to no proactive replacement), or even security incidents (not patching equipment could let attackers cause problems).

So the analogy holds: a well-maintained network is like a well-maintained city – traffic flows smoothly, and any road issues are fixed quickly, largely invisible to day-to-day life.

Next likely: ISP Connections (how ISPs connect to each other). We touched on that but a dedicated chapter to formalize peering vs transit etc.