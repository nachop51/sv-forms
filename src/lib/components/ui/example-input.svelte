<script lang="ts">
	import type { BaseInputProps } from '../input.svelte'
	import Input from '../input.svelte'
	import { getInputErrors } from '../form.svelte'

	type UIInputProps = Omit<BaseInputProps, 'error'>

	let { name, type = 'text', ...props }: UIInputProps = $props()

	let errors = $derived(getInputErrors(name))
</script>

<Input {name} {type} {...props} class="border" />

{#if errors}
	<p>{errors.map((e) => e.message).join(', ')}</p>
{/if}
