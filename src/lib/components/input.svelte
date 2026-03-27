<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import type { HTMLInputAttributes } from 'svelte/elements'
	import type { RemoteFormField } from '@sveltejs/kit'

	export type BaseInputProps = HTMLInputAttributes & {
		ref?: HTMLInputElement | null
		files?: FileList | null
		name: string
		type: Parameters<RemoteFormField<any>['as']>[0]
	}
	import { getFormContext } from './form.svelte'

	let {
		ref = $bindable(),
		files = $bindable(),
		value = $bindable(),
		checked = $bindable(),
		name,
		type = 'text',
		...props
	}: BaseInputProps = $props()

	const formContext = getFormContext()
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		{name}
		bind:value
		{...formContext?.fields[name]?.as(type as any, value)}
		type="file"
		{...props}
		bind:files
	/>
{:else if type === 'checkbox'}
	<input
		bind:this={ref}
		type="checkbox"
		bind:checked
		{name}
		{...formContext?.fields[name]?.as(type as any, value)}
		{...props}
	/>
{:else}
	<input
		bind:this={ref}
		bind:value
		{name}
		{...formContext?.fields[name]?.as(type as any, value)}
		{...props}
	/>
{/if}
