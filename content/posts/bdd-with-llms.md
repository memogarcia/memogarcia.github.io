---
title: "Behavior-driven development with LLMs"
date: 2025-01-22T00:03:30+01:00
draft: false
---

It is tempting to tell an LLM, “Build me a CRUD API in FastAPI,” and watch it do its thing. And sure, it’s amazing that:

1.	LLMs can very vague requirements, and
2.	 That we are able to “talk” to computers this way

However, this tend to very a very imperative and not so repetable approach. This makes things “difficult” to predict and validate against an expected outcome.

It also makes difficult to test different LLMs on the same task to validate correctness, speed and price.

This is where **Behavior-Driven Development (BDD)**, The idea is to leverage it in order to gives us a structured, testable approach to prompting, this will help us to:

1. Be precise on the outcome.
2. Set clear requirements and constraints for the LLM to work with.
3. Document the process in a declarative way.

## Creating a prompt plan using BDD

A “prompt plan” is basically a blueprint for your LLM. For example:

```bash
Feature: CRUD API to manage users
  As a system administrator, I want to manage users by performing create, read, update, and delete (CRUD) operations
  using a RESTful API, so that user data is efficiently managed.

  Context:
    Files to be added:
      - main.py
      - users.py
    Constraints:
      - Language: Python 3.13
      - Libraries: httpx, fastapi, pydantic, uvicorn, tortoise-orm

  Scenario: Create a user
    Given an API endpoint for creating a user at "/users"
    When a user sends a POST request to the endpoint with valid user data:
      | Field      | Value       |
      | username   | test_user   |
      | email      | test@test.com |
      | password   | securePass123 |
    Then the API should return a response with:
      | Field      | Value       |
      | username   | test_user   |
      | email      | test@test.com |
    And the user should be saved in the database
```

When we write prompts like this, we give the LLM a clear target, making it easier to confirm whether the output matches our expectations.

## How to use the prompt plan

Just pass the plan to the LLM, if you are using [Aider AI](https://aider.chat) you can "copy-paste" the `prompt plan` directly into the terminal session.

## LLM limitations

Besides the well known hallucination issues with LLMs there some huge limitations to them:

1. Context size, Even with newer models offering larger “windows” for text, there’s still a limit to how much they can process at once.
2. Context awareness, LLMs typically start fresh every time you prompt them. They don’t automatically know your entire codebase or environment. Unless you restate your requirements, they may miss critical details or propose solutions that conflict with your existing system.

These limitations don’t make LLMs any less impressive—they just mean we need a solid plan, like BDD, to get consistent and testable results. 

## Other tips

### Bad input, bad output

1. Unless this is what you are looking for, don’t let LLMs assume stuff.
2. Give as much detail and description of the outcome as possible.
3. Set some personality to your LLMs by setting writing styles and tone of voice.

### ChatGPT is not the only game in town

There are several options out there—self-hosted models, Claude, DeepSeek (depending on your situation).

### Editor

Using something like VSCode with Copilot (or similar tools) places the LLM right in your development workflow. That can be more convenient than copying prompts into a separate tool.

### Have a clear goal in mind

Methods like Test-Driven Development (TDD) and Behavior-Driven Development (BDD) can keep your LLM prompts focused. Know what you want to achieve from the start, then build the prompts around those specific outcomes.