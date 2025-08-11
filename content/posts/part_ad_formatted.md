Without ISPs, we'd have a bunch of independent networks that might not talk to each other. ISPs and their peering agreements stitch the networks together into one internet.

Imagine if every building had to run its own wires to every other building it wanted to talk to – that'd be impossible at scale. Instead, buildings connect to an ISP's hub (like connecting to the nearest highway entrance), and the ISPs connect to each other's hubs. That way, any building can reach any other by going through this network of roads owned by ISPs.

### ISP Functions and Business Model

Additionally, ISPs **maintain and upgrade** these roads (we'll cover maintenance next). They decide how much capacity to build (should we lay a new 100 Gbps line to this city? Should we upgrade this old copper to fiber?). They often charge fees or have subscription models, similar to tolls or utility bills, to fund this.

In the analogy: an ISP is like a **road builder and maintenance crew combined with a toll operator**. You pay them (monthly bill) to use their roads to get to the rest of the world. They in turn might pay bigger ISPs for upstream connectivity (like a regional toll road might pay for connecting to the interstate system, or just analogous to commerce agreements).

**Summing up**: ISPs are the reason your building (network) isn't an island. They connect you to the global city by building and operating the physical and logical infrastructure for data transport.

> **Technical Perspective**: Last mile: This term refers to the link from the ISP to the end user (home or business). Could be DSL, Cable, Fiber-to-the-home, wireless broadband, etc. It's often one of the harder parts (installing lines to every home is labor-intensive). ISP equipment: They provide you typically a modem or ONT (optical network terminal) and you connect your router to that. On their side, they have access networks (like a DSLAM in phone exchange for DSL, CMTS for cable, or OLT for fiber PON) that concentrate many users. Backhaul: The ISP aggregates local customers' traffic into bigger pipes that carry it to core network and then out to the internet exchanges. Tier 1 vs Tier 2: Tier 1 ISPs are large networks that don't pay anyone for transit – they peer with all other tier 1s and cover lots of ground (e.g., Level 3, AT&T, NTT, etc.). Tier 2's buy transit from Tier 1's for some routes but also peer where they can. Tier 3's (like small local ISPs) usually pay upstream providers entirely for internet access. Peering and transit: Two ISPs may have a settlement-free peering (no charge both directions if traffic is balanced enough), or a customer-provider relationship (one pays the other for access). Utilities analogy: People often compare the internet to power grid or roads – in some ways it's like a road system, in others like a telecom utility. Many governments regulate ISPs like utilities when it comes to fair access etc., because they're critical infrastructure. ISP as an IP: Typically, when your device sends data out, it goes to the ISP's router, which then uses its routing table to send upstream. The ISP usually assigns you an IP (public or behind CGNAT) which is how your network is identified on the internet. They also often provide a DNS resolver, etc. Without an ISP, if you and I directly strung a cable, we could network, but to reach a website on another continent, you need these intermediary carriers. So the healthy functioning of the internet relies on ISPs (and the big backbone operators) to do their job of expanding capacity, connecting with each other, and routing traffic fairly efficiently. Historically, there have been occasional tussles (one ISP might throttle or not carry traffic well from another if disputes arise, akin to two road companies disagreeing at a border – but mostly it's resolved via business agreements because customers demand access to all internet content). Alright, with roads built by ISPs, we can drive anywhere. But roads need upkeep – let's talk maintenance next.

## Network Maintenance

Once roads are built, you can't just forget about them. They develop potholes, need repaving, and occasionally need expanding to handle more traffic. Similarly, **networks require maintenance and upgrades** to keep them running smoothly.

### Types of Network Maintenance

Network maintenance includes:

#### Upgrading Equipment
Over time, routers, switches, and servers get old or insufficient for growing traffic. ISPs and network owners replace them with newer models (like swapping a slower floor manager for a faster one, or adding more elevators/gateways). For example, upgrading from older routers that supported 10 Gbps links to new ones that support 100 Gbps because user demand grew.

#### Replacing Cables
**Cables** (especially in external environments) can degrade or be damaged. Fiber optic cables might get water intrusion underground or get accidentally cut by construction. Regular inspection and timely repair are needed. Think of this as fixing cracked roads or reinforcing bridges.

#### Software Updates
The "brains" of the network (router software, firmware on devices) need **patching for bugs and security fixes**. Neglecting this is like not updating traffic light timings even if they malfunction sometimes.

#### Monitoring Traffic Patterns
Network engineers keep an eye on usage. If a certain link is consistently near capacity (congested at peak times), that's a sign they should upgrade that link or reroute some traffic. It's akin to noticing "every day at 5pm this highway is jammed; maybe we need to widen it or build a new route."

#### Preventative Maintenance
Sometimes they'll **schedule downtime** (usually late at night) to do things like replace a core router or re-route cables, with minimal impact. This is like closing a road overnight to resurface it, hoping to minimize inconvenience.

#### Troubleshooting and Repairs
When something breaks unexpectedly, network operators have to jump in and fix it. If a major router fails, they might have a spare ready to swap in (like having spare parts for critical machinery). If a fiber line gets cut, crews are dispatched to splice it back together (there are literally people whose job is to go out and mend fiber cables).

#### Ensuring Stable Power & Cooling
Data centers and network hubs need **reliable power** (with battery and generator backups) and **cooling** (so equipment doesn't overheat). Just as a building's facilities team ensures electricity and AC are working, network facilities teams ensure their "road hubs" (like exchange points and data centers) are physically secure and running.

#### Monitoring and Logging
They continuously **monitor for issues** – using tools that log network performance, so they can spot anomalies early (like "this link's error rate is rising, maybe its fiber is starting to fail" or "why is traffic suddenly spiking, is there a misuse or a cyberattack?"). This proactive catching of issues is akin to road inspectors checking for cracks or weight sensors noticing unusual loads.

### Why Maintenance Matters

All this maintenance work by ISPs and IT teams is why your internet works year after year. The average user doesn't see it; occasionally you might get an email "we will have a maintenance window at 2am, your connection may drop for 5 minutes" – that's them doing upkeep.

A **good network is like a well-maintained building or road system**: you almost take it for granted because problems are rare and fixed quickly. Without maintenance, things degrade – you'd see more outages, slowdowns, and failures.

### Humorous Perspective

To bring a slight humorous angle: imagine if roads were never maintained – eventually you'd be dodging giant potholes and maybe a bridge collapses. On the internet, if an ISP never upgraded its equipment or fixed things, customers would be constantly complaining of slowness or disconnects. So, they invest in maintaining to keep customers happy and the system reliable.

And it's not just ISPs: any large company with its own network (like a big campus or a cloud data center) has network engineers performing similar tasks internally (upgrading switches, replacing cables, etc.). So maintenance is an **ongoing, never-finished task** – because technology keeps advancing and usage keeps growing.

> **Technical Perspective**: Maintenance windows: Many networks have formal maintenance windows (like Sunday 2-4 AM local time) where they do potentially disruptive tasks. They announce them so that dependent customers/applications are aware. MTBF and Redundancy: Good practice is to have redundancy such that even during maintenance, traffic can be rerouted so users might not notice. E.g., if two parallel links, take one down, traffic on other; or dual routers, upgrade one at a time (this is called in-service software upgrade if possible). So maintenance often tries to avoid complete outage, but sometimes a brief one is needed. Hardware refresh cycles: It's common to replace networking hardware every so many years. Also capacity planning: e.g., if a link is >70% utilized at peak, plan an upgrade because you're one viral video away from saturating it. They might add a parallel link or replace with higher bandwidth technology (like migrating from 1 Gbps to 10 Gbps, etc.). Monitoring systems: Tools like SNMP, NetFlow, or newer telemetry feed data to NOC (Network Operations Center) dashboards. Staff can see the status of thousands of links at a glance, with alarms for failures or thresholds. If something fails at 3 AM, on-call engineer gets an alert. Preventive vs Reactive: Preventive measures include e.g. cleaning fiber connectors (a common cause of optical issues is dirty connectors), replacing backup batteries in time, testing failovers, etc. Reactive is, say, DDoS mitigation when a sudden attack happens (some could classify security as maintenance too). Network upgrades: When new standards come (like IPv6, or new routing protocols), maintenance includes planning and executing those rollouts with minimal disruption. Service continuity: The ultimate goal is to avoid downtime. Many ISPs advertise like 99.9% or higher availability. That allows maybe minutes of downtime a year. To hit that, maintenance has to be carefully managed and quick to restore if something goes wrong. In short, the internet's reliability owes a lot to the unsung heroes: network engineers and technicians doing maintenance and upgrades. This also ties into the next parts: ISP connections, roles, etc., where planning and maintaining become complex at scale.

## ISP Connections

We've talked about what ISPs do individually, but let's look at how they **connect with each other**, since that's vital to the "network of networks" concept. No single ISP covers the entire globe (even the biggest are just covering large regions), so ISPs must interconnect to exchange traffic – this is often done at neutral meeting points or direct peering links.

### Utility Company Analogy

Think of **multiple utility companies or road networks that need to work together**. Suppose one company built highways in the North region and another in the South. At some point, they have to link their highways, or travelers from the North can't reach the South. Similarly, ISPs connect at junctions called **Internet Exchange Points (IXPs)**, or they do private interconnects (like direct fiber between them).

### Internet Exchange Points (IXPs)

**Analogy**: Internet Exchange Points are like **major transportation hubs or border crossings**:

- Imagine a huge bus station or train station where lines from many different places converge and passengers can switch lines. An IXP is a physical infrastructure (often a big data center facility) where many ISPs and network operators come and connect their equipment to a common fabric (like a big switching system). They agree to share traffic, often freely or at low cost, to benefit each other.

- It's akin to a **trade hub or marketplace for data**: "I'll carry your traffic if you carry mine, and we both benefit because our customers can reach each other without paying a middleman."

So, when you send an email from a Comcast user in the US to a BT user in the UK, that email likely hops from Comcast's network to a transatlantic cable via maybe a Tier 1 ISP, lands in Europe, and at some point transitions to BT's network, possibly at an exchange in London. Each handoff is an "ISP connection" point.

### Two Ways ISPs Connect

There are two main ways ISPs connect:

#### Peering
Two networks exchange traffic between their customers (I'll deliver to your users, you deliver to mine) typically **without money changing hands**, if the traffic volumes are balanced and it's mutually beneficial. It reduces costs for both since they don't have to pay a third-party transit provider for that traffic. Think of two neighboring city road systems agreeing to build a bridge between them – it helps citizens of both cities travel freely.

#### Transit
One ISP **pays another** to carry its traffic further or to parts it can't reach directly. This is like a smaller road network paying to use the highways of a larger network. If you're a small ISP and you can't connect everywhere, you pay a Tier 1 ISP for internet transit which basically gives you reach to the entire internet. You'll still peer where you can, but transit is your fallback to reach everything. This is analogous to a regional train line paying the national rail network to use their tracks to reach far-off places.

At IXPs, often many participants peer with each other through one connection to the exchange fabric. It's very efficient – **a single port at an exchange can connect you to dozens of other networks** via the exchange's switch, sort of like plugging into a shared meeting space.

### Seamless User Experience

The result of all these connections is that, from the user's perspective, **the internet is seamless**: you don't know or care which ISP's territory your data is in at a given moment. It's like driving across states or countries – you might pass from one toll road operator's domain to another, but as long as your route keeps working, you might only notice a sign "Welcome to X" as a hint.

### Peering Agreements as Treaties

The peering agreements can be thought of as **treaties between kingdoms** in our city analogy. They allow free passage of each other's citizens (data) up to some fair usage. If one side sends disproportionately more traffic, sometimes disputes arise (like one building sending tons of trucks to another's roads but not reciprocating, the other might demand payment to handle the imbalance – in real internet, there have been peering disputes, say one ISP carrying a lot of Netflix traffic and wanting Netflix or their transit to pay for infrastructure upgrade).

But overall, ISP interconnections ensure that your ISP doesn't need to connect to every other ISP individually – they connect to a few key points and through those can reach the rest. It's like not every city needs direct roads to every other city; they connect to hubs or main highways that branch out.

**Key takeaway**: The connectivity of the internet relies on **cooperation between independent networks**. They meet and exchange traffic in a way that, to data packets, is invisible. You just hop from one to the next.

> **Technical Perspective**: IXP: An Internet Exchange is often a layer2 network (like an Ethernet switch or switching fabric) where members connect with an Ethernet port and can peer via BGP sessions with others over that. Famous ones include LINX (London), AMS-IX (Amsterdam), DE-CIX (Frankfurt), Equinix exchanges, etc. Some have hundreds of participants and carry terabits of traffic. Peering vs Transit: BGP has mechanisms to prefer customer routes (which bring revenue) over peer routes over provider routes (which cost money). So typically an ISP will route traffic from its customers over free peer links if possible, and only use a transit provider if it has no direct or peer route. Settlement-free peering criteria: Big ISPs often have requirements like "you must have a similar network size, and exchange at least X Gbps traffic symmetrically, and have presence in Y locations" to peer freely. Otherwise, they'll say "you pay me transit". This sometimes causes smaller guys to pay or go through intermediate. Content providers: Companies like Google, Facebook, Netflix – they actually have their own quasi-ISPs (private networks) that peer with access ISPs directly. They put servers inside ISP networks (CDN caches) to cut down on need to transfer data over multiple ISP hops. But they too connect at IXPs widely (Google is at hundreds of IXPs). Physical connections: When two ISPs decide to peer privately, they might run a fiber directly between their routers in a city (private peering) if traffic is large. Or they use cross-connect in a colo facility. Tier 1 club: If you have to pay someone for transit, you're not Tier 1. There's a known Tier 1 list who all peer with each other and no one else needs to give them transit. They form the backbone sort of by default. Resilience: ISPs often connect in multiple locations for redundancy. For example, two ISPs might peer in both New York and Los Angeles, so if one path fails or becomes congested, traffic can reroute to the other. Peering disputes: e.g., some years back Level 3 vs Comcast dispute where Netflix traffic (on Level3) was saturating Comcast's ports and Comcast wanted Level3/Netflix to pay to upgrade. These can temporarily degrade performance for affected traffic until resolved. Overall, ISP interconnection is a fascinating mix of engineering and business – but the upshot is that from any given network, you can usually reach any other because these deals are in place. The internet would fracture if major ISPs refused to connect, but thankfully it's in everyone's interest to maintain global reachability. Okay, now different ISPs play different roles (local vs global). Let's talk ISP tiers and roles next.

## ISP Tiers and Roles

Not all ISPs are created equal – they differ in size, reach, and role. We touched on tiers: **Tier 1, Tier 2, Tier 3**, etc. Let's demystify that with our analogy.

### Road System Hierarchy

Think of the road system:

#### Tier 1 ISP
A **Tier 1 ISP** is like a **national highway authority** that maintains the main highways crisscrossing entire regions or countries. They provide the backbone. These are massive "builders" who connect big cities (major networks) together. They typically do not pay anyone for access because they peer with other Tier 1's – essentially trading route access equally (like two countries connecting highways at the border, both benefit).

#### Tier 2 ISP
A **Tier 2 ISP** might be more like a **regional road company** – they have highways within a certain region and connect to some Tier 1s for broader reach. They may peer with others in adjacent regions, but often they still pay upstream for some destinations. They serve as a middleman: they might serve smaller ISPs (Tier 3s) and enterprise customers, and they buy bulk transit from Tier 1s.

#### Tier 3 ISP
A **Tier 3 ISP** is usually a **local road provider** – think city roads or last-mile streets. They directly serve end-users and small businesses. They almost always pay a larger ISP to reach the wider internet (transit), unless they're in a metro area where they can peer at an exchange for some local traffic.

### Practical Examples

In practical terms:

- **Tier 1**: e.g., companies like CenturyLink (Level3), AT&T, Verizon (certain parts), NTT, Telia, Deutsche Telekom, etc. They have global networks.

- **Tier 2**: might be like a national ISP that still buys some international transit or a big cable provider that peers regionally but buys from Tier1 for overseas.

- **Tier 3**: local cable company or small fiber ISP that only operates in a city or county and purchases internet transit from a Tier1 or Tier2.

### Different Roles

Roles also differ:

- Some ISPs focus on **consumer access** (like Comcast, Charter, etc. which are Tier 2 or Tier 3 in hierarchy but giant in subscriber count).

- Others are more about **backbone and wholesale** (like Level3 historically had no retail customers, just carried traffic for others).

- There are also specialized ISPs for, say, **businesses** (dedicated leased lines, etc.), or for **mobile** (cellular data providers, though nowadays they are just telcos doing all).

### Financial and Technical Flow

Why does this matter? Because it explains how **data flows financially and technically**:

- When you pay your local ISP (Tier3) for internet, part of that money goes to them maintaining local lines, and part may go to paying their upstream Tier2 for carrying data to the rest of the world.

- That Tier2 in turn might pay a Tier1 for any traffic it can't route via peering.

- Tier1's settle among themselves usually without money, but they invest in huge infrastructure. They recoup costs by charging Tier2's and large customers.

### City Analogy Recap

In our analogy city:

- **Tier1s** built the main freeways (and maybe share costs with others at national borders).
- **Tier2s** built the state highways and sometimes tolled them to cover the cost of paying to use the main freeways.
- **Tier3s** built the city streets and connect to highways with on-ramps that might have a tollbooth (the cost of handing to Tier2).

### Role Summary

Now, also think of roles:

- **Local ISP (Tier 3)**: brings connectivity to your building's doorstep (the last mile).
- **Regional ISP (Tier 2)**: runs networks across a larger area (maybe a whole country or large state), linking many local networks.
- **Backbone ISP (Tier 1)**: connects countries and major regions, basically ensuring that no matter how far apart two networks are, there's a path through the backbone.

The ultimate effect: **any building can talk to any other** because Tier3 passes to Tier2 passes to Tier1 (if needed, then back down to Tier2 and Tier3 on the other side). A city-to-city-to-city chain.

For everyday users, you don't need to worry about tiers, but if you run a company that needs ultra-reliable connectivity, you might **multi-home** (connect to multiple ISPs maybe one Tier1 and one Tier2) to have redundancy.

### Bragging Rights

On humor: you can imagine Tier1 as the "internet giants" – their engineers like to brag they operate the backbone of the internet. Tier3 techs brag about getting fiber to someone's farm out in the countryside. Both are noble tasks.

### Responsibility Summary

In essence, each tier has its scope and responsibility:

- **Tier1**: ensure the core is strong and international traffic flows.
- **Tier2**: ensure regional connectivity and interface between core and access.
- **Tier3**: ensure end-users get on the net.

> **Technical Perspective**: The tier system is somewhat informal; some say it's outdated because even content networks bypass hierarchy by directly connecting to access ISPs (flattening). But historically, Tier1 means no transit dependence. Tier2: has transit, but also significant peering. Tier3: mostly transit. Example: A small ISP in a rural area might buy transit from a bigger national ISP (Tier2). It might also connect at an exchange in a nearby city to exchange traffic with other local ISPs (so local traffic doesn't go all the way out then back). A content provider might not be "ISP" in the traditional sense, but they build a network akin to one. Google is effectively its own Tier1 now because it peers globally and has its own cables. Same with Microsoft, etc. Some mobile providers piggyback on others (MVNOs like virtual networks), but that's another layer (like an ISP renting from another). For nerds: sometimes Tier1 networks have public lists, but they occasionally change (mergers, etc.). The business relationships (peering vs transit) decide classification. Tier1 often means if two Tier1s break their peering, parts of the internet could partition (because each are big enough that without direct or indirect link, some routes won't be known). That's why Tier1's maintain an all-peer group. Roles: Sometimes an ISP may wear multiple hats (e.g., AT&T has Tier1 global backbone and also Tier3 last mile to customers). The concept of "last mile" vs "middle mile" vs "backbone" is similar segmentation. So in summary, ISP tiers and roles reflect the structure of how the internet is built like layers: local distribution, regional aggregation, global core. It's like how roads go local streets -> county roads -> interstates. Without each layer, connectivity would break down. Alright, now given all this connectivity, what's the outcome for us? Global communication – our next short affirmation that indeed, thanks to all this, you can reach anywhere.

## Global Communication

Ultimately, because of the collaborations and infrastructures set by ISPs (and the underlying technologies), we achieve something quite magical: **any building (network) can talk to any other building in the world, essentially in real-time**. This is global communication at work.

This chapter is a bit of a capstone of Part 2, emphasizing that from your little room, you can reach across the globe:

### Global Reach Examples

- From a tiny village's network in one country, you can **stream video** from a server in a mega data center on another continent.

- A student in their dorm (one room in one building) can **video chat** with another student thousands of miles away as if they were next door.

- Businesses can connect their offices worldwide through **secure tunnels** (VPNs, which we'll discuss in security part) – making it feel like one cohesive network even if physically distributed.

All the pieces we discussed – **IP addresses, DNS, routers, gateways, ports, protocols, ISPs**, etc. – are the unsung heroes enabling this.

### Building-to-Building Communication

To put it into the building terms: you, in **Room 101 of Building A in City X**, can send a message that ends up in **Room 202 of Building B in City Y** halfway around the planet. And not just you – millions can do similar simultaneously, thanks to the scalability of the system.

### Historical Context

Think of historical context: It's as if every person in every building got a **magic telephone line** connecting them to anyone else – except it's even more versatile than a telephone because it's data of all kinds (text, voice, video, interactive apps).

The internet city truly turned the world into a **"global village"** concept – because distance and location matter a lot less now for communication:

- Yes, there is still **latency** (it's not instant-instant if far, maybe 100-300ms), but that's tiny.

- People **collaborate in real time** from different countries on documents, code, etc. because the network allows their computers to behave like they're in neighboring cubicles.

### Speed and Reliability

We should also note: all this happens at **incredible speed and reliability**. The fact that one can reload a webpage from servers across the world and see it in seconds, or that we can watch a live sports event happening in another country with only a few seconds delay – these are everyday miracles courtesy of computer networks.

### Interconnectedness

This chapter might also be a good place to reflect on how **interconnected everything is**:

- The phrase "the world is connected like never before" is directly enabled by what we covered.

- However, it also means if major networks go down, it can have wide impact (like if a Tier1 has an outage, many dependent networks could feel it).