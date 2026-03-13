---
title: "Querying at scale"
date: 2026-03-12T19:59:00+09:00
draft: false
---

> Does this email already exist?

Same query. Completely different answer depending on whether the table has 100 rows or a billion.

## 100 users

Anything works.

```sql
SELECT EXISTS (SELECT 1 FROM users WHERE email = 'memo@example.com');
```

No index? Doesn't matter. The database scans 100 rows in microseconds. Add a `UNIQUE` constraint and move on. Your bottleneck at this scale is probably your CI pipeline.

## 10,000 users

Still comfortable, but add the index:

```sql
CREATE UNIQUE INDEX idx_users_email ON users (email);
```


B-tree. O(log n). For 10K rows that's about 14 comparisons. You won't think about it again.

## 1 million users

The index still works. The problems are elsewhere.

**Connection pooling.** Every signup request hits the database. Under concurrent traffic, you'll exhaust connections if you're not pooling them (PgBouncer, application-level pooling, etc.).

**Race conditions.** Two users, same email, same millisecond. The `UNIQUE` constraint catches it, but your application needs to handle that constraint violation instead of crashing with a 500.

**Replication lag.** Reading from a replica? There's a window where a just-inserted email hasn't propagated yet. You check the replica, it says "doesn't exist," you insert on the primary, and the unique constraint fires anyway. Design for this. Either read from the primary for signup validation, or handle the conflict gracefully.

## 100 million users

Now you're making architecture decisions.

Your B-tree index on 100 million emails is several gigabytes. It probably doesn't fit in memory anymore. Some lookups hit disk, and disk I/O is orders of magnitude slower.

**Hash indexes.** For equality checks (which this is), a hash index is O(1). PostgreSQL supports them. If you don't need range scans on the email column, consider it.

**Partitioning.** Split the table by email hash. Each partition gets a smaller index that fits in memory.

**Bloom filters.** Put one in front of the database. A Bloom filter answers "definitely not here" without touching disk. If it says "maybe here," you fall through to the database. False positives but no false negatives.

```
Request → Bloom Filter → "not here" → allow signup
                       → "maybe"   → query database
```

## 1 billion users

A single database won't work. You're sharding.

### Sharding

Hash the email, pick a shard:

```
shard_id = hash(email) % num_shards
```

Each shard holds a subset. Lookups go to exactly one shard. The trade-off is operational: rebalancing, failover, and anything that isn't a single-key lookup becomes painful.

### Bloom filters become mandatory

1 billion entries. A Bloom filter with 1% false positive rate costs about 1.2 GB of memory. Sounds like a lot until you compare it to a database query on every signup attempt.

**Cuckoo filters** are worth knowing about too. They support deletion (Bloom filters don't) and perform better near capacity.

### Async validation

At this scale, maybe you don't validate synchronously. Accept the signup, write to a queue, check later. If the email exists, notify the user after the fact. You're trading immediate consistency for availability. When your user table is larger than most countries, that's a reasonable trade.

## Summary

| Scale | Technique | Complexity |
|---|---|---|
| 100 | Full scan | O(n) |
| 10K | B-tree | O(log n) |
| 1M | B-tree + pooling + conflict handling | O(log n) |
| 100M | Hash index + partitions + Bloom filter | O(1) amortized |
| 1B | Sharding + Bloom filter + async | O(1) per shard |

The SQL barely changes. The infrastructure around it changes completely.
