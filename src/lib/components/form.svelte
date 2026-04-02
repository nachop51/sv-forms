<script lang="ts" module>
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
	import type { RemoteForm } from '@sveltejs/kit'
	import { createContext, type Snippet } from 'svelte'
	import type { HTMLFormAttributes } from 'svelte/elements'

	type Props = Omit<HTMLFormAttributes, 'action'> & {
		children: Snippet
		action: T
	}

	let { children, action, ...props }: Props = $props()

	setFormAction(() => action)
</script>

<form {...props} {...action}>
	{@render children()}
</form>
