import { expect, test } from '@playwright/test'

test('onfailure receives validation issues, onsuccess resets to the field default', async ({
	page,
}) => {
	await page.goto('/')

	const input = page.locator('input[name="name"]')
	const submit = page.locator('button[type="submit"]')

	// `defaultValue` arrives after mount, so it has to be picked up reactively
	await expect(input).toHaveValue('loaded later')

	// too short for the schema -> onfailure, no error page
	await input.fill('ab')
	await submit.click()
	await expect(page.getByTestId('failure')).toContainText('Expected >=3')
	await expect(input).toHaveValue('ab')

	// valid -> onsuccess with the action result, and `resetForm` reverts to the default
	await input.fill('buy milk')
	await submit.click()
	await expect(page.getByTestId('todos')).toContainText('buy milk')
	await expect(page.getByTestId('failure')).toHaveCount(0)
	await expect(input).toHaveValue('loaded later')
})

test('a native reset reverts to the field default, not to what was typed', async ({ page }) => {
	await page.goto('/')

	const input = page.locator('input[name="name"]')
	await expect(input).toHaveValue('loaded later')

	await input.fill('typed by hand')
	await page.locator('button[type="reset"]').click()
	await expect(input).toHaveValue('loaded later')
})
