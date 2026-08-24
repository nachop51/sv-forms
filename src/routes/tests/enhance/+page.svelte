<script lang="ts">
	import { Form, Input } from '$lib/index.js'
	import { boom, echo } from '../tests.remote.ts'

	let log = $state<string[]>([])
	let failure = $state<string | null>(null)

	// hold one reference each: `for(id)` is refcounted, so calling it repeatedly in the template
	// churns instances
	const custom = echo.for('custom')
	const bare = echo.for('bare')
	const snippet = echo.for('snippet')

	function describe(error: unknown) {
		if (Array.isArray(error)) return error.map((issue) => issue.message).join(', ')
		const { body, message } = (error ?? {}) as { body?: { message?: string }; message?: string }
		return body?.message ?? message ?? String(error)
	}
</script>

<h2>custom enhance</h2>

<!-- The custom enhance replaces the default one, so `onsuccess` must not be reachable here. -->
<Form
	action={custom}
	enhance={async (form) => {
		log.push(`element:${form.element.tagName}`)
		log.push(`valid:${await form.submit()}`)
		log.push(`result:${form.result?.note ?? 'none'}`)
		form.element.reset()
	}}
>
	<Input name="note" type="text" data-testid="custom-note" />
	<button type="submit" data-testid="custom-submit">Submit</button>
</Form>

<!-- No enhance at all: the plain action is spread, so `result` updates but no callback runs. -->
<h2>removeDefaultEnhance</h2>

<Form action={bare} removeDefaultEnhance>
	<Input name="note" type="text" data-testid="bare-note" />
	<button type="submit" data-testid="bare-submit">Submit</button>
</Form>

{#if bare.result}
	<p data-testid="bare-result">{bare.result.note}</p>
{/if}

<h2>server error</h2>

<Form
	action={boom}
	onsuccess={() => log.push('onsuccess')}
	onfailure={(e) => (failure = describe(e))}
>
	<Input name="note" type="text" value="anything" data-testid="boom-note" />
	<button type="submit" data-testid="boom-submit">Submit</button>
</Form>

{#if failure}
	<p data-testid="failure">{failure}</p>
{/if}

<!-- The children snippet receives the form instance, so nested markup can read `pending`,
     `fields` and `result` without importing the remote function again. -->
<h2>children snippet</h2>

<Form action={snippet} data-testid="snippet-form" onsuccess={() => {}}>
	{#snippet children(form)}
		<Input name="note" type="text" data-testid="snip-note" />
		<button type="submit" data-testid="snip-submit" disabled={!!form.pending}>Submit</button>
		<span data-testid="snip-value">{form.fields.note.value() ?? 'empty'}</span>
	{/snippet}
</Form>

<ul data-testid="log">
	{#each log as entry, i (i)}
		<li>{entry}</li>
	{/each}
</ul>
