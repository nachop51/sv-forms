<script lang="ts" module>
	import { getContext, setContext, type Snippet } from 'svelte'
	import { DEV } from 'esm-env'
	import type { RemoteForm, RemoteFormIssue } from '@sveltejs/kit'
	import type { HTMLFormAttributes } from 'svelte/elements'
	import { FORM_CONTEXT_KEY } from '$lib/consts.js'

	/**
	 * The bound for the `action` prop: permissive enough to accept both a `RemoteForm` and the
	 * `Omit<RemoteForm, 'for'>` returned by `action.for(id)`.
	 *
	 * This is only a constraint — the actual type is inferred from the `action` you pass, so
	 * `fields`, `result` and the `enhance` callback all stay fully typed at the call site.
	 */
	export type AnyRemoteForm = {
		method: 'POST'
		action: string
		fields: any
		get result(): any
		enhance(callback: (form: any) => any): {
			method: 'POST'
			action: string
			[attachment: symbol]: (node: HTMLFormElement) => void
		}
	}

	export type EnhanceFn<T extends AnyRemoteForm = AnyRemoteForm> = Parameters<T['enhance']>[0]

	type DefinedUnlessExactlyUndefined<T> = [T] extends [undefined]
		? undefined
		: Exclude<T, undefined>

	// `children` is omitted alongside `action` because `HTMLFormAttributes` types it as a
	// parameterless `Snippet`, which would intersect with — rather than replace — the one below.
	export type BaseFormProps<T extends AnyRemoteForm = AnyRemoteForm> = Omit<
		HTMLFormAttributes,
		'action' | 'children'
	> & {
		ref?: HTMLFormElement | null
		/**
		 * The form's content. Receives the `action` you passed, so nested markup can read
		 * `form.pending`, call `form.validate()` or reach `form.fields` without importing the remote
		 * function again.
		 */
		children: Snippet<[T]>
		action: T
	} & (
			| {
					/**
					 * Called when the remote form action succeeds, this means:
					 *
					 * - The validation passes
					 * - No error happens during the submission
					 *
					 * This doesn't automatically detects if your code inside the action returns a success or failure, you need to do that yourself.
					 *
					 * This is implemented by providing a basic enhance function that will call `onsuccess` with the result.
					 *
					 * If you want to customize the behavior, you can provide an `enhance` function.
					 *
					 * @param data - The result returned by the remote form action.
					 */
					onsuccess?: (data: DefinedUnlessExactlyUndefined<T['result']>) => any | Promise<any>
					/**
					 * Called when the remote form action fails, this means:
					 *
					 * - The validation fails
					 * - An error happens during the submission
					 *
					 * This is implemented by providing a basic enhance function that will call `onfailure` with the errors or `onsuccess` with the result.
					 *
					 * If you want to customize the behavior, you can provide an `enhance` function.
					 *
					 * @param error - The array of errors returned by the remote form, or the error that happened during the submission.
					 */
					onfailure?: (error: any) => any | Promise<any>
					/**
					 * Enhance the remote form action.
					 *
					 * If `enhance` is provided, it will spread on the form action.enhance(enhance) instead of the form action itself.
					 */
					enhance?: never
					/**
					 * Remove default enhance behavior, this means you only want the default behavior, and not the `enhance` function.
					 */
					removeDefaultEnhance?: never
					/**
					 * Reset the form after the submission succeeds.
					 *
					 * This is the default behavior of the actions in general, but when `enhance` is provided, it will not reset the form.
					 *
					 * To disable this behavior, you can set `resetForm` to `false`.
					 */
					resetForm?: boolean
			  }
			| {
					enhance: EnhanceFn<T>
					onsuccess?: never
					onfailure?: never
					removeDefaultEnhance?: never
					resetForm?: never
			  }
			| {
					removeDefaultEnhance: true
					enhance?: never
					onsuccess?: never
					onfailure?: never
					resetForm?: never
			  }
		)

	/**
	 * The `<Form>` instance this component is inside, or `undefined` if there is no `<Form>` ancestor.
	 *
	 * Like `getContext`, this must be called during component initialisation. Hold the result and
	 * read off it later — the remote form's own properties (`pending`, `result`, `fields`) are
	 * reactive, so reading them in your markup stays up to date.
	 */
	// Typed as a full `RemoteForm` rather than `AnyRemoteForm` so that callers keep the field typings
	// they had before — `AnyRemoteForm` is deliberately loose, and only exists to bound `action`.
	function getFormContext() {
		const formContext = getContext(FORM_CONTEXT_KEY) as () => RemoteForm<any, any> | undefined
		return formContext ? formContext() : undefined
	}

	/**
	 * A getter for the validation issues on one field, for building your own field wrapper.
	 *
	 * Call this during component initialisation and call the getter it returns wherever you need the
	 * issues — the read is reactive, so it re-runs as the field is validated:
	 *
	 * ```js
	 * // in your wrapper's <script>, at the top level
	 * const errors = getInputErrors(name)
	 * ```
	 *
	 * ```svelte
	 * {#if errors()}
	 *   <p>{errors()!.map((e) => e.message).join(', ')}</p>
	 * {/if}
	 * ```
	 */
	function getInputErrors(name: string): () => RemoteFormIssue[] | undefined {
		// The context is read here, at init, where it is legal to do so. Only the `issues()` call is
		// deferred into the getter, which is what makes the result reactive.
		const formContext = getFormContext()
		return () => formContext?.fields[name]?.issues()
	}

	/**
	 * Warn, in dev only, about a field that has no `<Form>` ancestor. Standalone use is supported,
	 * so this is opt-out via the `standalone` prop rather than always-on.
	 */
	function warnMissingForm(component: 'Input' | 'Select', name: string) {
		if (!DEV) return

		console.warn(
			`[sv-forms] <${component} name="${name}" /> has no <Form> ancestor, so it is not wired to ` +
				`a remote form field: no validation, no aria-invalid, no name coercion and no reset ` +
				`value. If that is intentional, pass \`standalone\` to silence this.`
		)
	}

	export { getFormContext, getInputErrors, warnMissingForm }
</script>

<script lang="ts" generics="T extends AnyRemoteForm">
	let {
		ref = $bindable(),
		children,
		action,
		// Destructured so they do not land on the <form> element via the spread below. `resetForm` and
		// `removeDefaultEnhance` would render as bogus attributes, and `onsuccess`/`onfailure` would
		// register listeners for events that do not exist.
		onsuccess,
		onfailure,
		enhance,
		removeDefaultEnhance,
		resetForm,
		...props
	}: BaseFormProps<T> = $props()

	setContext(FORM_CONTEXT_KEY, () => action)

	const defaultEnhance: EnhanceFn<T> = async (form) => {
		try {
			const success = await form.submit()

			if (!success) {
				onfailure?.(form.fields.allIssues())
				return
			}

			if (resetForm) form.element.reset()

			onsuccess?.(action.result)
		} catch (error) {
			onfailure?.(error)
		}
	}

	let formAction = $derived.by(() => {
		if (removeDefaultEnhance) return action

		const enhanceFn = enhance ?? defaultEnhance

		return action?.enhance(enhanceFn)
	})
</script>

<form bind:this={ref} {...props} {...formAction}>
	{@render children(action)}
</form>
