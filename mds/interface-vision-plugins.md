# IAChat UI vision — professional shell, recognizable patterns, plugin-ready

This document captures **UX observations** from common AI product patterns (ChatGPT, Grok, DeepSeek, Z.ai, Perplexity-like layouts), **what to keep or drop** in our stack, and **how the interface should evolve** to support a **generic, open-source shell** with **pluggable capabilities** (LLM backends, tools, future agents).

---

## 1. Observations from reference interfaces (patterns, not feature copy)

| Pattern | What users recognize | Why it matters |
|--------|----------------------|----------------|
| **Left rail** | Navigation + history + account | Mental model: “Slack / ChatGPT / mail clients” — one place for “where am I” and “what exists”. |
| **Primary CTA in sidebar** | “New chat / New thread” as the most visible button | Reduces hesitation: the main action is always one click away. |
| **Project / folder metaphor** | Grouping threads under a workspace | Matches “Notion / Drive / ChatGPT Projects” — scalable for teams and plugins later. |
| **Main canvas hierarchy** | Empty state: **brand or greeting + large input** | The product *looks finished* because the **next action is obvious** (type and send). |
| **Composer as a “card”** | Rounded container, subtle shadow, tools inside the bar | Reads as the **center of gravity**; optional toggles (modes/plugins) live *inside* or *under* the bar — not scattered. |
| **Top bar (main)** | Model / context / share / light utilities | Secondary to typing; avoids duplicating the sidebar story. |
| **Monochrome + one accent** | White or dark base, single brand color | Reads “pro”; rainbow gradients everywhere reads “demo”. |
| **History list** | Truncated titles, date, scan-friendly density | Trust: “my stuff is here”. |

**Anti-patterns we see in weaker UIs**

- Empty main area with **no composer** → feels like a loading screen or unfinished app.
- **Mixed languages** in UI vs stored titles → feels careless.
- **Orphan actions** (search, edit) with no clear effect → noise.

---

## 2. What we **KEEP** (already aligned with the north star)

- **Project → discussions → messages** domain model (matches ChatGPT “Projects” and your `consignes.md`).
- **Sidebar + main** articulation (industry default).
- **Skins separated from logic** (theme API + CSS tokens) — good for OSS and white-label.
- **i18n (FR / EN / ES)** exposed in UI — many products hide it; useful for OSS adopters.
- **Responsive shell**: drawer sidebar + top bar on small screens — expected behavior.
- **Admin for users** — baseline for any multi-tenant or team use.
- **Modular server routes** — natural extension point for plugin backends.

---

## 3. What we **DROP or tighten** (to look intentional, not “demo”)

| Item | Action |
|------|--------|
| Empty main **without** a composer | **Remove this gap**: show a **disabled or guided composer** (explain “pick a project” if none). |
| Duplicate / placeholder header actions | Hide **Search** until it does something; keep **edit/delete** only when relevant. |
| Visual noise (many font sizes, glow everywhere) | Prefer **one scale**, **one accent**, **consistent radii** (already moving toward “product SaaS”). |
| English leftovers in FR UI | **Pure i18n** for all UI-generated strings; migration story for old DB titles is optional. |

---

## 4. Design principles for a **generic OSS shell**

1. **Familiar first** — Users coming from ChatGPT / Claude / DeepSeek should recognize: sidebar history, main chat, composer at bottom (or center on landing).
2. **Boringly reliable** — Spacing, alignment, empty states, focus rings; “innovation” is in **plugins**, not in mystery navigation.
3. **Extension points visible but calm** — Plugin or model chips **near the composer** (like DeepSeek “modes”), not 20 buttons in the header.
4. **Admin = configuration** — Credentials, URLs, feature flags; **Chat = usage** — pick provider/model/tool, send messages.
5. **Open source friendly** — Clear separation: **core app** (shell + CRUD + auth) vs **plugin packages** (LLM, RAG, tools).

---

## 5. Plugin model (target architecture — aligns with your intent)

This is **not** a promise of current code completeness; it is the **contract** we aim for.

### 5.1 Admin (back office)

- Each plugin registers: **id**, **display name**, **JSON schema for settings** (URL, API key, model list endpoint, etc.).
- Admin UI **renders forms from schema** (or dedicated screens per plugin type for v1).
- Secrets stored **server-side** only; never exposed raw to the client except masked.

### 5.2 Chat (front)

- **Provider / model selector** when the plugin type is “LLM” (or “routing” plugin that lists models).
- Optional **tool / intent plugins**: appear as toggles, slash commands, or automatic triggers based on configuration you described (“intentions” the plugin understands).
- **Message pipeline**: core sends text + attachments to server → server picks plugin → streams back (future: STT/TTS, streaming, as in `consignes.md`).

### 5.3 What “generic” means here

- The **UI shell** does not hardcode OpenAI vs Ollama vs DeepSeek — it renders **slots**: composer, optional chips, optional right panel (future), plugin settings in admin.
- **Innovation** lives in **installable plugins**, not in a one-off custom layout per vendor.

---

## 6. Internal roadmap (suggested order)

| Phase | Focus | Outcome |
|-------|--------|---------|
| **A — Shell quality** | Composer on every meaningful state; polish empty states; one visual hierarchy | Looks “finished” like Grok/DeepSeek landing. |
| **B — Plugin SDK (server)** | Plugin manifest + admin CRUD + encrypted settings | Third parties can add backends without forking UI. |
| **C — Chat integration** | Model selector wired to configured LLM plugins; stream | Core value loop complete. |
| **D — Rich media** | Images/docs as per `consignes.md` | Differentiator; depends on stable message model. |
| **E — Voice** | STT/TTS | Enhancement layer. |

---

## 7. Reciprocal summary — **where we are vs where we’re going**

**You are building:** a **reusable, open-source chat shell** with **projects and discussions**, **multilingual UI**, **theme/skins**, **admin**, and a path to **plugins** (LLM URLs/keys in admin; choices in chat; future intent-based tools).

**The codebase today:** solid **structure** (routes, stores, responsive layout, i18n, skin loading). The main **perceived gap** versus ChatGPT-class products is **UX completeness** (especially **composer visibility** and **density/hierarchy** in the main canvas), not the fundamental idea.

**We do not throw away:** projects/discussions, sidebar pattern, skin system, admin, API shape — we **refine the shell** and **formalize plugin boundaries**.

---

## 8. Memory hook (one paragraph)

> **IAChat** should feel like **a tool people already know how to use**, with a **calm professional shell** and **clear extension points** for plugins. **Innovation = plugins + configuration**, not exotic navigation. **Admin configures; chat consumes.** Everything else (media, voice, vector DB) **stacks on** this contract.

---

*Last updated: 2026-03-28. Adjust as implementation progresses.*
