---
title: "Why a toy town heated my iPhone"
date: 2026-09-26T00:50:00+09:00
draft: true
---

> In order to make it faster, we need to understand why it is slow.

Autonoma is a small game I'm building. You create an avatar, and it lives in a shared town on its own. It gathers wood and talks to its neighbors while you are away. The town is a tiny diorama drawn with RealityKit: houses, trees, a river, a few residents walking around.

After a while on my iPhone 16 the phone was warm, and iOS reported its thermal state as *serious*.

A diorama. Nothing in it moves faster than a person walking.

## Measure first

I recorded the app on the device with the Game Performance Overview template:

```bash
xcrun xctrace record --template 'Game Performance Overview' \
  --device <udid> --all-processes --time-limit 40s
```

The GPU was the bottleneck. 36 frames per second, 16.5 ms of GPU time per frame. Once the phone got hot, 22.6 ms per frame.

One number ended up mattering more than frame time: how busy the GPU is. GPU time per frame times frames per second. 16.5 ms at 36 fps means the GPU worked 596 ms of every second. That is what heats the phone.

## Real-time shadows

The sun cast real-time shadows, and every prop had a grounding shadow. A shadow map redraws the whole scene from the light's point of view every frame, even when nothing moves.

I replaced both with fake shadows. While the town is built, every prop leaves a marker: a soft round or square blob that leans away from the sun. At the end, all the markers become quads in two transparent meshes, one per shape.

The quads were invisible at first. They floated 0.06 units above the ground and still lost the depth test. The camera's near and far planes were 0.1 and 200, and with that range there isn't enough depth precision to tell two surfaces that close apart. The camera sits 64 units back and nothing on screen is more than 40 units nearer or farther, so I set the range to 24 and 120. The shadows appeared.

GPU time per frame dropped to 14.4 ms. The phone got hotter.

|                   | fps | GPU per frame | GPU busy |
| ----------------- | --- | ------------- | -------- |
| Real-time shadows | 36  | 16.5 ms       | 60%      |
| Baked shadows     | 60  | 14.4 ms       | 87%      |

Frames got cheaper, so RealityView drew more of them. 60 per second instead of 36, and more GPU work in total.

## Draw less often

The town doesn't need 60 frames per second. It barely needs any when nothing moves.

RealityView has no public way to set a frame rate. RealityRenderer does the same rendering into a Metal texture you give it, whenever you ask. I drive it from my own `CADisplayLink`:

- 30 fps while something moves.
- No new frame when the camera is still and the scene reports no changes, with one frame per second as a safety net.
- 20 fps and fewer pixels when the phone gets hot, 15 when it's critical, and 20 in Low Power Mode.

Each scene's tick returns whether it wrote to any entity. If no avatar moved, the town didn't change.

Two things broke. RealityView adds an image-based light by default and RealityRenderer doesn't, so every face the sun missed went dark. I generated a 64×32 sky gradient as the environment light and tuned it against screenshots of the old renderer until the brightness was within about 1%. The other one I haven't fixed: RealityRenderer does RealityKit's per-frame work on the main thread, where RealityView did it somewhere else.

| iPhone 16                  | fps | GPU per frame | GPU busy | Thermal            |
| -------------------------- | --- | ------------- | -------- | ------------------ |
| Before                     | 36  | 16.5 ms       | 60%      | Fair, then serious |
| Town, nothing moving       | 0.5 | ~0            | ~0%      | Nominal            |
| Town, camera always moving | 30  | 8.9 ms        | 27%      | Nominal            |

I don't fully know why the cost per frame also fell, from 14.4 to 8.9 ms. My guess is RealityView was running passes I never asked for.

## More space, more people

The town is going to grow, and more people are going to join. Three things grow with it: the map, the avatars on it, and the news about them.

### Build only what the camera sees

The village was one build. Every tree, rock and grass tuft, all at once. Now it's split into 12-unit chunks.

Placing things is arithmetic. Building entities is what costs time and memory. So the town first computes a plan of where every tree, bush and path goes, with the same random seeds as before, so it looks identical. Then it builds only the chunks near the camera, one per frame, and switches off the ones just out of view. Built chunks are kept as templates, so coming back to a place costs a clone.

The camera looks down at 42 degrees, turned 25 degrees, so the screen covers a rotated rectangle on the ground. A bounding box around it includes corners nobody sees. A separating axis test against the real footprint cut the first view from 24 chunks to 20.

### Less detail when far

Grass, flowers, bushes, river glints and the inner leaves of trees are tagged as detail and merged into meshes of their own. When you zoom far out, or the phone runs hot, those meshes are hidden and the avatars switch to bodies with fewer polygons.

### Cheap avatars

- Avatars with the same form and colors share one mesh.
- Avatars outside the camera are switched off and not animated.
- At most ten name tags: yours, anyone speaking, then whoever is nearest.

<figure>
  <img src="/img/autonoma-name-tags.png" alt="Two screenshots of a crowded town. On the left, dozens of name tags cover the map. On the right, only ten remain and the place names are readable.">
  <figcaption>120 residents. Every name tag on the left, ten on the right.</figcaption>
</figure>

### Only nearby news

The server sent every event to every player, and serialized it once per player. Now the phone sends a small frame with the area its camera shows:

```json
{ "type": "view", "x": 1, "z": 2, "radius": 35 }
```

The server sends updates about other avatars only when they happen near that area or near your own avatar. When the view moves somewhere new, it sends the current state of the avatars there. Each message is serialized once per variant instead of once per player.

A load test with 300 bots:

|                   | Messages per phone per second | Time in publish per second |
| ----------------- | ----------------------------- | -------------------------- |
| Before            | 220                           | 235 ms                     |
| Serialize once    | 217                           | 160 ms                     |
| Viewing one place | 77                            | 91 ms                      |

With seven places, a view of the whole town saves little. The savings grow with the map.

## Stress test

A debug flag builds the town four times over, two by two, and adds 120 residents walking between places.

<figure>
  <img src="/img/autonoma-four-villages.png" alt="The town zoomed far out, showing four villages, a river, and small residents with a few name tags.">
  <figcaption>Four villages, zoomed out. Grass and flowers are hidden at this distance.</figcaption>
</figure>

| iPhone 16, 4× map, 120 avatars | fps  | GPU per frame | GPU busy | Memory |
| ------------------------------ | ---- | ------------- | -------- | ------ |
| Following my avatar            | 28.6 | 10.4 ms       | 31%      | 531 MB |
| Camera always panning          | 26.5 | 8.1 ms        | 23%      | 557 MB |

Those were recorded with the profiler attached, and the profiler costs a busy main thread a few frames. Without it, the panning crowd held 30 fps with no late frames. The thermal state stayed nominal.

Two notes if you measure on a device. Record more than once: the first capture after installing a new build sometimes reported zero GPU time. And compare GPU busy, not frame time.

## What's left

A chunk with a village in it takes up to 60 ms to build on the main thread. That's a dropped frame when you pan into it. Next I'll move that geometry work off the main thread.
