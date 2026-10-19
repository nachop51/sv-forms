<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import type { HTMLSelectAttributes } from 'svelte/elements'
	import { getFormContext, warnMissingForm } from './form.svelte'
	import type { BaseInputProps } from './input.svelte'

	export type BaseSelectProps = HTMLSelectAttributes & {
		ref?: HTMLSelectElement | null
		files?: FileList | null
		name: string
		type?: Extract<BaseInputProps['type'], 'select' | 'select multiple'>
		/** The selection the field falls back to, including after the form is reset. */
		defaultValue?: HTMLSelectAttributes['value']
		/**
		 * Acknowledge that this select is deliberately outside a `<Form>`, silencing the dev warning
		 * about the missing form context. It renders as a plain `<select>` either way.
		 */
		standalone?: boolean
	}

	let {
		ref = $bindable(),
		value = $bindable(),
		children,
		type = 'select',
		name,
		defaultValue,
		standalone = false,
		onchange,
		...restProps
	}: BaseSelectProps = $props()

	const formContext = getFormContext()

	// A one-shot check at init is the intent: props identify the field, they do not change.
	// svelte-ignore state_referenced_locally
	if (!formContext && !standalone) warnMissingForm('Select', name)

	const multiple = $derived(type === 'select multiple')

	// `value` at mount time, for back-compat with prefilling a select through `value`.
	const initialValue = value

	// See the note in `input.svelte`: this is the field's default, so it must not follow the bound
	// `value` — that tracks the user's own selection.
	const fieldValue = $derived(defaultValue ?? initialValue)

	// Outside a form there is no field holding the default, and unlike an `<input>` a `<select>` has
	// no `defaultValue` of its own — its reset value lives on the `selected` attribute of an
	// `<option>` the consumer owns. So seed the bound value to get the initial selection right...
	// svelte-ignore state_referenced_locally
	if (!formContext && value === undefined && defaultValue !== undefined) value = defaultValue

	const selectCtxFormProps = $derived.by(() => {
		// Spreading evaluates the getters `as()` returns, which keeps them tracked here.
		const props: Record<string, any> = {
			...(name && formContext?.fields[name]?.as(type as any, fieldValue)),
		}

		// A select the user hasn't touched has no field value yet. Applying `value: undefined` would
		// clear the selection the browser made for us (the first option), so the next submit would
		// send nothing for a field nobody edited.
		if (props.value == null) delete props.value

		return props
	})

	// ...and mark the matching options, so a native reset reverts to the default rather than to the
	// browser's own fallback. Inside a form the field already owns this.
	$effect(() => {
		if (formContext || defaultValue === undefined || !ref) return

		const wanted = new Set(
			(Array.isArray(defaultValue) ? defaultValue : [defaultValue]).map(String)
		)

		for (const option of Array.from(ref.options)) {
			option.defaultSelected = wanted.has(option.value)
		}
	})

	function handleChange(event: Event & { currentTarget: HTMLSelectElement }) {
		const select = event.currentTarget
		value = multiple ? Array.from(select.selectedOptions, (option) => option.value) : select.value
		onchange?.(event)
	}
</script>

{#if formContext}
	<!--
		Inside a form the field owns the value, so it is applied as an attribute rather than bound:
		`bind:value` re-runs on every render and clears the selection whenever the bound `value` is
		undefined (which it is unless the consumer passes one). `handleChange` keeps `bind:value`
		working for consumers that do pass one.
	-->
	<select
		bind:this={ref}
		{name}
		{multiple}
		{...selectCtxFormProps}
		{...restProps}
		onchange={handleChange}
	>
		{@render children?.()}
	</select>
{:else if multiple}
	<!-- `multiple` has to be static wherever the value is bound -->
	<select bind:this={ref} bind:value multiple {name} {...restProps} {onchange}>
		{@render children?.()}
	</select>
{:else}
	<select bind:this={ref} bind:value {name} {...restProps} {onchange}>
		{@render children?.()}
	</select>
{/if}
