<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import type { HTMLSelectAttributes } from 'svelte/elements'
	import { getFormContext } from './form.svelte'
	import type { BaseInputProps } from './input.svelte'

	export type BaseSelectProps = HTMLSelectAttributes & {
		ref?: HTMLSelectElement | null
		files?: FileList | null
		name: string
		type: Extract<BaseInputProps['type'], 'select' | 'select multiple'>
	}

	let {
		ref = $bindable(),
		value = $bindable(),
		children,
		type = 'select',
		name,
		...restProps
	}: BaseSelectProps = $props()

	const formContext = getFormContext()
</script>

<select
	bind:value
	bind:this={ref}
	{name}
	{...formContext?.fields[name]?.as(type as any)}
	{...restProps}
>
	{@render children?.()}
</select>
