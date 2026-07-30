import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

vi.mock('$app/paths', () => ({
	base: '',
	assets: '',
	resolve: (id: string, params: Record<string, string> = {}) =>
		id.replace(/\[(\w+)\]/g, (_, key: string) => params[key] ?? `[${key}]`),
	asset: (file: string) => file
}));

import RecipeCard from './RecipeCard.svelte';

const baseProps = {
	slug: 'thajske-kari',
	title: 'Thajské kari',
	imageUrl: null,
	kcalOptions: [391, 493, 589],
	isFavorite: false,
	prepTimeMinutes: 25
};

describe('RecipeCard.svelte', () => {
	it('renders the title and kcal options', async () => {
		const screen = render(RecipeCard, { props: baseProps });
		await expect.element(screen.getByText('Thajské kari')).toBeVisible();
		await expect.element(screen.getByText('391 / 493 / 589 kcal')).toBeVisible();
	});

	it('renders the prep-time meta when provided', async () => {
		const screen = render(RecipeCard, { props: baseProps });
		await expect.element(screen.getByText('Thajské kari')).toBeVisible();
		expect(screen.container.textContent).toContain('25');
		expect(screen.container.textContent).toContain('min');
	});

	it('omits the prep-time meta when absent but keeps kcal', async () => {
		const screen = render(RecipeCard, {
			props: { ...baseProps, prepTimeMinutes: undefined }
		});
		await expect.element(screen.getByText('391 / 493 / 589 kcal')).toBeVisible();
		expect(screen.container.textContent).not.toContain('min');
	});

	it('links to the recipe detail', async () => {
		const screen = render(RecipeCard, { props: baseProps });
		expect(screen.container.querySelector('a')?.getAttribute('href')).toBe('/recepty/thajske-kari');
	});

	it('shows the favorite indicator only when favorited', async () => {
		const screen = render(RecipeCard, { props: { ...baseProps, isFavorite: true } });
		await expect.element(screen.getByTestId('favorite-indicator')).toBeInTheDocument();

		const plain = render(RecipeCard, { props: baseProps });
		expect(plain.container.querySelector('[data-testid="favorite-indicator"]')).toBeNull();
	});
});
