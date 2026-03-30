<script lang="ts">
	import type { BaseInputProps } from '../input.svelte'
	import Input from '../input.svelte'
	import { getInputErrors } from '../form.svelte'

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

	let errors = $derived(getInputErrors(name))
</script>

<div class="space-y-2">
	<label>
		{#if label}
			<span class="block text-sm font-medium mb-2">{label}</span>
		{/if}

		<Input bind:ref bind:value {name} {type} {...props} class="border" />
	</label>

	{#if errors}
		<p class="text-red-500 text-sm">{errors.map((e) => e.message).join(', ')}</p>
	{/if}
</div>
