import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/tests/enhance')
})

test('a custom enhance receives the form instance and replaces the default behaviour', async ({
	page,
}) => {
	await page.getByTestId('custom-note').fill('hello')
	await page.getByTestId('custom-submit').click()

	// `form.element` is the <form>, `form.submit()` resolves to whether the data was valid, and
	// `form.result` holds what the action returned
	await expect(page.getByTestId('log').getByRole('listitem')).toHaveText([
		'element:FORM',
		'valid:true',
		'result:hello',
	])
	// the callback reset the form itself
	await expect(page.getByTestId('custom-note')).toHaveValue('')
})

test('a custom enhance sees submit() resolve false on invalid data', async ({ page }) => {
	await page.getByTestId('custom-note').fill('x')
	await page.getByTestId('custom-submit').click()

	await expect(page.getByTestId('log').getByRole('listitem')).toHaveText([
		'element:FORM',
		'valid:false',
		'result:none',
	])
})

test('removeDefaultEnhance still submits, without running any callback', async ({ page }) => {
	await page.getByTestId('bare-note').fill('bare submit')
	await page.getByTestId('bare-submit').click()

	await expect(page.getByTestId('bare-result')).toHaveText('bare submit')
	// no enhance callback ran, so nothing was logged
	await expect(page.getByTestId('log').getByRole('listitem')).toHaveCount(0)
})

test('a server error goes to onfailure instead of the error page', async ({ page }) => {
	await page.getByTestId('boom-submit').click()

	await expect(page.getByTestId('failure')).toHaveText('boom')
	// this is the regression that produced a 500 page: the form must still be on screen
	await expect(page.getByTestId('boom-submit')).toBeVisible()
	await expect(page.getByTestId('log').getByRole('listitem')).toHaveCount(0)
})

test('recovers from a failed submission and can submit again', async ({ page }) => {
	await page.getByTestId('custom-note').fill('x')
	await page.getByTestId('custom-submit').click()
	await expect(page.getByTestId('log')).toContainText('valid:false')

	await page.getByTestId('custom-note').fill('second try')
	await page.getByTestId('custom-submit').click()

	await expect(page.getByTestId('log')).toContainText('result:second try')
})

// The children snippet is handed the form instance, so nested markup can read its reactive state.
test('children snippet receives the form instance', async ({ page }) => {
	await expect(page.getByTestId('snip-value')).toHaveText('empty')

	await page.getByTestId('snip-note').fill('typed')
	await expect(page.getByTestId('snip-value')).toHaveText('typed')

	await expect(page.getByTestId('snip-submit')).toBeEnabled()
})

// Regression: `resetForm`, `removeDefaultEnhance`, `onsuccess` and `onfailure` were left in the
// rest props and spread straight onto the <form>, rendering as bogus attributes and registering
// listeners for events that do not exist.
test('does not leak its own props onto the form element', async ({ page }) => {
	const attrs = await page
		.getByTestId('snippet-form')
		.evaluate((el) => [...el.attributes].map((a) => a.name))

	expect(attrs.sort()).toEqual(['action', 'data-testid', 'method'])
})
