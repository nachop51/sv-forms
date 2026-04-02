<script lang="ts" module>
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import type { HTMLInputAttributes } from 'svelte/elements'
	import type { RemoteFormField } from '@sveltejs/kit'

	export type BaseInputProps = HTMLInputAttributes & {
		name: string
		type: Parameters<RemoteFormField<any>['as']>[0]
	}
</script>

<script lang="ts">
	import { getFormContext } from './form.svelte'

	let { name, type = 'text', value, ...props }: BaseInputProps = $props()

	const formContext = getFormContext()
</script>

<input {name} {value} {...formContext?.fields[name].as(type as any, value)} {...props} />
