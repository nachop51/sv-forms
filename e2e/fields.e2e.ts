import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/tests/fields')
	// the text field's default arrives after mount
	await expect(page.getByTestId('text')).toHaveValue('from server')
})

test('sends every field type to the server with the right JS type', async ({ page }) => {
	await page.getByTestId('text').fill('a title')
	await page.getByTestId('count').fill('42')
	await page.getByTestId('subscribe').check()
	await page.getByTestId('plan-pro').check()
	await page.getByTestId('os').selectOption('css')
	await page.getByTestId('langs').selectOption(['html', 'js'])
	await page.getByTestId('picked-b').check()

	await page.getByRole('button', { name: 'Submit' }).click()

	// numbers and booleans are coerced by SvelteKit's `n:`/`b:` name prefixes, not left as strings
	await expect(page.getByTestId('result')).toHaveText(
		JSON.stringify({
			text: 'a title',
			count: 42,
			subscribe: true,
			plan: 'pro',
			os: 'css',
			langs: ['html', 'js'],
			picked: ['b'],
		})
	)
	await expect(page.getByTestId('issues')).toHaveCount(0)
})

test('sends the defaults when nothing is touched', async ({ page }) => {
	await page.getByTestId('plan-free').check()
	await page.getByRole('button', { name: 'Submit' }).click()

	await expect(page.getByTestId('result')).toHaveText(
		JSON.stringify({
			text: 'from server',
			count: 7,
			subscribe: false,
			plan: 'free',
			os: 'html',
			langs: [],
			picked: [],
		})
	)
})

test('surfaces field issues and sets aria-invalid, without calling onsuccess', async ({ page }) => {
	await page.getByTestId('text').fill('x')
	await page.getByTestId('plan-free').check()
	await page.getByRole('button', { name: 'Submit' }).click()

	await expect(page.getByTestId('issues')).toHaveText('text too short')
	await expect(page.getByTestId('text')).toHaveAttribute('aria-invalid', 'true')
	await expect(page.getByTestId('result')).toHaveCount(0)
})

test('does not reset the form when the submission is invalid', async ({ page }) => {
	await page.getByTestId('text').fill('x')
	await page.getByTestId('count').fill('99')
	await page.getByTestId('plan-free').check()
	await page.getByRole('button', { name: 'Submit' }).click()

	await expect(page.getByTestId('issues')).toBeVisible()
	// the user's input has to survive so they can correct it
	await expect(page.getByTestId('text')).toHaveValue('x')
	await expect(page.getByTestId('count')).toHaveValue('99')
})

test('resetForm reverts every field to its default after a successful submit', async ({ page }) => {
	await page.getByTestId('text').fill('a title')
	await page.getByTestId('count').fill('42')
	await page.getByTestId('subscribe').check()
	await page.getByTestId('plan-pro').check()
	await page.getByTestId('langs').selectOption(['html'])
	await page.getByTestId('picked-a').check()

	await page.getByRole('button', { name: 'Submit' }).click()
	await expect(page.getByTestId('result')).toBeVisible()

	await expect(page.getByTestId('text')).toHaveValue('from server')
	await expect(page.getByTestId('count')).toHaveValue('7')
	await expect(page.getByTestId('subscribe')).not.toBeChecked()
	await expect(page.getByTestId('picked-a')).not.toBeChecked()
	await expect(page.getByTestId('langs')).toHaveValues([])
})

test('a native reset reverts to the defaults, not to what was typed', async ({ page }) => {
	await page.getByTestId('text').fill('typed by hand')
	await page.getByTestId('count').fill('123')
	await page.getByTestId('subscribe').check()

	await page.getByRole('button', { name: 'Reset' }).click()

	await expect(page.getByTestId('text')).toHaveValue('from server')
	await expect(page.getByTestId('count')).toHaveValue('7')
	await expect(page.getByTestId('subscribe')).not.toBeChecked()
})

test('keeps untouched selects intact across a failed submit', async ({ page }) => {
	await page.getByTestId('os').selectOption('css')
	await page.getByTestId('plan-free').check()

	// fail on an unrelated field: the re-render must not wipe the select's selection
	await page.getByTestId('text').fill('x')
	await page.getByRole('button', { name: 'Submit' }).click()
	await expect(page.getByTestId('issues')).toHaveText('text too short')
	await expect(page.getByTestId('os')).toHaveValue('css')

	await page.getByTestId('text').fill('long enough')
	await page.getByRole('button', { name: 'Submit' }).click()
	await expect(page.getByTestId('result')).toContainText('"os":"css"')
})

test('bind:value reports what the user picked', async ({ page }) => {
	await page.getByTestId('os').selectOption('css')
	await page.getByTestId('text').fill('typed')

	await expect(page.getByTestId('bound-os')).toHaveText('css')
	await expect(page.getByTestId('bound-text')).toHaveText('typed')
})

// Inside a form the field owns the value, so assigning the bound variable does not drive a
// <select> — use `action.fields.<name>.set(...)` for that. An <input> still follows its binding.
// This is asserted so the difference cannot change silently.
test('assigning a bound value drives an input but not a select', async ({ page }) => {
	await page.getByTestId('os').selectOption('css')

	await page.getByTestId('set-text').click()
	await expect(page.getByTestId('text')).toHaveValue('set by hand')

	await page.getByTestId('set-os').click()
	await expect(page.getByTestId('os')).toHaveValue('css')
})

test('clears stale issues once the form is corrected', async ({ page }) => {
	await page.getByTestId('plan-free').check()

	await page.getByTestId('text').fill('x')
	await page.getByRole('button', { name: 'Submit' }).click()
	await expect(page.getByTestId('issues')).toBeVisible()

	await page.getByTestId('text').fill('long enough')
	await page.getByRole('button', { name: 'Submit' }).click()

	await expect(page.getByTestId('result')).toBeVisible()
	await expect(page.getByTestId('issues')).toHaveCount(0)
	await expect(page.getByTestId('text')).not.toHaveAttribute('aria-invalid')
})
