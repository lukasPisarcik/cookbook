import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HomePage from './+page.svelte';

describe('home +page.svelte', () => {
	it('renders the application title', async () => {
		const screen = render(HomePage);
		await expect.element(screen.getByRole('heading', { level: 1 })).toBeVisible();
	});
});
