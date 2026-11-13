# Writing Style & Tone of Voice

## Core Principle: Intention First

The main reason AI writing feels sloppy and exhausting to read is that it has no intention.

When an AI writes without intention, it tries to cover a topic instead of delivering a specific thought. It invents stakes, smooths over uncertainty, pads weak points with symmetrical phrasing, and wraps everything up with a tidy moral. Every sentence is grammatical, yet reading it feels like work because the reader keeps searching for what the writer actually wants to say and keeps finding rhythmic filler instead.

Your blog is different. As your About page puts it, it is "intended as a self reference." Your best posts exist for a concrete reason, stay inside that boundary, and stop as soon as the job is done.

### Lock the Intention Before Drafting

Before writing prose, define four things:

1. **Trigger:** What actually happened, broke, annoyed you, or sparked the question?
2. **Job:** What is this post doing? (Logging a benchmark for future-you, explaining a debugging dead end, working through an intuition, introducing a tool you built, capturing one sharp observation, or telling one short story.)
3. **Throughline:** What is the single question, claim, or sequence of events? Every paragraph must move it forward. Anything that merely "covers the topic" gets cut.
4. **Stopping point:** Where is the job finished? End there.

### No-Invention Rule (For AI Agents)

Never invent a trigger, a 3 AM outage, a personal failure story, a benchmark, or fake uncertainty to make an opening feel authentic. Use only real details, constraints, measurements, and doubts provided in the prompt or source files. If the trigger or concrete facts are missing, ask for them before drafting.

---

## How Intention Shapes a Post

- **Open inside the tension or context.** Start with what happened or the question on the table, with no industry warm-up. *Why a toy town heated my iPhone* begins with the phone going into serious thermal state over a tiny diorama. *Why I built verachi.io* starts with 900 people unable to answer what was shipping. *What a round trip costs* starts with the SQLite-to-Postgres experiment.
- **Cut adjacent explanations.** Write for future-you or a peer tackling this specific problem. Skip introductory summaries written for an imaginary beginner. In *What a round trip costs*, Postgres stays scoped to a single-writer game server and its lock rather than becoming a general database comparison.
- **Keep wrong turns and honest unknowns.** State what you tried first, what backfired (baked shadows in *Why a toy town heated my iPhone* lowered frame time from 16.5 ms to 14.4 ms and made the phone hotter), and what you still cannot explain ("I don't fully know why the cost per frame also fell... My guess is...").
- **Stop when the job is done.** End with the next concrete step ("Next I'll move that geometry work off the main thread."), a plain boundary ("I just wanted my records in order for the next appointment."), or stop as soon as the point lands ("That's why I built verachi.io", "I wish I had it two years ago.").

---

## Voice Modes

Match the voice to the post's job instead of forcing one persona onto everything.

### 1. Engineering Notes & Debugging Logs
*Examples: What a round trip costs, Why a toy town heated my iPhone, Querying at scale*

Plainspoken and anchored in artifacts. Lead with the symptom or question, include exact commands, code, or measurements, note dead ends, and stop at what remains unfinished.

### 2. Opinion & Systems Thinking
*Examples: Is OpenStack fighting a lost battle?, Is complexity a human construct?, Lateral Thinking*

Starts with a direct question or challenge. Pulls in outside domains (biology, game theory, organizational culture, music, sci-fi) when the comparison sharpens the idea. Stacks rhetorical questions to expose tension, and owns genuine doubt ("Or, is it just an illusion and an echo chamber from the people I work with?").

### 3. Product & Project Posts
*Examples: I built the app of my dreams, Nomi, Why I built verachi.io*

Leads with the lived friction, explains what the tool does in ordinary words, and states what you intentionally left out ("with no account, no cloud sync, and no external AI"). Avoids launch-post hype.

### 4. Micro-Posts
*Examples: Focus, Simplicity, Why am I always busy?, The cloud native inefficiencies*

One to ten lines. Deliver a single sharp thought and stop. A two-line post like *Simplicity* or a three-word post like *Focus* ("Just say no.") is complete as written.

### 5. Personal Reflections & Short Stories
*Examples: T minus 8 minutes, Happiness*

Drop the systems-engineer voice completely. Never describe human moments using technical metaphors (such as calling a relationship a protocol or a book a database). Keep prose direct and unpolished.

---

## Tone & Craft Characteristics

| Trait | How it looks in your posts |
|---|---|
| **Direct and economical** | Short declarative sentences with no throat-clearing. "Just say no." (*Focus*) |
| **Peer-to-peer** | Conversational without talking down or performing cleverness. Occasional mild profanity appears only when earned ("That was a shitty situation" in *Why I built verachi.io*). |
| **Quietly opinionated** | Clear positions with minimal hedging. "The answer is yes." (*GitOps*), "Rewrite it in Rust. /s" (*OpenStack*) |
| **Self-aware and honest** | Explicit about limits and guesses. "I'm not an astrophysicist, this is just a fun thought experiment." (*TARDIS*) |
| **Warm but restrained** | Feeling shows through understatement rather than exclamation marks. "I owe my career to OpenStack… For that and more, thanks a lot OpenStack. However…" (*OpenStack*) |

### Structural & Craft Habits

- **The "why before what" instinct:** Across technical notes, architecture opinions, and career advice, push to understand *why* something works or fails before prescribing *what* to do.
- **Cross-domain thinking:** Bring in biology, game theory, organizational culture, music (*Tool*), film, or sci-fi (*Doctor Who*) when the parallel genuinely clarifies the system.
- **Observation over rant:** Notice organizational and cultural patterns with quiet reflection. Avoid turning critique into a loud internet complaint.
- **Sentence length:** Mostly short (8 to 20 words). Use longer sentences when concrete explanation requires them, followed by a short line for emphasis.
- **Technical terms with plain meaning:** Use real terms (`CIDR`, `Bloom filter`, `pg_advisory_xact_lock`, `RealityRenderer`) without apology, and explain how they behave in practice. Never use shame words like "obviously," "simply," or "just" when explaining a concept.
- **Consistent analogies with explicit limits:** When using an extended metaphor (buildings, rooms, doors, and room numbers in *Understanding Computer Networks by Analogy*), keep one stable map and include a section showing where it breaks ("Where the analogy bends").
- **Blockquote anchors:** Open with a short framing quote when it sets the question or boundary (`> Should a small game server use SQLite or Postgres?`, `> A made up mind is hard to change (Jeff Bezos or Confucius, I don't know who, but the phrase got stuck with me)`).
- **Numbered frameworks for advice:** Default to numbered steps or tight lists when giving actionable guidance (*Being DevOps*, *Lateral Thinking*, *How I design UI/UX with AI*).
- **Deliberate hedging and bilingual touches:** Keep hedging specific ("I think", "most probably yes", "My guess is"). Japanese lines appear naturally when they belong (*Why am I always busy?*, *About*).

---

## Summary Formula

> **Your writing = engineering precision + intellectual curiosity + emotional restraint + respect for the reader's time.**

If your voice were a person at a conference, they'd be the one who gives the shortest talk, gets the most questions afterward, and then tells you about a weird board game over coffee.

---

## Avoiding AI-Style Writing

Surface AI tropes are symptoms of missing intention. When a draft has real intention and concrete detail, most of these disappear on their own. When editing, watch for what slipped back in:

| Signal | What it looks like |
|---|---|
| **Contrastive parallelism** | Manufactured insight through formulaic contrast: "It's not X, it's Y", "Not just X, but Y", "This isn't about X, it's about Y." |
| **Rule-of-three padding** | Grouping adjectives or abstract phrases in threes for cadence ("clean, reliable, and scalable"). |
| **Faux intimacy and crutches** | Forced openers: "Here's the thing...", "Let's be real...", "Honestly,", "At the end of the day," "First off,". |
| **Waiting-room hype** | Vague filler: "seamlessly", "transformative", "cohesive", "effortlessly", "robust", "leverage". |
| **Low information density** | Smooth prose that restates the same idea in slightly different words across consecutive sentences. |
| **Uniform paragraph cadence** | Repeating the same claim, contrast, example, wrap-up shape across paragraphs. |
| **Neat-bow endings** | Tacking on a sweeping takeaway or a poetic callback to the opening line. |

### Editing Rules

1. **Check every paragraph's job.** If a paragraph only summarizes the general topic or restates the previous point, cut it.
2. **Kill contrastive parallelism.** Rewrite "It is not just an optimization. It is a correctness guarantee." as "It is a correctness guarantee."
3. **Cut empty connectors and hype.** Remove conversational crutches ("Honestly,", "The crazy thing is,") and replace buzzwords with what the system actually does.
4. **Break artificial triads.** Use lists of three only for three real items ("papers, medicines, and Apple Health readings"). Never stack three adjectives for rhythm.
5. **No em dashes.** Use periods, commas, parentheses, or restructure the sentence.
6. **Vary rhythm and respect short thoughts.** Mix short punches with concrete explanation, and cut a 500-word draft back down if the real thought only needs 4 lines.
7. **Leave personal pieces unpolished.** In personal reflections or stories, drop structural scaffolding and let moments end naturally.

### The test

Read the draft aloud. If it sounds like it could have been written by anyone, it needs more of you in it.
