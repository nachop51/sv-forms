<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import type { HTMLInputAttributes } from 'svelte/elements'
	import type { RemoteFormField } from '@sveltejs/kit'
	import { getFormContext, warnMissingForm } from './form.svelte'

	export type BaseInputProps = Omit<HTMLInputAttributes, 'type'> & {
		ref?: HTMLInputElement | null
		files?: FileList | null
		name: string
		type?: Parameters<RemoteFormField<any>['as']>[0]
		/**
		 * Acknowledge that this input is deliberately outside a `<Form>`, silencing the dev warning
		 * about the missing form context. It renders as a plain `<input>` either way.
		 */
		standalone?: boolean
	}

	// Input types where the second argument to `as()` is the option value rather than a default.
	const OPTION_VALUE_TYPES = ['radio', 'checkbox', 'submit', 'hidden']

	let {
		ref = $bindable(),
		files = $bindable(),
		value = $bindable(),
		checked = $bindable(),
		name,
		type = 'text',
		defaultValue,
		standalone = false,
		...props
	}: BaseInputProps = $props()

	const formContext = getFormContext()

	// A one-shot check at init is the intent: props identify the field, they do not change.
	// svelte-ignore state_referenced_locally
	if (!formContext && !standalone) warnMissingForm('Input', name)

	// `value` at mount time, for back-compat with prefilling an edit form through `value`.
	const initialValue = value

	// The second argument to `as()` sets the element's initial value *and* the value it reverts to
	// when the form is reset, so for editable inputs it must not follow `value` — `bind:value`
	// overwrites that as the user types, which would make `reset()` restore their own input.
	const fieldValue = $derived(
		OPTION_VALUE_TYPES.includes(type) ? value : (defaultValue ?? initialValue)
	)

	const inputCtxFormProps = $derived(formContext?.fields[name]?.as(type as any, fieldValue) ?? {})
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		{name}
		bind:value
		{defaultValue}
		{...inputCtxFormProps}
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
		{defaultValue}
		{...inputCtxFormProps}
		{...props}
	/>
{:else}
	<!--
		`type` is applied before the field props on purpose. `as()` omits `type` for text inputs and
		sets an identical one for every other type, so the field still wins where it has an opinion —
		but with no form context `inputCtxFormProps` is `{}`, and without this the attribute would be
		dropped entirely, silently rendering `password`/`number`/`email` inputs as plain text.
	-->
	<input
		bind:this={ref}
		bind:value
		{name}
		{type}
		{defaultValue}
		{...inputCtxFormProps}
		{...props}
	/>
{/if}
