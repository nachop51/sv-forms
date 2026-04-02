import * as v from 'valibot'
import { form } from '$app/server'

enum Gender {
	MALE = 'male',
	FEMALE = 'female',
}

const schema = v.object({
	name: v.pipe(v.string(), v.minLength(3)),
	email: v.pipe(v.string(), v.email()),
	age: v.pipe(v.number(), v.minValue(18)),
	gender: v.enum(Gender),
	hobbies: v.array(v.string()),
	is_subscribed: v.boolean(),
	birth_date: v.pipe(v.string(), v.toDate()),
})

export const exampleAction = form(schema, async (data) => {
	console.log(data)
	return data
})
