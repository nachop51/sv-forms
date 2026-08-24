# sv-forms

Thin Svelte components over SvelteKit's remote form functions. `<Form>`, `<Input>` and `<Select>`
wire themselves to a form's fields, issues and result, so you write `<Input name="title" />` instead
of `<input {...myForm.fields.title.as('text')} />` and get success/failure callbacks instead of a
500 page.

```svelte
<script lang="ts">
	import { Form, Input } from 'sv-forms'
	import { createPost } from './data.remote.ts'
</script>

<Form action={createPost} resetForm onsuccess={(post) => console.log(post)}>
	<Input name="title" type="text" />
	<button type="submit">Publish</button>
</Form>
```

## Status

> [!WARNING]
> This library sits on top of SvelteKit's remote functions, which SvelteKit itself documents as
> **"currently experimental, meaning it is likely to contain bugs and is subject to change without
> notice."**
>
> sv-forms cannot be more stable than the feature it wraps. Treat the whole stack as pre-1.0.

### What that means in practice

**Breaking changes arrive in Kit minors, not majors.** Because the feature is experimental, it is
exempt from semver. Kit 2.61.0 — a _minor_ release — reshaped the `enhance` callback from
`{ form, data, submit }` to a single form instance, and made accessing the old properties throw.
That is the entire reason sv-forms `0.1.0` is a breaking release. Expect it to happen again.

**Pin your Kit version.** A caret range like `^2.70.0` will happily pull the minor that breaks you.
Pin exactly — no caret — or at least review Kit's changelog before bumping:

```json
{
	"devDependencies": {
		"@sveltejs/kit": "2.70.3"
	}
}
```

**The peer range is capped at `>=2.61.0 <3`.** This is deliberate. When Kit 3 lands, npm will refuse
to resolve rather than let you install a combination that half-works — which is the failure mode you
want, because Kit 3 is already known to relocate the opt-in flags (see [Setup](#setup)) and may
change the form API again. A release of sv-forms will widen the range once it has been tested
against Kit 3.

**The opt-in flags are yours to set, and they move.** sv-forms cannot enable remote functions for
you, and their config location is not stable across Kit majors. See [Setup](#setup).

**What this does not mean.** The components themselves are covered by a Playwright suite that drives
them against a real SvelteKit server — every field type, both enhance paths, validation, reset and
standalone rendering. The risk here is the ground shifting underneath, not the wiring on top of it.

## Installation

```sh
npm install sv-forms
# or: bun add sv-forms / pnpm add sv-forms
```

Requires `svelte@^5` and `@sveltejs/kit@>=2.61.0 <3` as peers.

## Setup

Remote functions are opt-in. If you have not enabled them already, both of these flags are
required in your **`svelte.config.js`** — the library cannot turn them on for you:

```js
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		experimental: {
			remoteFunctions: true,
		},
	},
	compilerOptions: {
		experimental: {
			async: true,
		},
	},
}

export default config
```

> [!NOTE]
> SvelteKit 3 is expected to move this opt-in into `vite.config.js`, under the `sveltekit()`
> plugin. Check the [remote functions docs](https://svelte.dev/docs/kit/remote-functions) for the
> location that matches your version.

## Quick start

Define a remote form as usual:

```ts
// src/routes/data.remote.ts
import * as v from 'valibot'
import { form } from '$app/server'

export const createPost = form(
	v.object({ title: v.pipe(v.string(), v.minLength(3, 'too short')) }),
	async ({ title }) => ({ id: crypto.randomUUID(), title })
)
```

Then render it:

```svelte
<script lang="ts">
	import { Form, Input } from 'sv-forms'
	import { createPost } from './data.remote.ts'

	let error = $state<string | null>(null)
</script>

<Form
	action={createPost}
	resetForm
	onsuccess={(post) => {
		error = null
		console.log('created', post.id)
	}}
	onfailure={(issues) => {
		error = Array.isArray(issues) ? issues.map((i) => i.message).join(', ') : String(issues)
	}}
>
	<Input name="title" type="text" />
	<button type="submit">Publish</button>
</Form>

{#if error}<p>{error}</p>{/if}
```

`<Input>` finds the form through context, so it works at any depth — including inside your own
wrapper components.

## `<Form>`

Accepts every `<form>` attribute, plus:

| Prop                   | Type                      | Notes                                                                                              |
| ---------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `action`               | remote form               | **Required.** Also accepts `action.for(id)` and `action.preflight(schema)`.                        |
| `children`             | `Snippet<[action]>`       | Receives the form instance — see [below](#reading-form-state-in-children).                         |
| `ref`                  | `HTMLFormElement \| null` | `bind:`-able.                                                                                      |
| `onsuccess`            | `(result) => void`        | Called with `action.result` after a valid submission.                                              |
| `onfailure`            | `(error) => void`         | Called with `fields.allIssues()` on invalid data, or the thrown error if the action itself failed. |
| `resetForm`            | `boolean`                 | Reset the form after a successful submission. Off by default.                                      |
| `enhance`              | `(form) => void`          | Your own enhance callback. Replaces the default one.                                               |
| `removeDefaultEnhance` | `true`                    | Spread the bare action, with no enhance at all.                                                    |

Those last three groups are **mutually exclusive**, enforced by the types:

- **default** — use `onsuccess` / `onfailure` / `resetForm`.
- **custom** — pass `enhance` and handle everything yourself.
- **none** — pass `removeDefaultEnhance` for the plain progressive-enhancement behaviour.

### Why `onfailure` exists

By default SvelteKit renders the nearest `+error.svelte` if the action throws. The built-in enhance
catches it and routes it to `onfailure` instead, so the form stays on screen and the user keeps
what they typed.

### Reading form state in `children`

The children snippet is handed the same instance you passed as `action`, which saves importing the
remote function again in nested markup:

```svelte
<Form action={createPost} onsuccess={() => {}}>
	{#snippet children(form)}
		<Input name="title" type="text" />
		<button type="submit" disabled={!!form.pending}>
			{form.pending ? 'Publishing…' : 'Publish'}
		</button>
	{/snippet}
</Form>
```

`form.pending`, `form.fields`, `form.result` and `form.validate()` are all available. For a
component too deep to receive the snippet argument, use [`getFormContext()`](#getformcontext).

## `<Input>`

Accepts every `<input>` attribute, plus:

| Prop           | Type                       | Notes                                                                                             |
| -------------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| `name`         | `string`                   | **Required.** The field name in your schema. Supports nesting: `author.name`.                     |
| `type`         | input type                 | Defaults to `'text'`. Anything `field.as()` accepts.                                              |
| `defaultValue` | value                      | The value the field starts with **and reverts to on reset**.                                      |
| `value`        | value                      | `bind:`-able current value. Also the option value for `radio`, `checkbox`, `submit` and `hidden`. |
| `checked`      | `boolean`                  | `bind:`-able, for checkboxes.                                                                     |
| `files`        | `FileList \| null`         | `bind:`-able, for `type="file"`.                                                                  |
| `ref`          | `HTMLInputElement \| null` | `bind:`-able.                                                                                     |
| `standalone`   | `boolean`                  | See [outside a `<Form>`](#using-the-components-outside-a-form).                                   |

### `defaultValue` vs `value`

Use `defaultValue` for data you load, and `value` for data the user types:

```svelte
<!-- loaded after mount: stays reactive, and a reset returns here -->
<Input name="title" defaultValue={post?.title} />

<!-- the live value, two-way bound -->
<Input name="title" bind:value={title} />
```

They are different things. `defaultValue` maps to the second argument of `field.as(type, value)`,
which SvelteKit uses both to populate the element and as its reset value. `value` tracks what is in
the box right now, so if it were also the default, a reset would restore the user's own typing.

For `radio`, `checkbox`, `submit` and `hidden`, `value` _is_ the option value — that is what
SvelteKit expects for those types:

```svelte
{#each plans as plan}
	<label><Input name="plan" type="radio" value={plan} /> {plan}</label>
{/each}
```

### Files

Add `enctype="multipart/form-data"` to the `<Form>`:

```svelte
<Form action={upload} enctype="multipart/form-data" onsuccess={(r) => console.log(r.name)}>
	<Input name="doc" type="file" bind:files />
	<button type="submit">Upload</button>
</Form>
```

## `<Select>`

Accepts every `<select>` attribute, plus:

| Prop           | Type                            | Notes                                                           |
| -------------- | ------------------------------- | --------------------------------------------------------------- |
| `name`         | `string`                        | **Required.**                                                   |
| `type`         | `'select' \| 'select multiple'` | Defaults to `'select'`.                                         |
| `defaultValue` | value                           | The selection the field falls back to, including after a reset. |
| `value`        | value                           | `bind:`-able current selection — a `string[]` when multiple.    |
| `ref`          | `HTMLSelectElement \| null`     | `bind:`-able.                                                   |
| `standalone`   | `boolean`                       | See [outside a `<Form>`](#using-the-components-outside-a-form). |

```svelte
<Select name="os" defaultValue="linux">
	{#each operatingSystems as os}
		<option>{os}</option>
	{/each}
</Select>

<Select name="langs" type="select multiple">
	{#each languages as language}
		<option>{language}</option>
	{/each}
</Select>
```

> [!NOTE]
> A multi-select field should be optional in your schema with a default — `v.optional(v.array(...),
[])` — because an empty selection is omitted from the submitted `FormData` entirely.

> [!IMPORTANT]
> Inside a `<Form>`, `bind:value` on a `<Select>` **reports** the selection but does not **drive**
> it: the field owns the value. To set it programmatically use
> `action.fields.<name>.set(value)`. An `<Input>` is bound in both directions as normal.

## Helpers

### `getFormContext()`

Returns the enclosing form instance, or `undefined` if there is no `<Form>` ancestor. Use it to
build components that read form state from any depth.

Like `getContext`, **it must be called during component initialisation.** Hold the result; the
remote form's own properties are reactive, so reading them later stays up to date.

```svelte
<script lang="ts">
	import { getFormContext } from 'sv-forms'

	const form = getFormContext()
</script>

<button type="submit" disabled={!!form?.pending}>Save</button>
```

### `getInputErrors(name)`

Returns a **getter** for one field's validation issues, for building your own field wrapper:

```svelte
<script lang="ts">
	import { Input, getInputErrors } from 'sv-forms'

	let { name, label } = $props()

	// called at init; the getter is what re-reads as the field is validated
	const errors = getInputErrors(name)
</script>

<label>
	{label}
	<Input {name} />
</label>

{#if errors()}
	<p class="error">
		{errors()!
			.map((e) => e.message)
			.join(', ')}
	</p>
{/if}
```

It returns a getter rather than the issues directly so that the context read happens at init (where
Svelte requires it) while the reactive `issues()` read happens wherever you call it.

## Using the components outside a `<Form>`

Both components work with no form context — they degrade to plain `<input>` / `<select>` elements
with your props forwarded, bindings intact, and no field wiring. That is supported, but it is also
what an accidentally-orphaned field looks like, so **in dev they log a warning**. Pass `standalone`
to say you meant it:

```svelte
<Input standalone name="search" type="search" bind:value={query} />
```

The warning is stripped from production builds. Note that without a field there is no validation,
no `aria-invalid`, and no `n:`/`b:` name coercion — plain string values only.

## Migrating to 0.1.0

**Requires `@sveltejs/kit` 2.61.0 or newer.** SvelteKit changed the shape of a remote form's
`enhance` callback in 2.61.0: it now receives the form instance as a single argument instead of
`{ form, data, submit }`, and `submit()` resolves to a boolean saying whether the submission was
valid. Accessing the old `form` or `data` properties throws. Anything below 2.61.0 needs sv-forms
0.0.10.

### Update any custom `enhance`

If you only use `onsuccess` / `onfailure` / `resetForm`, there is nothing to do — the built-in
enhance was updated for you. If you pass your own `enhance`, rewrite it to the new signature:

```svelte
<!-- before -->
<Form
	{action}
	enhance={async ({ form, submit }) => {
		await submit()
		form.reset()
	}}
/>

<!-- after -->
<Form
	{action}
	enhance={async (form) => {
		if (await form.submit()) form.element.reset()
	}}
/>
```

The argument is the form instance, so `form.element` is the `<form>` element, and `form.fields`,
`form.result` and `form.pending` are available on it too.

### `getInputErrors` now returns a getter

Call it once at init and call the result where you need the issues:

```svelte
<!-- before -->
let errors = $derived(getInputErrors(name))
{#if errors}<p>{errors.map((e) => e.message).join(', ')}</p>{/if}

<!-- after -->
const errors = getInputErrors(name)
{#if errors()}<p>{errors()!.map((e) => e.message).join(', ')}</p>{/if}
```

The old shape only worked reactively when called inside a `$derived`, which meant reading context
outside component initialisation — something Svelte does not guarantee and which throws outright in
some call sites.

### `resetForm` actually resets now

`resetForm` was silently a no-op before, because the field's default value tracked whatever the
user had typed — so resetting restored their own input. Forms that appeared to keep their values
after a successful submit will now clear them.

### Prefer `defaultValue` over `value` for prefilled fields

`<Input>` and `<Select>` take a `defaultValue` prop for the value a field starts with and reverts
to on reset. Use it instead of `value` when the data is loaded rather than typed, since it stays
reactive if the value arrives after the component mounts. See
[`defaultValue` vs `value`](#defaultvalue-vs-value).

### Fixed in this release

- `<Input>` no longer drops its `type` when used without a `<Form>`. It previously relied on the
  form field to supply the attribute, so with no form context a `password`, `number` or `email`
  input silently rendered as plain text.
- `<Form>` no longer spreads its own props onto the `<form>` element. `resetForm` and
  `removeDefaultEnhance` were rendering as bogus HTML attributes, and `onsuccess` / `onfailure`
  were registering listeners for events that do not exist.
- `<Select defaultValue>` is now applied when there is no `<Form>` ancestor, and survives a native
  reset. It was previously discarded, falling back to the browser's first option.
- `<Select>` no longer loses its selection. A single `<select>` was cleared on any re-render — most
  visibly after a failed submit, which made the _next_ submit fail on a field nobody had touched.
- `action.for(id)` instances are now accepted by `<Form>`. They previously failed to typecheck,
  which ruled out the standard pattern for a form repeated in a list.
- `<Select type>` is optional, matching its `'select'` default. It was required despite having one.
- The form context key is registered via `Symbol.for`, so two copies of sv-forms in one dependency
  tree still find each other instead of silently failing to connect.

## Contributing

```sh
bun install
bun run dev        # showcase app on :5173
bun run check      # svelte-check
bun run lint       # prettier + eslint
bun run test       # unit + e2e
```

`bun run test:e2e` drives the components against a real SvelteKit build — remote forms need a
server, so there is little worth unit testing in isolation. The routes under `src/routes/tests` are
the fixtures, and `src/demo` holds the showcase-only components.

## License

[MIT](./LICENSE)
