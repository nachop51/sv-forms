<script lang="ts">
	import { Form, Input, Select } from '#lib/index.js'
	import { languages, plans, tags } from '../constants.ts'
	import { submitFields } from '../tests.remote.ts'

	let result = $state<string | null>(null)
	let issues = $state<string | null>(null)

	// stands in for a default that arrives after mount, e.g. an edit form waiting on a query
	let lateText = $state<string | undefined>(undefined)
	setTimeout(() => (lateText = 'from server'), 50)

	// for checking what `bind:value` does inside a form, in both directions
	let boundOs = $state<string | undefined>(undefined)
	let boundText = $state<string | undefined>(undefined)
</script>

<Form
	action={submitFields}
	resetForm
	onsuccess={(data) => {
		issues = null
		result = JSON.stringify(data.received)
	}}
	onfailure={(error) => {
		issues = Array.isArray(error) ? error.map((i) => i.message).join(', ') : String(error)
	}}
>
	<Input
		name="text"
		type="text"
		bind:value={boundText}
		defaultValue={lateText}
		data-testid="text"
	/>
	<Input name="count" type="number" defaultValue={7} data-testid="count" />
	<Input name="subscribe" type="checkbox" data-testid="subscribe" />

	{#each plans as plan (plan)}
		<label>
			<Input name="plan" type="radio" value={plan} data-testid="plan-{plan}" />
			{plan}
		</label>
	{/each}

	<Select name="os" type="select" bind:value={boundOs} data-testid="os">
		{#each languages as language (language)}
			<option>{language}</option>
		{/each}
	</Select>

	<Select name="langs" type="select multiple" data-testid="langs">
		{#each languages as language (language)}
			<option>{language}</option>
		{/each}
	</Select>

	{#each tags as tag (tag)}
		<label>
			<Input name="picked" type="checkbox" value={tag} data-testid="picked-{tag}" />
			{tag}
		</label>
	{/each}

	<button type="submit">Submit</button>
	<button type="reset">Reset</button>
</Form>

<p data-testid="bound-os">{boundOs ?? 'unset'}</p>
<p data-testid="bound-text">{boundText ?? 'unset'}</p>

<button onclick={() => (boundOs = 'js')} data-testid="set-os">set os</button>
<button onclick={() => (boundText = 'set by hand')} data-testid="set-text">set text</button>

{#if result}
	<pre data-testid="result">{result}</pre>
{/if}

{#if issues}
	<p data-testid="issues">{issues}</p>
{/if}
