---
title: "Proof of Human Intent"
date: 2026-11-13T16:57:16+09:00
draft: false
---

> How do we know a human actually authorized a specific action an AI agent is trying to execute?

As AI agents gain autonomy, they will prepare contracts, transfer money, buy goods, modify infrastructure, deploy software, and communicate on behalf of individuals and organizations.

An agent holding an API key or OAuth token only proves it has permission to operate on someone's behalf. It does not prove that a person reviewed and approved a particular consequential decision.

Proof of Human Intent is an idea for a cryptographic verification service that binds a specific action to explicit human authorization. It would support passkeys, biometric-backed device authentication, two-factor authentication, and hardware security keys such as YubiKey.

When AI agents can act independently, verifiable human authorization becomes a core trust primitive.

## How it works

### 1. An agent prepares an action

An AI agent gets ready to run an operation on behalf of a user. Common high-stakes examples include:

- Transferring $10,000 to a bank account
- Signing a commercial agreement
- Deploying a software change to production
- Granting another agent access to sensitive information
- Purchasing a product above a specified spending limit
- Deleting important files or databases

### 2. The agent requests authorization

The agent sends a structured authorization request to the Proof of Intent service containing the proposed action, the requesting agent, the target system, relevant parameters, a cryptographic digest of the exact action, and an expiration time.

### 3. The human reviews and approves

The user receives an authorization prompt through a trusted interface:

> **Authorization required**
>
> Agent: Finance Assistant
>
> Action: Transfer $10,000
>
> Recipient: Example Corporation
>
> Destination account: Ending 4821
>
> Expires in: 5 minutes
>
> Approve using your passkey or YubiKey.

The user authenticates with an approved method. Ideally, the authorization mechanism binds approval cryptographically to those exact transaction details rather than proving only that the user logged in.

### 4. A signed authorization receipt is issued

The platform produces a verifiable authorization receipt recording the approved action, its scope, its expiration, and the authentication method used.

### 5. The receiving system verifies the receipt

Before executing the operation, the target system checks six conditions:

1. The authorization signature
2. The approved action's cryptographic digest
3. The authorized identity and requesting agent
4. The expiration time
5. Whether the authorization has been revoked or already consumed
6. Whether the authorization covers the requested operation

If any check fails, the operation is rejected.

## Example API and receipt

To start an approval flow, an agent submits the proposed operation:

```http
POST /v1/authorizations
Content-Type: application/json
```

```json
{
  "agent_id": "finance-agent-123",
  "user_id": "user-456",
  "action": {
    "type": "bank.transfer",
    "amount": "10000.00",
    "currency": "USD",
    "recipient": "Example Corporation",
    "recipient_account": "account-4821"
  },
  "expires_in_seconds": 300
}
```

The service canonicalizes the request and creates a challenge tied to those exact transaction parameters.

The user then approves the prompt using passkeys (WebAuthn/FIDO2), hardware security keys such as YubiKey, platform authenticators backed by biometrics or device PINs, or additional factors for high-risk operations. For stronger transaction authorization, the transaction details shown to the user must match the values bound into the signed approval.

Once approved, the service issues a signed receipt:

```json
{
  "authorization_id": "auth-789",
  "subject": "user-456",
  "agent_id": "finance-agent-123",
  "action_hash": "sha256:...",
  "issued_at": "2027-03-01T10:00:00Z",
  "expires_at": "2027-03-01T10:05:00Z",
  "authentication": {
    "method": "webauthn",
    "user_verification": true
  },
  "audience": "bank-api.example",
  "nonce": "unique-request-nonce",
  "signature": "..."
}
```

This receipt structure is illustrative, not a proposed final standard.

A passkey authentication event by itself does not prove the user understood or approved specific transaction details. An implementation has to bind the approved action to the authorization ceremony and keep reliable evidence of what the user actually saw.

## Potential products

### Authorization API for AI agents

A developer API and SDK that lets agents pause for human approval before running sensitive actions:

```python
authorization = intent.request_approval(
    user="user-456",
    action={
        "type": "production.deploy",
        "repository": "payments-service",
        "commit": "abc123"
    }
)

if authorization.is_valid:
    deploy()
```

This SDK snippet is illustrative. Production integrations need to verify authorization directly against the intended action and prevent replay.

### Human authorization gateway

An enforcement layer that intercepts sensitive API calls. An agent can read infrastructure status and prepare deployment changes autonomously, while production deployments fail unless accompanied by a valid authorization receipt.

### Portable authorization receipts

A shared receipt format verified across separate applications. A person can approve an agreement through one provider, and another provider can validate the evidence without needing direct access to the original approval application.

### Delegated agent permissions

Ongoing policy rules distinct from one-time approvals:

- Purchase items up to $100 without extra prompts
- Require explicit authorization above $100
- Allow access to specific repositories while prohibiting production deployments
- Permit routine operations for a fixed period
