---
title: "Verified software for the agentic era"
date: 2026-11-13T16:48:20+09:00
draft: false
---

Is this library my agent is using safe? Does it leak information? Is it compromised?

When AI makes writing code cheap, the number of libraries, MCP servers, skills and agent tools grows fast. Agents increasingly discover and run code written by other developers or other agents, and auditing every component from scratch does not scale.

When software becomes abundant, independent evidence of software quality becomes the scarce resource.

## How verification works

The idea is an independent service that evaluates libraries, MCP servers, skills and agent tools, then publishes machine-readable, cryptographically signed evidence about their security and functionality.

1. **Software registration.** A developer submits a repository or artifact location, a version with its cryptographic hash, software metadata, declared capabilities and permissions, and expected interfaces. The service does not host or distribute the software.
2. **Independent checks.** The platform combines deterministic tooling (static analysis, dependency and vulnerability scanning, sandboxed execution) with AI-driven checks (generated functional tests, dynamic security testing, permission and data-exfiltration testing, behavioral evaluations). Deterministic suites handle repeatable checks at low cost, while AI agents probe complex behavior and write extra test cases. Whoever pays for the assessment cannot edit or suppress unfavorable findings in an issued report.
3. **Signed verification evidence.** Findings publish as a structured report tied to that exact version and artifact hash.
4. **Agent-facing API.** Before running a tool or installing a package, an agent queries the API and enforces its own trust policy against the result.

A signed report stays compact enough for an agent to parse quickly:

```json
{
  "artifact": "invoice-parser",
  "version": "1.4.2",
  "artifact_hash": "sha256:...",
  "verifier": "independent-verifier",
  "verified_at": "2027-03-01T10:00:00Z",
  "results": {
    "functional_tests": {
      "passed": 48,
      "total": 50
    },
    "critical_vulnerabilities_found": 0,
    "permission_findings": 1
  },
  "evidence_url": "https://example.org/report/123",
  "signature": "..."
}
```

The report records what was tested and what evidence came back. It does not guarantee that the software is completely safe or correct.

To check an artifact before execution, an agent makes one request:

```http
GET /v1/verify?artifact=invoice-parser&version=1.4.2
```

The response carries the verified artifact identity, test results and evidence links, known security findings, requested permissions, verification freshness, the verifier's identity and signature, and the scope and limits of the assessment. The agent applies its own trust policy to decide whether to use the tool.

## Choosing between three libraries

Say an AI coding agent needs to parse Japanese invoices. Instead of writing a new parser, it discovers three existing libraries.

It queries the verification API to compare their capabilities, test coverage, security findings, and compatibility, then picks an implementation that fits its requirements. The point is reducing the uncertainty and repeated verification work involved in trusting external code.

## An open protocol

Verification works better as an open protocol than as a centralized app store:

- **Developers** publish software wherever they prefer: GitHub, npm, PyPI, container registries, or their own servers.
- **Independent verifiers** publish signed assessments, and multiple verifiers can inspect the same software version.
- **Registry operators** index capabilities alongside verification evidence.
- **Agents** query those registries and enforce their own security policies.

Cryptographic signatures and transparency logs provide auditability without requiring a blockchain. If payments are involved, methods like Bitcoin, Ethereum, or stablecoins can sit outside the verification protocol itself.

Most of the surrounding standards and tooling already exist:

| Technology | Relevance |
|---|---|
| MCP Registry | Discovery and metadata for MCP servers |
| ERC-8004 | Decentralized agent identity, reputation, and validation |
| ERC-8257 | Proposed tool registry with metadata and attestations |
| Sigstore | Cryptographic software signing and transparency |
| in-toto | Software supply-chain attestations |
| Snyk / Socket | Software dependency and security analysis |

Building verification infrastructure that existing registries and marketplaces consume beats starting another package registry.

## Verifier incentives and open risks

Keeping the protocol open lets different verifiers compete on test coverage, historical accuracy, and reputation. Reusing deterministic tests lowers the cost of repeated runs, and connecting directly to coding agents and distribution channels puts verification evidence where tool choices happen.

Even with that structure, the model has real failure modes:

- **A signature does not prove accuracy.** Signing a report proves who issued it. It says nothing about whether the assessment was competent or honest, and malicious actors could run dishonest verifiers.
- **Verification goes stale.** Software and its dependencies change, and yesterday's passing check stops holding as new vulnerabilities appear.
- **Testing arbitrary code is expensive.** Isolating untrusted tools safely while exercising real behavior is technically hard and costly to run.
- **Incumbents already scan dependencies.** Existing security vendors like Snyk or Socket could expand into autonomous-agent verification on top of infrastructure they already operate.
- **Agents may regenerate instead of reuse.** When writing small utilities is cheap enough, agents might write fresh code rather than take on external dependencies.
- **Weak adoption incentives.** Maintainers will not bother with third-party verification unless it visibly helps distribution or adoption.
