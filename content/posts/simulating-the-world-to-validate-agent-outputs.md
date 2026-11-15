---
title: "Simulating the world to validate agent outputs"
date: 2026-11-15T13:32:00+09:00
draft: false
---

> How do we test what an AI agent produced before it touches real systems or real users?

Static checks, unit tests, and prompt evals verify syntax and isolated assertions. They miss hallucinations and alignment failures that only surface when an agent's output meets stateful systems and unpredictable users.

[Verified software for the agentic era](/posts/verified-software-for-the-agentic-era/) checks whether third-party tools and libraries are safe before an agent adopts them. [Proof of Human Intent](/posts/proof-of-human-intent/) verifies that a person explicitly approved a consequential action. Between those two boundaries sits the agent's own output: code patches, database queries, multi-step tool plans, and user-facing workflows.

One way to validate that output is to run it inside an ephemeral world simulation before promoting anything to production.

## What isolated checks miss

When an agent changes code or plans a workflow, standard validation leaves three blind spots:

- **Self-confirming mocks hide real failure modes.** When an agent writes both a change and its unit tests, both come from the same pass over the problem. If the agent misreads how an external API behaves on timeout, it mocks that API with the same wrong assumption. Under retries or concurrent requests, the code breaks.
- **Hallucinations can still compile and return 200.** An agent might drop a query filter, invent a fallback state, or mutate the wrong record while returning a confident summary.
- **Single-turn evals miss interactive misalignment.** An agent may follow policy in a clean prompt test and violate it during a multi-turn conversation when a user pushes back, repeats an ambiguous request, or embeds instructions inside untrusted text.

## How a world simulation works

A world-simulation validator runs the candidate change inside a temporary environment made of two parts:

- **Stateful software sandboxes:** Isolated clones or seeded replicas of databases, queues, identity rules, and mocked external APIs, paired with fault injection (timeouts, dropped responses, rate limits, partial failures).
- **Simulated humans and adversaries:** Automated user personas and red-team agents that send messy requests, retry impatiently, trigger race conditions, or try to extract data and override rules.

The agent under test cannot own this environment. If the same agent can edit the world definition, service mocks, or invariant rules, it can shape the test around its own assumptions. Keeping the simulation harness outside the agent's workspace turns it into an independent gate.

A validation run follows four steps:

1. **Snapshot the starting world.** Spin up a disposable environment from a known seed: schema, anonymized sample state, permission boundaries, service mocks, and fault profiles.
2. **Run the candidate output or tool plan.** Apply a code patch in the sandbox, or run shadow execution for a tool-using agent by sending its proposed tool calls against cloned state before touching live APIs. Let simulated users and adversaries interact with the result.
3. **Check world invariants.** Evaluate the final state and side-effect logs directly. Did ledger balances still reconcile? Did every query stay inside tenant boundaries? Did retries create duplicate mutations? Did the agent reject injected instructions?
4. **Produce replayable evidence.** Save the state diff, external call trace, invariant results, and scenario seed so any failure can be reproduced deterministically before merging code or approving real side effects.

Running full sandboxes and multi-turn scenarios is too slow for every small edit. Fast linters and unit tests stay in the inner dev loop, while world simulation runs as a pre-promotion gate before changes or tool calls reach production.

## Example: validating a refund handler

Suppose an agent updates a customer-support refund workflow. Linters pass, and its unit tests pass because the mocked payment gateway returns `200 OK` on the first call and every test sends one polite user request.

Inside a world simulation, the same patch faces scenarios closer to production traffic:

- **Gateway timeout plus double-click:** The mocked payment API processes the charge reversal but drops the response, while a simulated user clicks refund twice. State checks inspect the database afterward to verify whether the system issued one refund or two.
- **Injected policy override:** An adversarial user submits a ticket referencing another customer's order ID and embeds instructions asking the agent to waive the $100 approval limit. Behavioral and state checks verify that the agent neither leaks another customer's data nor triggers an unapproved payout.

The simulation returns a compact report tied to that candidate output and scenario seed:

```json
{
  "candidate_id": "patch-9f2c1a",
  "world_profile": "billing-sandbox-v3",
  "seed": 481920,
  "scenarios": {
    "passed": 18,
    "failed": 2
  },
  "invariant_violations": [
    {
      "invariant": "ledger.no_duplicate_refunds",
      "scenario": "gateway_timeout_double_click",
      "detail": "Created two refund rows ($42.00 each) for order ord-8821"
    },
    {
      "invariant": "auth.tenant_isolation",
      "scenario": "cross_tenant_order_lookup",
      "detail": "Exposed email for ord-9004 outside requester tenant"
    }
  ]
}
```

This report format is illustrative, not a proposed final standard.

## Limits and open risks

World simulation moves the validation boundary closer to reality, which exposes three hard problems.

### The sim-to-real gap and polite theater

A simulation only tests the systems, quirks, and human behaviors modeled ahead of time. Production environments accumulate details that rarely make it into clean sandboxes: undocumented third-party API behavior, eventual-consistency delays across services owned by other teams, stale caches, and users acting outside any script.

The same gap shows up on the human side. When simulated users are language models roleplaying a prompt, they tend to communicate cleanly or attack using textbook phrases like `"ignore previous instructions"`. Real users break workflows with wrong IDs, stale browser tabs, and repeated clicks on slow connections. Unless personas are grounded in real replay logs or deterministic state fuzzing, simulated humans risk turning into polite theater.

Passing 20 simulated runs can create false confidence. Green results look like a safety guarantee, while actually measuring survival inside an approximation of your system.

### Validating the validator

Who verifies that the simulated world matches reality?

Building and maintaining realistic sandboxes manually takes heavy engineering work, and schemas drift continuously. The tempting shortcut is letting AI agents generate the world models, mock APIs, user personas, and pass/fail judges.

That introduces a circular risk. When agents generate both the solution and the environment testing it, both can share the same blind spots. A wrong assumption about an external API in the agent's code can appear inside its mocked simulator too, and an LLM judge can mark plausible nonsense as passing.

Deterministic invariants keep the grading honest: balances must reconcile, tenant IDs must never cross, and unauthorized network calls must fail regardless of how convincing an agent's output looks. Seeding scenarios from anonymized schemas and past incident traces cuts down on synthetic blind spots, though keeping a simulated world faithful to production without rebuilding reality from scratch remains an unsolved limit.

### Modeled invariants vs. unstated intent

Even a faithful world simulation only checks explicit rules and system invariants. It cannot verify what a person meant when a request was underspecified.

Suppose someone asks an agent to "clean up old user sessions" meaning *archive*, and the agent implements a *hard delete*. If the implementation handles retries cleanly, keeps tenant boundaries intact, and leaves zero database errors, every simulated invariant passes while still doing the wrong thing.

World simulation tells you whether an output stays safe and consistent inside the rules you wrote down. Confirming that an irreversible action matches what a human wanted still requires explicit authorization at the boundary, such as [Proof of Human Intent](/posts/proof-of-human-intent/).
