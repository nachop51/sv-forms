<script lang="ts">
	import { Form } from '$lib/index.js'
	import ExampleInput from '$lib/components/ui/example-input.svelte'
	import { exampleAction } from './data.remote.ts'
</script>

<Form action={exampleAction} class="flex flex-col gap-4 max-w-xs">
	<ExampleInput name="name" type="text" />
	<ExampleInput name="email" type="email" />
	<ExampleInput name="age" type="number" />
	<label>
		<span>Male</span>
		<ExampleInput name="gender" type="radio" value="male" />
	</label>
	<label>
		<span>Female</span>
		<ExampleInput name="gender" type="radio" value="female" />
	</label>
	<div>
		<ExampleInput name="hobbies" type="checkbox" value="reading" />
		<ExampleInput name="hobbies" type="checkbox" value="writing" />
		<ExampleInput name="hobbies" type="checkbox" value="coding" />
	</div>
	<ExampleInput name="is_subscribed" type="checkbox" />
	<ExampleInput name="birth_date" type="date" />
	<button type="submit">Submit</button>
</Form>
