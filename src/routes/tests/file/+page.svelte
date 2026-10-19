<script lang="ts">
	import { Form, Input } from '#lib/index.js'
	import { uploadFile } from '../tests.remote.ts'

	let result = $state<string | null>(null)
	let files = $state<FileList | null>(null)
</script>

<Form
	action={uploadFile}
	enctype="multipart/form-data"
	onsuccess={(data) => (result = `${data.name}|${data.size}|${data.text}`)}
>
	<Input name="doc" type="file" bind:files data-testid="doc" />
	<button type="submit">Upload</button>
</Form>

<p data-testid="picked">{files?.[0]?.name ?? 'none'}</p>

{#if result}
	<p data-testid="result">{result}</p>
{/if}
