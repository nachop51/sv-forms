<script lang="ts">
	import type { BaseInputProps } from '$lib/components/input.svelte'
	import Input from '$lib/components/input.svelte'
	import { getInputErrors } from '$lib/components/form.svelte'

	type UIInputProps = Omit<BaseInputProps, 'error'> & {
		label?: string
	}

	let {
		ref = $bindable(),
		value = $bindable(),
		name,
		type = 'text',
		label,
		...props
	}: UIInputProps = $props()

	// Read the context at init; the getter it returns is what re-runs as the field is validated.
	// svelte-ignore state_referenced_locally
	const errors = getInputErrors(name)
</script>

<div class="space-y-2">
	<label>
		{#if label}
			<span class="block text-sm font-medium mb-2">{label}</span>
		{/if}

		<Input bind:ref bind:value {name} {type} {...props} class="border" />
	</label>

	{#if errors()}
		<p class="text-red-500 text-sm">
			{errors()!
				.map((e) => e.message)
				.join(', ')}
		</p>
	{/if}
</div>
