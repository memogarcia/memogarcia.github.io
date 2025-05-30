---
title: "Behavior-driven development with LLMs"
date: 2025-01-22T00:03:30+01:00
draft: false
---

Have you ever asked an LLM, "Build me a CRUD API in FastAPI," and just hoped for the best? LLMs are great at taking broad requests and letting us talk to computers like they’re people. But that freeform style can bring surprises and make it tough to get the same result twice.

Behavior-Driven Development, or BDD, offers a clear framework. It guides you to:
1. Define exactly what you expect
2. Set clear boundaries for the solution
3. Keep everything documented in plain language

## Creating a prompt plan using BDD

A "prompt plan" is basically a roadmap for your LLM. Here's an example:

```bash
Feature: CRUD API for managing users

Background:
  We're building a REST API using FastAPI.

Context:
  - Endpoint base: "/users"
  - Language: Python 3.13
  - Libraries: httpx, fastapi, pydantic, uvicorn, tortoise-orm

Scenario: Creating a new user
  Given there's an endpoint for creating users at "/users"
  When a POST request is made with these details:
    - email: user@example.com
    - password: secure_pass
  Then the API returns a 201 status and user info
  And the user is stored in the database
```

When you structure prompts like this, the LLM knows exactly what success looks like, making it easy to verify results.

## How to use the prompt plan

Pass your prompt directly to the LLM. Clear prompts mean clear results. You'll quickly know whether the output matches expectations.

## LLM limitations

Besides the well-known hallucination issues with LLMs, there are some major limitations:

1. Context size: Even newer models have limits to how much information they can handle at once.
2. Context awareness: LLMs start fresh with every prompt, so restating context clearly is essential.

## Tips for Better Results

1. Don't let LLMs make assumptions unless you intentionally want them to.
2. Clearly describe your expectations.
3. Define the style or personality if it matters.

### ChatGPT is not the only game in town

You can also explore other models like Claude, DeepSeek, or even self-hosted solutions. Pick what suits your use case best.

### Have a clear goal in mind

Techniques like BDD or TDD help keep prompts clear and goal-focused. Define exactly what you want to achieve, then craft your prompts around those specific outcomes.

Using a structured method like this ensures results that are predictable, repeatable, and much easier to validate.

## Conclusion

Behavior-driven prompt planning gives your LLM clear success criteria and makes results predictable and verifiable. By defining expectations upfront and documenting scenarios, you’ll spend less time debugging and more time delivering reliable APIs.