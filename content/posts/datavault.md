---
title: "We really need a data vault to grant on-demand access to our data"
date: 2026-11-13T16:51:00+09:00
draft: false
---

> (or get paid to access your data)

Every time I buy something online or sign up for a service, I hand over personal information: my home address, phone number, email, or payment details. Once I hit submit, that data sits in someone else's database indefinitely.

Recent hacks keep showing what that opens us up to. Any company keeping a copy of my records is a target for malicious access. When a database gets breached, or someone inside pulls records they shouldn't, information I shared years ago gets stolen. Giving AI agents broad, permanent permissions to my accounts creates the same problem in a new place.

My info should be in their systems for as long as necessary, not more than that.

AWS already works this way for infrastructure. Instead of handing out permanent keys, STS issues short-lived tokens scoped to specific actions for a limited window. When that window expires, the access is gone.

Why not treat personal data the same way? Keep it in an encrypted vault we control, and grant access on demand for a specific reason.

## Example: giving my address for shopping

Suppose I buy something online and the store needs my address to ship it.

Today, I type my home address into their checkout form and it stays in their database for years, even if I never buy from them again. If that store gets hacked two years later, my address is in the leaked records.

Why does a company still have my home address two years after delivering a box? They needed it to ship the order, not to hold on to it permanently.

With a data vault, we could handle checkout differently:

1. The store requests my shipping address for one order, for a window covering fulfillment and delivery.
2. I review the request and approve it.
3. The vault issues a temporary token scoped only to my shipping address.
4. Their system reads the address to ship the package.
5. Once the delivery window ends, the token expires and access stops.

They only have access to my address while delivering the package, not for years afterward.

## What we could do

We do not have to keep leaving permanent copies of our personal data everywhere. With a personal data vault, we could:

1. **Keep one encrypted vault.** Store your personal records locally on your device or in infrastructure you own.
2. **Make access requests explicit.** Anything asking for data, whether an online store or an AI agent, has to declare which fields it needs, why it needs them, and for how long.
3. **Issue short-lived, revocable tokens.** Grant a temporary token scoped to that specific job. If something looks wrong, revoke it right away.
4. **Log every access.** Keep an audit trail of every request and every read, so unexpected access stands out.
5. **Share answers, or get paid for queries.** Sometimes a service does not need your raw records at all, only a yes/no check or a computed result. If companies want to run approved queries over data you choose to share, they can pay for that scoped access.

## What makes this hard

Expiring tokens cut down standing exposure, though they do not solve everything on their own:

- **A service can still copy data while the token is live.** If a store reads my address at checkout and saves a copy in its own database anyway, expiring the token later will not delete that copy. Keeping data out of third-party tables long term also depends on honest retention practices or intermediary delivery flows where the merchant never sees the raw address.
- **Companies treat customer data as an asset.** Most businesses want permanent user profiles for marketing and analytics. Getting merchants to accept temporary access is harder than building the token layer.
- **One vault raises the stakes if it gets compromised.** Putting sensitive records in one place means local encryption, key storage, and access controls have to be solid from the start.
- **Big platforms may build closed versions.** Apple, Google, or major AI providers could keep similar permission controls locked inside their own ecosystems.

## Where we could start

We do not need every store or platform on board to try this. A practical first version stays local-first:

1. Encrypted storage on your device for personal data like addresses, documents, and health or financial records.
2. A request format for AI agents and apps to ask for specific fields with a purpose and a time limit.
3. Short-lived access tokens with instant revocation.
4. An audit log showing every request and every access.

AI agents are an easy place to test this first, because we already connect them through tools and APIs. If the pattern works there, the same idea applies to any company asking for our data.
