import * as v from 'valibot'
import { error } from '@sveltejs/kit'
import { form } from '$app/server'
import { languages, plans, tags } from './constants.ts'

/** Every field type the library can render, echoed back so tests can assert what the server got. */
export const submitFields = form(
	v.object({
		text: v.pipe(v.string(), v.minLength(2, 'text too short')),
		count: v.number(),
		subscribe: v.optional(v.boolean(), false),
		plan: v.picklist(plans),
		os: v.picklist(languages),
		langs: v.optional(v.array(v.picklist(languages)), []),
		picked: v.optional(v.array(v.picklist(tags)), []),
	}),
	async (data) => ({ received: data })
)

export const uploadFile = form(v.object({ doc: v.file() }), async ({ doc }) => ({
	name: doc.name,
	size: doc.size,
	text: await doc.text(),
}))

/** Returns its input, for asserting which enhance path ran. */
export const echo = form(
	v.object({ note: v.pipe(v.string(), v.minLength(2, 'note too short')) }),
	async ({ note }) => ({ note })
)

/** Always fails on the server, to exercise the `onfailure` error path. */
export const boom = form(v.object({ note: v.string() }), async () => {
	error(500, 'boom')
})
