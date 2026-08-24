<script lang="ts">
	import { Form } from '$lib/index.js'
	import ExampleInput from '../demo/example-input.svelte'
	import { exampleAction } from './data.remote.ts'

	let todos = $state<{ id: string; name: string }[]>([])
	let failure = $state<string | null>(null)

	// stands in for a value loaded after mount, e.g. an edit form waiting on a query
	let lateDefault = $state<string | undefined>(undefined)
	setTimeout(() => (lateDefault = 'loaded later'), 50)
</script>

<Form
	action={exampleAction}
	resetForm
	onsuccess={(data) => {
		failure = null
		todos.push(data)
	}}
	onfailure={(error) => {
		failure = Array.isArray(error) ? error.map((e) => e.message).join(', ') : String(error)
	}}
	class="flex flex-col gap-4 max-w-xs"
>
	<ExampleInput label="Name" name="name" type="text" defaultValue={lateDefault} />

	<button type="submit">Submit</button>
	<button type="reset">Reset</button>
</Form>

{#if failure}
	<p data-testid="failure">{failure}</p>
{/if}

<ul data-testid="todos">
	{#each todos as todo (todo.id)}
		<li>{todo.name}</li>
	{/each}
</ul>
