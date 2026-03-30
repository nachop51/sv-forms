<script lang="ts" module>
	import { createContext, type Snippet } from 'svelte'
	import type { RemoteForm, RemoteQuery, RemoteQueryOverride } from '@sveltejs/kit'
	import type { HTMLFormAttributes } from 'svelte/elements'

	export type EnhanceFn = <T>(opts: {
		form: HTMLFormElement
		data: T
		submit: () => Promise<void> & {
			updates: (...queries: Array<RemoteQuery<any> | RemoteQueryOverride>) => Promise<void>
		}
	}) => void | Promise<void>

	type DefinedUnlessExactlyUndefined<T> =
		[T] extends [undefined] ? undefined : Exclude<T, undefined>

	export type BaseFormProps<T extends RemoteForm<any, any> = RemoteForm<any, any>> = Omit<
		HTMLFormAttributes,
		'action'
	> & {
		ref?: HTMLFormElement | null
		children: Snippet
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
					enhance: EnhanceFn
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

	const [getFormAction, setFormAction] = createContext<() => RemoteForm<any, any> | undefined>()

	function getFormContext() {
		const formContext = getFormAction()
		return formContext ? formContext() : undefined
	}

	function getInputErrors(name: string) {
		const formContext = getFormContext()
		return formContext?.fields[name]?.issues()
	}

	export { getFormContext, getInputErrors }
</script>

<script lang="ts" generics="T extends RemoteForm<any, any>">
	let {
		ref = $bindable(),
		children,
		action,
		enhance,
		resetForm = true,
		onfailure,
		onsuccess,
		removeDefaultEnhance,
		...props
	}: BaseFormProps<T> = $props()

	setFormAction(() => action)

	const defaultEnhance: EnhanceFn = async ({ form, submit }) => {
		try {
			await submit()
			if (resetForm) form.reset()

			let issues = action.fields.allIssues()
			if (issues?.length ?? 0 > 0) {
				onfailure?.(issues)
			} else {
				onsuccess?.(action.result)
			}
		} catch (error) {
			onfailure?.(error)
		}
	}

	let formAction = $derived.by(() => {
		if (removeDefaultEnhance) return action

		const enhanceFn = enhance ?? defaultEnhance

		return action.enhance(enhanceFn)
	})
</script>

<form bind:this={ref} {...props} {...formAction}>
	{@render children()}
</form>
