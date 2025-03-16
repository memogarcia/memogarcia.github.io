---
title: "Behavior-driven development with LLMs"
date: 2025-01-22T00:03:30+01:00
draft: false
---

It's tempting to simply tell an LLM something like, "Build me a CRUD API in FastAPI," and watch it get to work. It's impressive because:

1. LLMs can deal with vague instructions.
2. We can "talk" naturally to computers.

However, this approach is very imperative and hard to repeat consistently. It makes outcomes difficult to predict or verify.

It helps to structure your prompts clearly, and that's exactly where `Behavior-Driven Development (BDD)` comes in handy. BDD gives you a structured way to prompt your LLM by:

1. Clearly defining what you expect.
2. Setting explicit requirements and boundaries.
3. Documenting the process clearly and simply.

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

Besides the well known hallucination issues with LLMs there some huge limitations:

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