import * as v from 'valibot'
import { form } from '$app/server'

const schema = v.object({
	name: v.pipe(v.string(), v.minLength(3)),
})

export const exampleAction = form(schema, async (data) => {
	console.log(data)
	return {
		id: crypto.randomUUID(),
		name: data.name,
	}
})
