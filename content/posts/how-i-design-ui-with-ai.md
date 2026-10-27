---
title: "How I design UI/UX with AI"
date: 2026-09-18T12:38:00+09:00
draft: false
---

> Make people's lives easier, not your interface more impressive.

Code is the worst place to start UI/UX work.

When you ask a model for a component in one prompt, it has to invent the user's goal, information architecture, visual hierarchy, and failure states at the same time. You get four hundred lines of polished markup where the user still has no idea where to click.

UI/UX takes repeated refinement. Each pass constrains the next one. The more I understand the problem and the people using the product, the more intention I can put into the interface.

The order that works for me is: Outcome, Image, ASCII, Contracts, Component, Verification.

## 1. Outcome

A feature list tells you what software can do. It rarely tells you why anyone opens the screen.

In [About Face](https://www.wiley.com/en-us/About%2BFace%3A%2BThe%2BEssentials%2Bof%2BInteraction%2BDesign%2C%2B4th%2BEdition-p-9781118766576), Alan Cooper puts user goals ahead of screen layout. "Build a health dashboard" or "add a command palette" is a proposed solution. "Find my latest blood test before my appointment" or "jump to an active task without leaving the keyboard" is an outcome you can design and test.

Before opening an AI chat, I write down three things:

1. **Why (Goal)**: Know how this result differs from the previous one, or switch tasks mid-incident without losing context.
2. **What (Task)**: Find two comparable records and inspect the difference, or filter workspaces and trigger an action from the keyboard.
3. **How (Feature)**: A measurement history with dates, units, and sources, or a keyboard-driven command dialog.

Notice what this leaves out: activity feeds, readiness scores, carousels, and "Insights" tabs. Design the smallest coherent experience that completes the task.

Ground the task in a real situation instead of an invented persona biography. Someone is sitting in a waiting room, holding a phone in one hand, looking for a PDF from last spring. That context sets the priorities.

> **Rule:** Complete the sentence: *"A person opens this screen because they need to…"* If the answer names your feature instead of their outcome, rewrite it.

When I do not know how people currently solve the problem, I follow Erika Hall's advice in [Just Enough Research](https://www.mulebooks.com/just-enough-research) and ask about past behavior instead of future hypotheticals:

| Leading question | Behavior-focused question |
| :--- | :--- |
| "Would you use an app that organizes all your records?" | "Tell me about the last time you needed an old test result. What did you do?" |

Keep observations separate from interpretations. "The participant searched by hospital name" is evidence. "Everyone needs hospital-first navigation" is a guess that still needs testing.

## 2. Image

I start in ChatGPT, but I ask for images before code. I don’t use Figma because I don’t know how :(.

I describe the product philosophy and hierarchy instead of aesthetic buzzwords:

> Create a brutally minimal UI for a desktop application. Reduce, simplify, and subtract what is not needed. Every control must help someone complete work. Use a text-first layout, clean typography, quiet charcoal and off-white surfaces, and no decorative chrome.

The image sets a visual direction. Specifications come later.

<figure>
  <img src="/img/ui-with-ai-command-palette-concept.png" alt="A minimal work tracker with a command palette centered over a quiet task list">
  <figcaption>The generated concept. Useful for direction, unreliable for implementation detail.</figcaption>
</figure>

When evaluating a generated concept, I check three things from [Refactoring UI](https://refactoringui.com/), Ellen Lupton's [Thinking with Type](https://www.chroniclebooks.com/products/thinking-with-type-1), and [Designing Interfaces](https://www.oreilly.com/library/view/designing-interfaces-3rd/9781492051954/):

- **Give attention a direction.** When every element shouts, the user has to invent a reading order. Size, weight, contrast, and spacing establish relationships without wrapping every item in a border. On a data card, establish context with a specific label (`Total cholesterol`), lead with the primary value (`196 mg/dL`), keep supporting context nearby (`Measured 12 October 2026`), and name the next action (`View measurement history`). Look at the screen from a distance and check whether the dominant element is what the task actually requires.
- **Let typography do the structural work.** Define roles before picking pixel sizes: view title, section heading, primary value, body copy, and supporting metadata. One body style, two heading levels, and a tight spacing scale handle most interfaces. If you temporarily strip all icons and borders, the text alone should still communicate grouping and order.
- **Separate visual minimalism from cognitive minimalism.** Visual minimalism reduces what is on screen. Cognitive minimalism reduces what the user has to figure out. Shorter labels can be harder to decipher, and cleaner screens can hide essential context.

> **The stopping rule:** Keep simplifying until the next removal would make the task harder to understand, complete, or trust. Never hide units, dates, sharing recipients, or destructive consequences just to make a layout look calm.

An image gives you contrast and visual density. It cannot define behavior: how the dialog handles wrapped text, narrow viewports, or the Escape key.

## 3. ASCII

I open `layouts.md` and redraw the structure in a monospace grid:

```text
+-----------------------------------------------------------------+
|  Search projects, tasks, docs…                             Esc   |
+-----------------------------------------------------------------+
|  WORK & PROJECTS                                                |
|  > Cluster ingress migration        Core Platform               |
|    Core Platform                    Project                     |
|                                                                 |
|  ACTIONS                                                        |
|    Create new task                 C                            |
|    Workspace settings              Settings > Workspace         |
+-----------------------------------------------------------------+
|  ↑↓ Navigate        Enter Open        Esc Close                  |
+-----------------------------------------------------------------+
```

The monospace grid forces structural decisions:
- Search gets one dedicated row.
- Results keep primary and secondary labels.
- Work and actions stay in separate groups.
- The footer owns keyboard hints.

The model now receives geometric boundaries instead of visual guesses.

Drawing in plain text also forces you to solve information architecture ([How to Make Sense of Any Mess](https://abbycovert.com/make-sense/)) and usability ([Don't Make Me Think](https://sensible.com/dont-make-me-think/)) before styling anything:

- **Match how people remember.** A database organizes records around internal IDs and source integrations. A person remembers "the test from last spring" or "the ingress task in Core Platform." Give items a predictable home, then offer secondary retrieval routes like search by name or filters by date and source. Filters change the view without changing the identity of the underlying record.
- **Use words that predict the destination.** Steve Krug notes that people scan pages and pick the first adequate-looking option. Vague buckets like *Explore*, *My space*, and *Insights* force users to guess. Specific labels like *Blood tests*, *Prescriptions*, and *Workspace settings* tell them what happens next.

| Vague label | Specific label |
| :--- | :--- |
| Continue | Review record details |
| Submit | Save this record |
| Something went wrong | We couldn't save the record. Your entries are still here. Try again. |

Three real-world examples show how much structure and mental maps matter:

- **[Things 3](https://culturedcode.com/things/support/articles/4001304/) (Borrow this):** The *Today* view answers an immediate, time-based question without exposing the entire project tree. Calendar events sit at the top, evening tasks separate into *This Evening*, and project names stay muted so they never compete with task titles.
- **[Discord's 2023 mobile redesign](https://discord.com/blog/refining-discords-mobile-experience-with-your-feedback) (Avoid this):** Discord split Servers and Direct Messages into separate mobile tabs. The split looked tidy on a slide, but it broke the mental map users carried over from desktop. In May 2024, Discord reunited both destinations under *Home*.
- **[Sonos's 2024 app rollout](https://en.community.sonos.com/product-updates/update-on-the-new-sonos-app-and-future-features-october-28-2024-6920397) (Avoid this):** Sonos replaced its tab navigation with a unified home screen while breaking core workflows like finding speakers, editing playlists, and reliable playback. Existing user tasks are acceptance criteria for any redesign.

## 4. Contracts

Before touching component code, I lock three small contracts.

The first is the layout contract (`LAYOUT_CONTRACT.md`). It freezes the accepted geometry so future prompts do not renegotiate settled decisions:

```markdown
# Command dialog layout contract

Status: accepted
Changes require explicit approval.

- Dialog width: 650px maximum with 24px viewport margins
- Search occupies the first row
- Results keep primary and secondary labels
- Work and actions remain separate groups
- Keyboard help stays in the footer
- Trailing metadata hides below 600px
- Interactive controls keep a 44px minimum target
```

If the layout must change, the agent proposes the contract change before editing code.

The second is the design contract (`DESIGN.md`). It records the behavioral and visual rules that survive individual prompts, drawing on Don Norman's [The Design of Everyday Things](https://jnd.org/books/the-design-of-everyday-things-revised-and-expanded-edition/) and Cole Nussbaumer Knaflic's [Storytelling with Data](https://www.storytellingwithdata.com/books):

```markdown
# Product design system

- Quiet and text-first
- One primary action per view
- White, gray, and charcoal surfaces
- Semantic color only for warnings and destructive actions
- Inline editing before modal forms
- Explicit signifiers: controls look interactive and labels name their destination
- Honest feedback: distinguish pending ("Saving…") from complete ("Saved")
- Progressive disclosure: keep primary values, units, and dates visible; tuck provenance behind <details>
- Direct data labels: state the question above charts, keep scales and units visible, and skip decorative fills
- Remove any control that has no current job
```

This stops the model from adding speculative buttons, dishonest status toasts ("Synced" when data only lives in local memory), or decorative chart clutter.

It also enforces proportionate friction. Routine actions should be immediate and easy to undo, while consequential actions deserve a clear review:

- **[Gmail's Undo Send](https://support.google.com/mail/answer/9259768) (Borrow this):** Instead of popping up a confirmation dialog before every email, Gmail places an *Undo* action right beside the "Message sent" notice for up to 30 seconds. The recovery path sits right where the user notices the mistake.
- **[Amazon Prime's historical cancellation flow](https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-secures-historic-25-billion-settlement-against-amazon) (Avoid this):** As documented in the FTC's 2023 complaint, canceling required navigating four screens of benefit reminders and alternative pricing, with intermediate buttons labeled *Remind Me Later*, *Continue to Cancel*, and *Keep My Benefits*. Extra steps are valid when they protect a user's decision, never when they obstruct it.

The third is the state contract. AI models only build the happy path unless told otherwise. I write the awkward moments into a state table before generating code:

| State | Required behavior |
| :--- | :--- |
| **Empty** | Explain what belongs here and offer a starting action (`No matching work` or `Add your first record`). |
| **Pending** | Show that work is in flight (`Saving…`) and disable duplicate submissions. |
| **Failed** | Preserve everything the user typed, explain what failed, and make retry immediate. |
| **Duplicate** | Show the existing item and let the user choose how to proceed. |
| **Deleted** | Keep terminology consistent (`Remove from view` vs `Delete permanently`) and offer Undo where possible. |

## 5. Component

I build the component outside the application tree with mock data:

```text
design-system/
├── DESIGN.md
├── layouts.md
├── LAYOUT_CONTRACT.md
├── command-dialog.html
└── command-dialog.tsx
```

The HTML file is the visual harness. The TypeScript component is the implementation. Neither file depends on application routing, global state, or backend endpoints.

In this narrow sandbox, I verify the interaction and accessibility details ([A Web for Everyone](https://rosenfeldmedia.com/books/a-web-for-everyone/), [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/), and Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)):

- **Keyboard and focus:** Arrow keys move selection, `Enter` opens, `Escape` clears or closes, and `:focus-visible` outlines stay clear without trapping focus.
- **Contrast and meaning:** Ordinary text keeps at least a 4.5:1 contrast ratio. Status never relies on color alone.
- **Resizing and long strings:** Enlarging text or rendering long titles and translated labels grows the container cleanly without clipping dates, units, or actions.
- **Screen-reader announcements:** Dynamic updates (such as filtered result counts or save confirmations) use `aria-live="polite"`.
- **Forgiving pointer movement:** People move cursors diagonally. As [Linear documented for its contextual menus](https://linear.app/now/invisible-details), adding an invisible triangular safe zone between a menu item and its open submenu keeps a diagonal pointer path from accidentally closing the menu. Test the space between controls alongside the controls themselves.

Only when the component handles all of these in isolation do I move it into the application.

## Live comparison

Here are all stages together. The component tab is interactive: search the list or use the arrow keys.

<figure style="margin-inline: calc(50% - 50vw); padding-inline: 20px;">
  <iframe src="/demos/ui-with-ai/" title="Live comparison of a generated UI image, its ASCII wireframe, and the final command palette component" loading="lazy" style="display:block; width:min(1080px, 100%); height:720px; margin:auto; border:1px solid currentColor; border-radius:8px;"></iframe>
  <figcaption><a href="/demos/ui-with-ai/">Open the live example in a new page</a></figcaption>
</figure>

## 6. Verification

Opinions about a mockup do not prove a task works. Watch someone attempt a realistic task without telling them which tab or button to choose. Record where they hesitate or go off course, separate observed difficulty from aesthetic preference, fix the root cause, and test again.

Before shipping a screen, I run through twenty checks:

1. **Purpose:** The screen's job is obvious without an explanation.
2. **Outcome:** It supports an outcome a real person cares about.
3. **Language:** Labels use words the audience already understands.
4. **Scanning:** Headings reveal the structure at a glance.
5. **Orientation:** People can tell where they are and how to return.
6. **Discoverability:** Important actions are visible and recognizable.
7. **Prediction:** Action labels make the next step clear.
8. **Hierarchy:** Primary information does not compete with secondary metadata.
9. **Typography:** Type stays readable as content and screen size change.
10. **Context:** Dates, units, and sources stay attached to important numbers.
11. **Feedback:** The interface distinguishes pending, complete, and failed actions.
12. **Recovery:** Errors preserve user input and offer a next step.
13. **Control:** Consequential actions are deliberate and reversible where possible.
14. **Consistency:** Similar controls behave the same way everywhere.
15. **Keyboard:** Every essential action works without a pointer.
16. **Access:** Labels, contrast, focus rings, and text resizing have been verified.
17. **Honesty:** Uncertainty, missing data, and storage limits are stated plainly.
18. **Privacy:** Sensitive sharing clearly names both the content and the recipient.
19. **Observation:** Real people have attempted realistic tasks on the interface.
20. **Iteration:** The most consequential blockers have been repaired and retested.

## Books behind these rules

1. [Don't Make Me Think, Revisited](https://sensible.com/dont-make-me-think/) by Steve Krug. Usability, scanning, navigation, and practical testing.
2. [The Design of Everyday Things](https://jnd.org/books/the-design-of-everyday-things-revised-and-expanded-edition/) by Don Norman. Conceptual models, signifiers, mapping, feedback, and error prevention.
3. [Refactoring UI](https://refactoringui.com/) by Adam Wathan and Steve Schoger. Visual hierarchy, spacing, type, and interface refinement.
4. [Thinking with Type](https://www.chroniclebooks.com/products/thinking-with-type-1) by Ellen Lupton. Typography as a system for organizing information.
5. [Just Enough Research](https://www.mulebooks.com/just-enough-research) by Erika Hall. Gathering evidence to make better product decisions.
6. [Designing Interfaces](https://www.oreilly.com/library/view/designing-interfaces-3rd/9781492051954/) by Jenifer Tidwell, Charles Brewer, and Aynne Valencia. Reusable interaction patterns and progressive disclosure.
7. [About Face: The Essentials of Interaction Design](https://www.wiley.com/en-us/About%2BFace%3A%2BThe%2BEssentials%2Bof%2BInteraction%2BDesign%2C%2B4th%2BEdition-p-9781118766576) by Alan Cooper, Robert Reimann, David Cronin, and Christopher Noessel. Goal-directed design.
8. [How to Make Sense of Any Mess](https://abbycovert.com/make-sense/) by Abby Covert. Language, structure, and information architecture.
9. [A Web for Everyone](https://rosenfeldmedia.com/books/a-web-for-everyone/) by Sarah Horton and Whitney Quesenbery. Accessible user experiences grounded in human differences.
10. [Storytelling with Data](https://www.storytellingwithdata.com/books) by Cole Nussbaumer Knaflic. Clear visual comparisons and purposeful emphasis.
