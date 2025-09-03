---
title: "LLM Glossary: A Pragmatic Guide"
date: 2025-09-03T00:00:00Z
draft: true
---

## Problem
Terms around LLMs are overloaded. This glossary gives terse, engineer‑friendly definitions with minimal examples so implementations don’t drift.

## Assumptions & Constraints
- Focus: practical LLM system design and operations (not ML theory).
- API‑centric terms; open‑source runtimes noted where relevant.
- Definitions target production reliability and reproducibility.

## Glossary (A–Z)
- Attention: Mechanism computing token‑to‑token influence. Runtime cost grows with sequence length; mitigated via caching/sliding windows.
- BPE/Tokenizer: Maps text ↔ tokens. Token counts drive cost/latency; never assume 1 token = 1 word.
- Cache (KV Cache): Stored key/value tensors for past tokens to speed next‑token decoding; resets when context resets.
- Chain of Thought (CoT): Stepwise reasoning. Useful for accuracy; risk of leaking internals. Prefer hidden reasoning or constrained outputs.
- Chunking: Split docs for retrieval. Tune size/overlap to preserve semantics and reduce embedding cost.
- Completion: Model‑generated continuation of the prompt. Contrast with tool calls/structured output.
- Context Window: Max tokens (prompt + output). Exceeding truncates or errors.
- Cost per 1K Tokens: Billing unit. Track separately for input vs output; optimize with compression and retrieval scope.
- Embeddings: Numeric vectors representing text for similarity search. Dimensionality and model choice must match index.
- Few‑Shot: Provide examples in prompt to steer behavior. Keep examples short and representative.
- Fine‑Tuning (SFT): Supervised training on labeled examples to shift style/capabilities. Distinct from pretraining.
- Function/Tool Calling: Model returns structured calls to external functions; you execute and feed results back.
- Guardrails: Validation/safety layers (schemas, allowlists, classifiers) enforcing format/content constraints.
- Grounding: Tying responses to retrieved or trusted data. Reduces hallucination; cite or include sources.
- Hallucination: Confident but false output. Mitigate with retrieval, verification, and constraints.
- JSON Mode/Schema: Enforce structured output. Use schemas + stop sequences to avoid trailing text.
- Latency vs Throughput: Trade‑off in serving. Batch or speculative decoding for throughput; streaming for UX.
- LoRA/QLoRA: Parameter‑efficient fine‑tuning via low‑rank adapters; smaller memory footprint.
- Logprobs: Per‑token probabilities. Useful for uncertainty, scoring, or abstention logic.
- mTLS/PII: Security basics. Encrypt in transit, redact logs, and scope data retention.
- Prompt: Input to the model (system + user + tools). Treat as code; version it.
- Prompt Compression: Summarize or encode context to fit within window while preserving task‑critical info.
- RAG: Retrieval‑Augmented Generation (embed → index → retrieve → answer). Most production QA systems use it.
- Rate Limits: API ceilings for RPM/TPM. Implement backoff, jitter, and smoothing.
- Rejection/Refusal: Model declines unsafe/out‑of‑scope tasks. Design fallback paths.
- Sampler (Temperature/Top‑p/Top‑k): Controls randomness. Lower = deterministic; tune per task.
- Safety Spec: Policy for allowed/blocked content. Test with adversarial prompts.
- Server/Runtime (vLLM, TGI, Ollama): Hosts models with optimized inference (paged attention, tensor parallelism).
- Session Memory: Conversation state across turns. Store selectively; purge sensitive data.
- Speculative Decoding: Fast draft model proposes tokens; larger model verifies to reduce latency.
- Stop Sequences: Tokens that halt generation to prevent run‑on outputs.
- Structured Output: Constrain to formats (JSON, XML). Validates downstream; reduces parsing errors.
- System Prompt: High‑level behavior instructions. Keep short, explicit, and testable.
- Temperature: Randomness scale 0–2. Use 0–0.3 for precision; 0.7+ for creativity.
- Top‑p (Nucleus): Sample from smallest set of tokens with cumulative probability p; alternative to temperature.
- Top‑k: Sample from top k tokens only; hard cap on diversity.
- Trace/Observability: Log prompts, outputs, latencies, and tool invocations for debugging and audits.
- Vector DB/Index (HNSW/IVF): Approximate nearest‑neighbor stores for embeddings; choose index per recall/latency needs.

## Examples

### Sampler Settings (curl)
```bash
curl -s https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-X",
    "messages": [
      {"role": "system", "content": "You are precise."},
      {"role": "user",   "content": "Summarize RFC 7231 in 3 bullets."}
    ],
    "temperature": 0.2,
    "top_p": 0.9,
    "stop": ["\n\n"],
    "max_tokens": 120
  }'
```

### Tool Calling (JSON Schema)
```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Current weather for a city",
        "parameters": {
          "type": "object",
          "properties": {
            "city": {"type": "string"},
            "units": {"type": "string", "enum": ["metric", "imperial"]}
          },
          "required": ["city"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

## Verification / DoD
- Front matter includes `post_type: technical` and `structure: reference`.
- Each term is a single concise line or two, actionable for engineers.
- At least one runnable example (curl) and one schema example included.
- Scope is API/serving‑oriented; no deep theory detours.

## Systems Note
Shared vocabulary lowers coordination tax. Ambiguity is the real latency killer.

