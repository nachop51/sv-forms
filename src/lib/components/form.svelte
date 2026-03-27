<script lang="ts" module>
	import type { RemoteForm } from '@sveltejs/kit'
	import type { HTMLFormAttributes } from 'svelte/elements'

	export type BaseFormProps<T extends RemoteForm<any, any> = RemoteForm<any, any>> = Omit<
		HTMLFormAttributes,
		'action'
	> & {
		ref?: HTMLFormElement | null
		children: Snippet
		action: T
	}

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
	import { createContext, type Snippet } from 'svelte'

	let { ref = $bindable(), children, action, ...props }: BaseFormProps<T> = $props()

	setFormAction(() => action)
</script>

<form bind:this={ref} {...props} {...action}>
	{@render children()}
</form>
