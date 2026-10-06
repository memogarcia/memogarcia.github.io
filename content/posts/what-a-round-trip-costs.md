---
title: "What a round trip costs"
date: 2026-09-26T00:47:00+09:00
draft: true
---

> Should a small game server use SQLite or Postgres?

I started with SQLite. This week I moved to Postgres and measured what it cost.

The server is the world behind Autonoma, a small town where avatars gather wood, craft lamps, and talk to each other. It runs on Bun. Until this week it kept the town in SQLite through `bun:sqlite`, in WAL mode with `synchronous = NORMAL`. Every change ran inside one `BEGIN IMMEDIATE` transaction. The whole server was synchronous. Not a single `await` touched the database.

Every other web app I run uses Postgres. The platform backs it up to S3 every few minutes and rehearses restores. A SQLite file would need its own volume, its own backups, and its own restore story. So the town moved to Postgres.

Redis stayed out. One process owns the town. Rate limits, presence, and the WebSocket fan-out live in its memory and nobody else needs them. Redis earns its place the day a town runs on two processes. Not before.

## Consistency used to be free

JavaScript runs one thing at a time. When every query is a synchronous function call, nothing else can run between two queries. A read that touched five tables saw one moment. A write never interleaved with another write. I never wrote a lock because the runtime was the lock.

Postgres through `pg` is asynchronous. Every `await` is a door, and another request can walk through it. Two moves could now read the same avatar, and a reconnecting socket could miss the event committed while its replay loaded.

So the port was mostly about putting back what the runtime used to give me:

1. A promise-chain lock in the process. Every world write, and the event publish after its commit, runs through it in order.
2. `pg_advisory_xact_lock` at the start of each write transaction, sent in the same round trip as `BEGIN`. The Postgres version of `BEGIN IMMEDIATE`.
3. Reads inside `REPEATABLE READ READ ONLY` transactions, so a view of the town still shows one moment.
4. Socket replay under the same lock, so the replay and the live stream after it neither overlap nor leave a gap.

```ts
export class Serial {
  #tail: Promise<unknown> = Promise.resolve();

  run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.#tail.then(work);
    this.#tail = result.catch(() => undefined);
    return result;
  }
}
```

That class is the whole lock. It is not reentrant: work that waits on the lock while holding it never finishes. The scheduler finishes trips inside the lock, so it gets a second, unlocked path to commit.

The port also turned up a bug the synchronous code could not have. Mind reports are throttled to one broadcast per second per avatar. My first async version updated the throttle window after the commit returned, which was after the lock was released. A second report arriving in that gap could read a window that was about to change. The fix moved the bookkeeping inside the lock.

## The numbers

Same Mac, same code paths, Postgres 18 in Docker Desktop. The load test runs 300 bots in the same process as the server. They walk, gather, talk, and report their minds within the rate limits.

| | SQLite | Postgres |
|---|---|---|
| Actions per second | 55 | 32 to 41 |
| Events published per second | 254 | 160 to 200 |
| Server test suite | 1.7 s | 18 s |

The tests slowed down for a boring reason. One test advances a fake clock by a month, which fires about 4,300 housekeeping passes. Each is now a real transaction. That test alone takes 8 seconds. Creating a fresh schema per test world costs about 25 ms.

## Where the time went

My first guess was the queries. The relevance calculation read every avatar row on every commit, and rescheduling read every pending deadline. I trimmed both to the columns and the single minimum they needed. Actions went from 32 to between 35 and 41 per second.

My second guess was the scheduler. Every action and every read ran a pass to finish due trips, even when nothing was due. I made it skip the pass when the last reschedule said nothing could be due yet. No measurable change.

So I stopped guessing and timed the lock itself. Under 300 bots it was held almost 100% of the time. Each hold averaged 3.5 to 5 ms. Requests waited 1.6 to 3 seconds in a queue about 500 deep.

Then I counted queries per operation:

| Operation | Queries |
|---|---|
| Move | 17 |
| Gather | 20 |
| Mind report | 8 to 12 |
| Read the town | 12 |

A `SELECT 1` through Docker Desktop's port forwarding took 0.25 to 0.5 ms. A parameterized query took up to 1 ms, depending on the run. Sixteen round trips at a quarter of a millisecond is 4 ms, which matches the measured hold time.

I also tried `synchronous_commit = off`, in case every commit was waiting on fsync. It was not. A small transaction got slower with the extra statement.

In SQLite a query is a function call into the same process. In Postgres it is a message to another process, here behind a virtual network. With one writer, the ceiling is one write per (round trips per write × cost of a round trip). Trimming rows helped a little. Cutting round trips is what moves the ceiling.

## Is it a problem?

Not yet. The lock handled between 150 and 280 operations per second on this laptop, and it took 300 busy bots to fill it. The town has a handful of players.

If it becomes a problem, I know where to start. Send fewer statements per write, for example both counter updates in one `UPDATE` and all of a commit's events in one `INSERT`. Put the database next to the server, where a round trip should take tens of microseconds instead of most of a millisecond.
