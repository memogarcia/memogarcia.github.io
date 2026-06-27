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

Still comfortable, but add a unique index:

```sql
CREATE UNIQUE INDEX idx_users_email ON users (email);
```

Most products treat email as case-insensitive. If yours does, make the constraint match the rule instead:

```sql
CREATE UNIQUE INDEX idx_users_email_lower ON users (lower(email));
```

B-tree. Fast enough. The useful property is enforcement. The database rejects duplicates even when your application has a race.

## 1 million users

The index still works. The problems are elsewhere.

**Connection pooling.** Every signup request hits the database. Under concurrent traffic, you'll exhaust connections if you're not pooling them (PgBouncer, application-level pooling, etc.).

**Race conditions.** Two users, same email, same millisecond. The `UNIQUE` constraint catches it, but your application needs to handle that constraint violation instead of crashing with a 500.

**Replication lag.** Reading from a replica? There's a window where a just-inserted email hasn't propagated yet. You check the replica, it says "doesn't exist," you insert on the primary, and the unique constraint fires anyway. Design for this. Either read from the primary for signup validation, or handle the conflict gracefully.

## 100 million users

Now you're making architecture decisions.

Your B-tree index on 100 million emails can be several gigabytes. The risk is the hot part no longer fits in memory, write amplification hurts, or random reads start showing up in latency.

**Do not replace the unique B-tree with a PostgreSQL hash index.** Hash indexes handle equality lookups, but PostgreSQL unique indexes are B-trees. The unique constraint is still the thing protecting the data.

**Partitioning.** Split the table by a stored email hash if it solves a measured problem. Each partition gets a smaller index, and pruning can keep lookups predictable. In PostgreSQL, a unique constraint on a partitioned table must include the partition key, so design this before it becomes your identity boundary.

**Bloom filters.** Put one in front of the database if most checks are misses. A Bloom filter answers "definitely not here" without touching disk. If it says "maybe here," you fall through to the database. False positives, no false negatives, but only if the filter is kept current. The database constraint still decides.

```
Request → Bloom Filter → "not here" → try insert
                       → "maybe"   → query database or try insert
```

## 1 billion users

A single database might still work for some workloads. Usually, the operational problem pushes you toward sharding before the query syntax changes.

### Sharding

Hash the email, pick a shard:

```
shard_id = hash(email) % num_shards
```

Each shard holds a subset. Lookups go to exactly one shard. Uniqueness stays local as long as the same normalized email always routes to the same shard. The trade-off is operational: rebalancing, failover, and anything that isn't a single-key lookup becomes painful.

### Bloom filters become useful

1 billion entries. A Bloom filter with 1% false positive rate costs about 1.2 GB of memory. Useful if misses dominate. Wasteful if almost every request needs a write anyway.

**Cuckoo filters** are worth knowing about too if you need deletion. Basic Bloom filters do not delete cleanly.

### Async work

Async work is fine for welcome emails, enrichment, and abuse checks. It is a bad fit for email uniqueness. If you accept the signup first and check later, you are choosing an account-merge problem. Keep uniqueness in the write path.

## Summary

| Scale | Technique | Complexity |
|---|---|---|
| 100 | Full scan | O(n) |
| 10K | B-tree | O(log n) |
| 1M | B-tree + pooling + conflict handling | O(log n) |
| 100M | B-tree + optional partitioning/filter | O(log n) |
| 1B | Sharding + per-shard unique constraint | O(log shard) |
