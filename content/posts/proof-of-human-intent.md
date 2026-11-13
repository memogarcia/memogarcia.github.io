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

## Target customers and business model

Initial customers would be developers and organizations deploying autonomous agents, not individual consumers.

| Customer | Use case | Why they might pay |
|---|---|---|
| AI agent platforms | Human approval for sensitive agent actions | Reduce unauthorized operations |
| Financial technology companies | Authorization of transfers and purchases | Stronger transaction controls |
| Developer platforms | Approval of production deployments | Reduce operational and security risk |
| Enterprise IT teams | Control privileged AI agent actions | Governance and auditability |
| Legal technology providers | Evidence of approval for documents and workflows | Support accountability and audit requirements |
| Agent orchestration frameworks | Standardized authorization receipts | Avoid building independent approval infrastructure |

Revenue could come from three models:

- **Developer API:** A free tier for development and testing, followed by usage-based billing per request or completed authorization. An illustrative hypothesis is $0.01 to $0.05 per successful standard authorization, with higher pricing for advanced policies, extra controls, and audit retention, all subject to infrastructure costs and willingness to pay.
- **Enterprise platform:** Subscriptions for organization-wide policies, audit logs, enterprise identity integrations, approval workflows, hardware-backed authentication rules, and high availability with support.
- **Self-hosted infrastructure:** Commercial licensing, support, and management tooling for organizations deploying the authorization service inside their own infrastructure.

## Decentralization

Using an open authorization receipt specification lets participating providers issue cryptographically signed receipts that receiving applications can verify independently, without contacting a central service on every operation.

A decentralized design includes:

- Independent authorization providers
- Public-key discovery mechanisms
- Signed action-specific receipts
- Standardized verification libraries
- Revocation and replay-prevention mechanisms
- Interoperable policy definitions

The protocol can be open source while a company operates a managed authorization service. No blockchain is required. Bitcoin, Ethereum, or stablecoins could optionally serve as payment methods outside the authorization architecture.

## Existing standards and where the gap sits

| Technology | Existing capability | Potential differentiation |
|---|---|---|
| WebAuthn / FIDO2 | Phishing-resistant authentication using passkeys and security keys | Bind authentication to specific agent actions |
| OAuth 2.0 | Delegated application authorization | Human approval evidence for individual consequential operations |
| OpenID Connect | Identity authentication | Portable action-specific authorization receipts |
| Hardware security keys | Hardware-protected authentication and cryptographic operations | Standardized approval of agent-initiated actions |
| Digital signature platforms | Document signing and approval workflows | General-purpose authorization across autonomous agents |
| Enterprise privileged access management | Controlled access to sensitive operations | Agent-native approvals and interoperable receipts |

WebAuthn, OAuth, and security keys already cover authentication and broad delegation. The missing layer is standardized authorization built around individual agent-initiated operations.

Because much of the underlying cryptography and authentication tooling is already standardized, defensibility depends on developer adoption across agent frameworks, receipt interoperability across services, an audited security record, enterprise identity and policy integrations, and network effects as more platforms accept the same receipts.

## Major risks

- **Platform competition.** Apple, Google, Microsoft, OpenAI, Anthropic, and existing identity providers could build agent-specific authorization directly into their products.
- **Existing standards.** WebAuthn, OAuth, and digital signatures already solve large parts of this problem. The product has to prove a real gap instead of repackaging existing functionality.
- **Approval fatigue.** Requiring human sign-off for every agent action trains users to approve prompts without reading them. Risk-based policies, bounded delegation, and carefully designed prompts are needed to keep approvals meaningful.
- **Compromised interfaces.** A valid cryptographic signature does not guarantee informed consent. A malicious or compromised interface can misrepresent what the user is approving, making independent transaction-detail verification and trusted displays important mitigations.
