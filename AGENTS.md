# AGENTS.md

Working notes for agents. Consumer-facing API docs live in [README.md](./README.md) — don't
duplicate them here. This file is for what the code does _not_ tell you on its own.

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: prettier, eslint, vitest, playwright, devtools-json, mcp

## What this is

A thin wrapper over SvelteKit's **remote form functions**. Three components — `<Form>`, `<Input>`,
`<Select>` — plus two helpers. `<Form>` puts the remote form instance into Svelte context; the
fields read it back out and call `field.as(type, defaultValue)` to get their attributes. That's the
whole design. There is no state management, no validation, no schema handling of our own: SvelteKit
owns all of it.

If a bug looks like "the field isn't wired up", the answer is almost always about **context** or
about **prop spread ordering**, not about logic.

## Layout

| Path                             | Published? | What                                                                                                                               |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/`                       | **yes**    | The library. Everything here ships to npm.                                                                                         |
| `src/lib/components/form.svelte` | yes        | `<Form>` + the shared module: `getFormContext`, `getInputErrors`, `warnMissingForm`, and all the exported types.                   |
| `src/lib/consts.ts`              | yes        | The context key.                                                                                                                   |
| `src/routes/`                    | no         | Showcase app. `/` is the demo.                                                                                                     |
| `src/routes/tests/`              | no         | **e2e fixtures.** One route per concern, driven by the matching `e2e/*.e2e.ts`.                                                    |
| `src/demo/`                      | no         | Showcase-only components (`example-input.svelte`, the scaffold vitest examples). Deliberately outside `src/lib` so it cannot ship. |
| `e2e/`                           | no         | The real test suite.                                                                                                               |

Nothing in `src/lib` may import from `src/demo` or `src/routes`.

## Testing

**e2e is the real suite. Write your test there.**

Remote forms need a server, so there is nothing meaningful to unit test in isolation — the two
vitest tests under `src/demo/vitest-examples` are untouched scaffold placeholders, not a pattern to
follow. `bun run test:e2e` builds the app and serves it with `vite preview`, so tests run against a
**production** build.

That has one consequence worth knowing: `DEV`-guarded code (the missing-form warning) is compiled
out, so e2e cannot observe it. To check dev-only behaviour, run `bun run dev` and drive it with a
throwaway Playwright script.

To add coverage: add markup to the relevant `src/routes/tests/<name>/+page.svelte`, then assert in
`e2e/<name>.e2e.ts`. Use `data-testid`.

## Invariants — break these and the tests will tell you, loudly

Each of these encodes a bug that already happened. The comments in the source say the same thing at
the call site; this is the index.

1. **`defaultValue` must never follow the bound `value`.** The second argument to `as()` is both the
   initial value _and_ the reset value. If it tracks `value`, `bind:value` overwrites it as the user
   types, and a reset restores their own input instead of the default.
2. **`<Input>`'s `type` is applied _before_ the field spread.** `as()` omits `type` for text inputs
   and sets an identical one otherwise, so the field still wins where it has an opinion — but with
   no form context the spread is `{}`, and without our own `{type}` the attribute vanishes entirely,
   silently rendering `password` as plain text.
3. **A `<select>` inside a form gets its value as an attribute, never `bind:value`.** Binding
   re-runs on every render and clears the selection whenever the bound value is `undefined`. Also:
   drop `value` from the field props when it's nullish, or an untouched select gets wiped and the
   next submit sends nothing for a field nobody edited.
4. **`<Form>` must not spread its own props onto `<form>`.** `onsuccess`, `onfailure`, `enhance`,
   `removeDefaultEnhance` and `resetForm` are all destructured out. Leave one in and it renders as a
   bogus attribute or registers a listener for an event that doesn't exist.
5. **Context is read at init, only.** Svelte's `getContext` throws `lifecycle_outside_component`
   when `component_context` is null. This is why `getInputErrors(name)` returns a _getter_: the
   context read happens at init, the reactive `issues()` read happens at call time. Never move a
   `getFormContext()` call inside a `$derived` or an effect.
6. **The context key is `Symbol.for`,** so two copies of sv-forms in one tree still find each other.
7. **Missing context is not an error.** Standalone rendering is supported and tested. It warns in
   dev unless the caller passes `standalone`. Don't turn it into a throw.

## Svelte 5 traps hit while working in this repo

- **A `</script>` inside a JSDoc comment in `<script module>` terminates the block.** Svelte's
  parser matches it literally, and the error you get is a confusing `Unterminated comment` pointing
  somewhere else entirely, followed by a cascade of "not exported" failures across every importer.
  Don't put Svelte markup examples containing script tags in module-script doc comments.
- **`HTMLFormAttributes` already declares `children: Snippet`.** Redeclaring it as `Snippet<[T]>`
  _intersects_ rather than replaces, giving `Snippet<[]> & Snippet<[T]>` which nothing satisfies.
  `Omit` it, as `BaseFormProps` does.
- **Intentional init-time prop reads warn** (`state_referenced_locally`). Silence with
  `// svelte-ignore state_referenced_locally` on the line above — the repo has three, all deliberate.
- **`RemoteFormField.as()` returns no event handlers**, just `name` / `type` / `aria-invalid` and a
  `value` getter+setter pair. So a consumer's `oninput` does _not_ clobber field tracking. Worth
  knowing before "fixing" a merge that isn't needed.
- Use the **`svelte-autofixer` MCP tool** on Svelte code before considering it done.

## Constraints you don't control

Remote functions are **experimental**: exempt from semver, and they have already broken us once
(Kit 2.61.0 reshaped the `enhance` callback). The peer range is capped `>=2.61.0 <3` on purpose.
Consumers must set both `kit.experimental.remoteFunctions` and `compilerOptions.experimental.async`
themselves — see the README's Status and Setup sections before changing anything version-related.

`eslint.config.js` disables `no-explicit-any` for `form.svelte` only: `RemoteForm` is invariant in
`Input`'s `fields`, so `RemoteForm<any, any>` is the only workable generic bound for a wrapper.

## Commands

```sh
bun run check      # svelte-check — must be 0 errors AND 0 warnings
bun run lint       # prettier --check + eslint
bun run format     # prettier --write
bun run test       # unit + e2e
bun run test:e2e   # the suite that matters
bun run dev        # showcase app, for dev-only behaviour
bun run prepack    # svelte-package + publint
bun run pub        # prepack, then publish
```

Gate before calling work done: `check` (0/0), `lint`, `test`, `prepack`.

> [!NOTE]
> Publish via **`bun run pub`**, not bare `bun publish`. `bun publish` runs lifecycle scripts through
> `/bin/bash` without `node_modules/.bin` on `PATH`, so the `prepack` script dies with
> `svelte-kit: command not found`. The `pub` script runs `prepack` under `bun run` first, then
> publishes with `--ignore-scripts`.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
