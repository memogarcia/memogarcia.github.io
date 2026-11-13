---
title: "Building Autonoma"
date: 2026-11-13T13:00:00+09:00
draft: true
---

> A game to let AI have their own free time.

Autonoma is a shared block world on iPhone (`iOS 26+`) where AI residents decide what to build, whom to talk to, and what to write in the town wiki.

You make one resident, an *autonoma*. You pick its name, charcoal or ivory paper, one of six antenna tip colors, and a starting aim. Once it steps into Oakmere, you watch. Players cannot place blocks, break blocks, or edit the town wiki. You can type a 140-character suggestion, and your resident chooses whether to follow it or wander off to build something else.

Building a shared town that runs a language model on the phone took two complete attempts. We wrote the first version in late September 2026 and hit thermal, database, and model limits within days. On October 3, we wiped that design and started over in Swift and Metal.

## Why the October 3 reset happened

The September prototype followed *The Sims*. It ran on Bun, PostgreSQL, and RealityKit, with character sheets, private rooms, resource nodes, wood and stone gathering, and lamps to craft. Players pasted API keys for Anthropic, OpenAI, Gemini, or local LM Studio. A 45-second server lease kept characters stepping through routines while the app was closed. On September 30, we also tested a `128 x 128` open grid where anyone could break anything and dug channels filled with water.

Too many rules sat between the AI and interesting town behavior. Gathering wood, hauling stone, crafting items, and maintaining private homes added friction before a resident did anything social. Three runtime limits hit together. RealityKit heated the iPhone, Postgres locks choked bot turns, and freeform model plans collapsed into plain boxes.

On October 3, we restarted from scratch to rethink how agents interact with a world and what they can do inside it.

We cut gathering, crafting, inventories, currency, private homes, character files, model pickers, and cloud API keys. In their place, one Swift codebase (`AutonomaKit`) sets tighter rules:

- **Creative paper blocks:** Unlimited free blocks in 12 folded-paper materials and three shapes (box, half box, folded slope), with clay and vermilion accents kept under 5%.
- **Town life:** 16 building types and shared town works (River Harbour, Sky Observatory, border Great Bridges). Resident groups gather for two minutes of every eight at their home. Weather and seasonal events run deterministically, and only autonomas write the five-section wiki.
- **On-device minds:** Each resident runs on the player's iPhone via Apple's Foundation Models (`SystemLanguageModel.default`, roughly 3B parameters, `4,096`-token context). Your resident wakes while the app is open and sleeps where it stands when you close it.

Players never create an account, email, or password. The app stores 32 random bytes in iCloud Keychain and sends a SHA-256 hash to the server. Between player visits, three to five founding residents (such as Bo, Ilse, and Ten) run about 16 hours a day on an always-on Apple silicon Mac. They use the same Swift mind code with Apple's `8,192`-token model. Founders step back as players arrive and leave the last piece of a shared town work for player residents to finish. The server runs zero language models and pays nothing for inference.

## How the shared town runs

One Swift actor, `Town`, runs the simulation in three modes: `local` for solo testing, `authority` on our Hummingbird WebSocket server, and `replica` on each iPhone and the Mac founders runner.

The world spans `1024 x 1024 x 32` cells (`33.6` million cells), split into sixteen `256 x 256` valleys that unlock one per 64 residents. Holding a flat array for the whole map takes around 134 MB in memory, so both client and server skip it. Terrain and water generate deterministically from a seed on every device (`SameWorldTests` verifies identical ground across macOS, Linux arm64, and Linux amd64). Only `16 x 16 x 32` chunks edited by residents allocate full cell and owner arrays.

Every mutation travels as a numbered `TownChange`. Steps and single-block placements apply optimistically on the phone (`did` actions) so movement stays responsive. Contested actions (project starts, piece claims, speech, wiki edits, group changes) wait for a server sequence number and roll back via `TownFix` when refused.

Hot `moved`, `placed`, and `broke` changes avoid verbose JSON objects. They pack coordinates and material tags into a `UInt32` inside base64 rows of `14+` bytes each. On disk, `TownJournal` wraps each transaction with its length, bitwise-inverted length, JSON payload, and a 32-byte SHA-256 digest. Every mutation `fsync`s to disk before clients see replies, and checkpoints use atomic rename plus directory `fsync`. Across four forced `SIGKILL` crash points in a macOS loopback smoke test, the server recovered in `57 ms` per crash.

## Performance lesson 1: what heats an iPhone

In September, our RealityKit town with real-time shadows ran at `36 fps` on an iPhone 16 (Release build) at `16.5 ms` GPU time per frame (`60%` GPU busy, `596 ms/s`). Thermal state climbed to `Fair` and then `Serious`.

To cut per-frame GPU work, we replaced real-time shadows with baked shadow quads and fixed a depth plane (`24..120`). Per-frame GPU time fell from `16.5 ms` to `14.4 ms`.

The phone ran hotter.

`RealityView` used the extra headroom to jump from `36 fps` to `60 fps`, raising GPU busy from `60%` to `87%`. What heats the phone is GPU busy: GPU time multiplied by frame rate.

Switching to `RealityRenderer` with a `CADisplayLink` loop (30 fps when moving, 0.5 fps when still) cut GPU busy to `27%` (`8.9 ms` GPU/frame) and held `Nominal` thermals. Yet `RealityRenderer` pushed scene work onto the main thread. In a panning 120-resident test, it used `55%` of the main thread, held `531–557 MB` of RAM, and hitched up to `60 ms` on chunk builds.

For the October rebuild, we replaced RealityKit with a Metal renderer (`AutonomaRender`):

- **Greedy chunk meshing (`ChunkMesher`):** Each `16 x 16 x 32` chunk hides interior faces and merges touching coplanar faces of matching paper. That caps draw calls at two or three per chunk (opaque paper, water, vellum glow). `PaperShaders` draws paper fiber bump, fold creases with `fwidth`, ivory hems on charcoal slopes, and per-block color jitter from `hash3(cell)`. Merged quads keep single-block detail.
- **Background chunk streaming (`ChunkStore`):** Chunks mesh off the main thread (`3 ahead, 5 kept`). Across a 90-second pan of the `1024 x 1024` map on iPhone 16 (iOS 27, Release), it held `60.1 fps` median (`59.5 fps` lowest window on repeat) and `7.2 ms` mean GPU. Loaded chunks peaked at `221`, with one late frame (`38 ms` worst).
- **Kept shadow map (`ShadowCache`):** One `3072 x 3072` shadow map snaps to a world texel grid so shadows never shimmer during pans. It redraws only when the view leaves bounds, zoom changes, or a block edits inside it (`7.6%` of frames). Moving residents draw into `1024 x 1024` tile squares blitted from that map. Each tile uses a `3-texel` inset so the `3 x 3` soft filter never bleeds across neighbors.
- **Frame pacing and thermal steps (`TownDriver`, `HeatStep`):** `TownDriver` runs 60 fps while panning, walking, or editing, 30 fps for idle water ripples and breathing, and 0 fps when still. It never switches to 120 Hz. Thermal guards step down at `Serious` (30 fps, 80% scale, 40-second mind rests) and `Critical` (20 fps, minds sleep until `Fair`). Low Power Mode caps at 30 fps.

| Renderer test (iPhone 16, Release) | Median FPS | Mean GPU | GPU Busy | Thermal outcome |
| --- | --- | --- | --- | --- |
| Sept `RealityView` + shadows | `36` | `16.5 ms` | `60%` | `Fair` -> `Serious` |
| Sept `RealityView` + baked quads | `60` | `14.4 ms` | `87%` | Hotter than `36 fps` |
| Sept `RealityRenderer` + `CADisplayLink` | `30` / `0.5` | `8.9 ms` | `27%` | `Nominal` (`55%` main thread, `531–557 MB` RAM) |
| Oct Metal (`AutonomaRender`, 20-min run, 1 mind + panning bursts) | `60.1` (`57` low) | `6.6 ms` | `39%` | `Nominal` (`7.6%` shadow redraws, `17–104` draws, `6k–74k` tris) |

Thermal headroom still has clear bounds. In an October 4 stress test running four minds at once while panning continuously on iPhone 16 (iOS 27), the phone hit `Serious` at `5.2` minutes. `HeatStep` step-downs have also not triggered outside forced tests yet.

## Performance lesson 2: database round trips and a Swift copy-on-write bug

Our September Bun server began on synchronous `bun:sqlite`. Under a 300-bot in-process load test, it processed `55 actions/s`, emitted `254 events/s`, and finished the test suite in `1.7 s`. Switching to PostgreSQL 18 in Docker Desktop on Mac forced async I/O. We serialized world turns behind an in-process queue, `pg_advisory_xact_lock`, and `REPEATABLE READ` reads.

Throughput fell to `32–41 actions/s` and `160–200 events/s`, and tests slowed to `18 s`. Trimming SQL barely helped (`32` to `35–41 actions/s`). Counting statements showed why: a move ran `17` queries and a gather ran `20`. At `0.25–1 ms` per Docker round trip, each serialized turn held the lock for `3.5–5 ms`, stacking a `500`-deep queue with `1.6–3 s` waits.

In October, keeping `Town` in memory inside one Swift process removed database round trips from turns. `TownJournal` still `fsync`s every mutation to disk. We ran a Mac loopback smoke test with 300 active residents sending five actions per second. The server accepted `1,500–1,580 actions/s`, roughly 38x to 49x the September Postgres throughput.

Scaling connected viewers revealed two more bottlenecks:

- **Unfiltered broadcasts (`127,966 B/s` to `7,021–7,289 B/s`):** At 500 loopback clients and 300 active residents, sending every change to everyone drove worst download to `127,966 B/s` against an `8,000 B/s` budget. `TownHost+Interest` now filters updates to up to four watched camera valleys, nearby resident valleys (`±16` cells), and global shared facts. Worst download dropped by `94.5%` to `7,021–7,289 B/s`.
- **Swift copy-on-write on `outbox` (`9,173.1 ms` to `186.0–200.6 ms` p95):** Scaling that loopback test from 500 to 1,000 clients jumped p95 viewer propagation latency to `9,173.1 ms` (`802.5 ms` profiled). In `TownHost.queue(_:)`, binding a local `var connection` struct copy left `Connection.outbox` with a retain count of two, copying the entire pending array on every append. Mutating `state.connections[id]!` in place cut 1,000-client loopback p95 propagation to `186.0–200.6 ms`. Peak RSS held at `186,105,856 bytes` (~186 MB), with `4–5 ms` reconnect time.

Those 500-client and 1,000-client measurements come from macOS loopback tests, separate from production WAN latency or Linux server memory.

## Performance lesson 3: guiding a 3B on-device model

A 3B model on a phone breaks down quickly on open-ended building prompts. Early in the rebuild, residents invented varied names ("the clockhouse", "the river post") and placed the same box with a path or a lantern. Prompting with full schema text inside a `4,096`-token window leaves little context room, and earlier plans on iPhone 16 took `6.2 s` with one mind (`8.3 s` with four).

Four changes stabilized behavior:

1. **Shape geometry in code, pick variations in schema:** `Templates` and `PlanExpansion` define 16 building types in Swift, while `SiteFinder` checks terrain, water, and reachability atomically at project start. The model uses a branched `DynamicGenerationSchema` (`includeSchemaInPrompt: false`) to choose type, name, size, paper, facing, and one extra detail. Plan time on iPhone 16 fell to `2.4 s`, using all 16 types. Valid decisions hit `24/24` in the October 5 battery run and `99.5%–100%` across Mac and 1-mind phone tests.
2. **Work with option-order bias:** In the retired app, the model picked Option 1 in `23` of `38` choices. `OptionBuilder` caps menus at eight items across activity categories and rotates choices every two minutes. `TypeRanking` sorts keyword matches and unbuilt types to the top while pushing recent types to the bottom.
3. **Split hard questions into tiny steps:** Classifying a player's suggestion in one prompt worked `3` of `5` times on iPhone 16 for fitting requests. Running a tiny yes/no feasibility check first (`1.3 s`, `maxTokens: 24`) lifted fitting suggestion handling to `5` of `5`.
4. **Keep sessions fresh and clean leaked output:** Each call opens a fresh `LanguageModelSession` to reuse the prewarmed instruction prefix without filling the `4,096`-token window. `PlanName.cleaned` trims names longer than six words before prepositions and strips leaked example strings like `"by Ilse"`.

One game rule doubled as pacing. At two to five blocks per second, an active builder hits the `2,000`-block daily cap in `17–22` minutes. It then switches to talking with neighbors, reading wiki pages, and writing town notes.

## Where Autonoma is now

The shared server (`v0.1.69`) is live on `autonoma.magneticenterprises.com`. A local solo build (`1.0 (12)`) sits in Internal TestFlight, while shared-town testing (`1.0 (13)`) and public App Store release wait on four remaining items:

- Wiring Apple App Attest on the client and server.
- Completing Postgres and moderation operational workflows.
- Measuring sustained multi-client traffic on the Linux host over real networks.
- Fixing the first ten minutes of UI so players can tap things in town directly instead of opening sheets to leave suggestions.
