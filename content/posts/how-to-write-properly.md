---
title: "How to write properly (or not)"
date: 2025-07-13T10:00:00+01:00
draft: false
---

How do you write properly?

Wrong question. Better one: given what I'm trying to communicate, how can I make my thinking clear to someone else?

Most writing advice comes from people who never had to explain why a Kubernetes pod is stuck pending at 3 AM. "Write like Hemingway," they say. "Use active voice." Great for novels. Useless when documenting why your deployment exploded last Tuesday.

I write a lot. Blog posts, documentation, incident reports, code comments that future-me will actually read. The more I write, the more I realize "proper" writing advice gets in the way of clear communication.

Everyone says "be concise." Have you tried explaining microservices in three sentences? You can, but you'll skip every detail that matters. Sometimes concise is just confusing.

"Know your audience." Sure. Except your audience is junior devs who need context, senior engineers who want solutions, and product managers who just want to know if it'll break again.

Here's what I've learned about writing from an engineering perspective:

1. **Write like you're debugging.** Start with the symptom, show your investigation, present your solution. Don't hide the process. It's often more valuable than the conclusion.

2. **Embrace iteration.** Your first draft will be terrible. That's not a bug, it's a feature. Get ideas out, then refactor like code.

3. **Document your assumptions.** That obvious thing? It's not. Future-you will thank present-you for explaining the why.

4. **Use examples liberally.** Abstract concepts live in your head. Concrete examples work for everyone else.

5. **Test your explanations.** Can't follow your tutorial from zero to working solution? Your writing has bugs. Fix them.

Writing is system design. You're building an information architecture that moves thoughts from your brain to someone else's with minimal data loss.

Sometimes that needs verbose error messages. Sometimes extensive logging. Sometimes the elegant solution looks messy but handles edge cases.

Most writing advice optimizes for style. Engineering writing optimizes for understanding. Not the same thing.

Here's what understanding gets you: it forces clear thinking about what you actually know versus what you think you know. Rubber duck debugging for ideas.

When I write about Kubernetes networking, I discover gaps in my understanding. Explaining forces me to test mental models against reality. When explanations fall apart, that's when I learn most.

Maybe the real question isn't "how do you write properly?" Maybe it's "how do you think clearly?"

Answer: you write. Badly at first, better through iteration.

The best technical writing follows debugging principles: start with the problem, show your work, explain reasoning, provide reproducible examples.

Writing like an engineer beats writing like a writer.

Now, if someone could just explain to me why my blog's CSS looks fine locally but breaks in production...