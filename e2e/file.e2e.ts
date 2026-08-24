import { expect, test } from '@playwright/test'

test('uploads a file and keeps the files binding in sync', async ({ page }) => {
	await page.goto('/tests/file')

	await page.getByTestId('doc').setInputFiles({
		name: 'note.txt',
		mimeType: 'text/plain',
		buffer: Buffer.from('hello from a file'),
	})

	// `bind:files` has to survive the props spread from the form field
	await expect(page.getByTestId('picked')).toHaveText('note.txt')

	await page.getByRole('button', { name: 'Upload' }).click()

	await expect(page.getByTestId('result')).toHaveText('note.txt|17|hello from a file')
})
