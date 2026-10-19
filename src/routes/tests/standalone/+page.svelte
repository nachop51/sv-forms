<script lang="ts">
	import { Input, Select } from '#lib/index.js'

	// No <Form> ancestor, so there is no form context and the components fall back to plain
	// elements. Everything a consumer passes has to survive that path untouched. `standalone`
	// acknowledges that on purpose, so the dev warning stays quiet.
	let text = $state('hello')
	let agree = $state(false)
	let plan = $state('free')
	let ref = $state<HTMLInputElement | null>(null)
</script>

<!-- A plain <form>, not <Form>: gives us a native reset without introducing a form context. -->
<form>
	<Input standalone bind:ref name="text" type="text" bind:value={text} defaultValue="original" />
	<Input standalone name="agree" type="checkbox" bind:checked={agree} />

	<!-- `type` has to survive the fallback path: these must not degrade to plain text inputs -->
	<Input standalone name="pw" type="password" data-testid="sa-pw" />
	<Input standalone name="count" type="number" data-testid="sa-num" />
	<Input standalone name="mail" type="email" data-testid="sa-mail" />

	<Select standalone name="plan" type="select" bind:value={plan}>
		<option>free</option>
		<option>pro</option>
	</Select>

	<!-- `defaultValue` with no field to hold it: sets the selection *and* the reset value -->
	<Select standalone name="tier" defaultValue="gold" data-testid="sa-tier">
		<option>bronze</option>
		<option>silver</option>
		<option>gold</option>
	</Select>

	<Select standalone name="langs" type="select multiple">
		<option>html</option>
		<option>css</option>
	</Select>

	<button type="reset">Reset</button>
</form>

<p data-testid="text">{text}</p>
<p data-testid="agree">{agree}</p>
<p data-testid="plan">{plan}</p>
<p data-testid="ref">{ref?.tagName ?? 'none'}</p>
