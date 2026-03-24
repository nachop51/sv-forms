<script lang="ts">
	import { Form, Input, Select } from '$lib/index.js'
	import ExampleInput from '$lib/components/ui/example-input.svelte'
	import { exampleAction } from './data.remote.ts'
	import { getInputErrors } from '$lib/components/form.svelte'
</script>

<Form action={exampleAction} class="flex flex-col gap-4 max-w-xs">
	<ExampleInput label="Name" name="name" type="text" />
	<ExampleInput name="email" type="email" />
	<ExampleInput name="age" type="number" />
	<label>
		<span>Male</span>
		<Input name="gender" type="radio" value="male" />
	</label>
	<label>
		<span>Female</span>
		<Input name="gender" type="radio" value="female" />
	</label>
	{JSON.stringify(getInputErrors('gender'))}
	<div>
		<Input name="hobbies" type="checkbox" value="reading" />
		<Input name="hobbies" type="checkbox" value="writing" />
		<Input name="hobbies" type="checkbox" value="coding" />

		{JSON.stringify(getInputErrors('hobbies'))}
	</div>
	<ExampleInput name="is_subscribed" type="checkbox" />
	<ExampleInput name="birth_date" type="date" />

	<Select name="favorite_color" type="select multiple" value="red">
		<option value="red">Red</option>
		<option value="green">Green</option>
		<option value="blue">Blue</option>
	</Select>
	{JSON.stringify(getInputErrors('favorite_color'))}
	<button type="submit">Submit</button>
</Form>
