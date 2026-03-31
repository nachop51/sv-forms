<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import type { HTMLInputAttributes } from 'svelte/elements'
	import type { RemoteFormField } from '@sveltejs/kit'
	import { getFormContext } from './form.svelte'

	export type BaseInputProps = Omit<HTMLInputAttributes, 'type'> & {
		ref?: HTMLInputElement | null
		files?: FileList | null
		name: string
		type?: Parameters<RemoteFormField<any>['as']>[0]
	}

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

	const inputCtxFormProps = $derived(formContext?.fields[name]?.as(type as any, value) ?? {})
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		{name}
		bind:value
		{...inputCtxFormProps}
		type="file"
		{...props}
		bind:files
	/>
{:else if type === 'checkbox'}
	<input bind:this={ref} type="checkbox" bind:checked {name} {...inputCtxFormProps} {...props} />
{:else}
	<input bind:this={ref} bind:value {name} {...inputCtxFormProps} {...props} />
{/if}
