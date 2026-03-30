<script lang="ts">
	import { Form } from '$lib/index.js'
	import ExampleInput from '$lib/components/ui/example-input.svelte'
	import { exampleAction } from './data.remote.ts'

	let todos = $state<{ id: string; name: string }[]>([])
</script>

<Form
	action={exampleAction}
	onsuccess={(data) => {
		todos.push(data)
	}}
	class="flex flex-col gap-4 max-w-xs"
>
	<ExampleInput label="Name" name="name" type="text" />

	<button type="submit">Submit</button>
</Form>

<ul>
	{#each todos as todo (todo.id)}
		<li>{todo.name}</li>
	{/each}
</ul>
