import { expect, test } from '@playwright/test'

// Inputs used without a <Form> ancestor have no form context to read from, so they must degrade to
// plain elements rather than throwing or dropping props.
test.beforeEach(async ({ page }) => {
	await page.goto('/tests/standalone')
})

test('keeps bindings working with no form context', async ({ page }) => {
	const text = page.locator('input[name="text"]')
	await expect(text).toHaveValue('hello')
	await expect(page.getByTestId('text')).toHaveText('hello')

	await text.fill('typed')
	await expect(page.getByTestId('text')).toHaveText('typed')

	await page.locator('input[name="agree"]').check()
	await expect(page.getByTestId('agree')).toHaveText('true')

	await page.locator('select[name="plan"]').selectOption('pro')
	await expect(page.getByTestId('plan')).toHaveText('pro')
})

test('forwards defaultValue and ref', async ({ page }) => {
	await expect(page.getByTestId('ref')).toHaveText('INPUT')

	const text = page.locator('input[name="text"]')
	await text.fill('edited')
	// defaultValue is a real attribute on the element, so a native reset would use it
	await expect(text).toHaveAttribute('value', 'original')
})

test('claims no validation state and no field naming of its own', async ({ page }) => {
	const text = page.locator('input[name="text"]')
	await expect(text).not.toHaveAttribute('aria-invalid')
	// the `n:`/`b:` prefixes only come from a form field, so plain names stay plain
	await expect(page.locator('input[name="agree"]')).toHaveCount(1)
	await expect(page.locator('select[name="langs"]')).toHaveAttribute('multiple', '')
})

// Regression: the fallback branch used to omit `type` entirely, relying on the form field to supply
// it. With no form context that left `password`/`number`/`email` rendering as plain text inputs.
test('keeps the declared input type with no form context', async ({ page }) => {
	await expect(page.getByTestId('sa-pw')).toHaveAttribute('type', 'password')
	await expect(page.getByTestId('sa-num')).toHaveAttribute('type', 'number')
	await expect(page.getByTestId('sa-mail')).toHaveAttribute('type', 'email')
})

// Regression: `defaultValue` was destructured and then dropped, so a standalone <Select> fell back
// to the browser's first option.
test('applies a select defaultValue, and reverts to it on reset', async ({ page }) => {
	const tier = page.getByTestId('sa-tier')
	await expect(tier).toHaveValue('gold')

	await tier.selectOption('bronze')
	await expect(tier).toHaveValue('bronze')

	// the default lives on the <option>'s `selected` attribute, so a native reset restores it
	await page.getByRole('button', { name: 'Reset' }).click()
	await expect(tier).toHaveValue('gold')
})
