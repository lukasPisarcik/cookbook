import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import IngredientTile from './IngredientTile.svelte';

describe('IngredientTile.svelte', () => {
	it('renders the emoji mapped from the ingredient name', async () => {
		const screen = render(IngredientTile, {
			props: { name: 'cesnak', productType: 'zelenina' }
		});
		expect(screen.container.textContent).toContain('🧄');
	});

	it('tints the tile from the product type', async () => {
		const screen = render(IngredientTile, {
			props: { name: 'cesnak', productType: 'zelenina' }
		});
		expect(screen.container.querySelector('.bg-emerald-100')).not.toBeNull();
	});

	it('applies the requested size class', async () => {
		const small = render(IngredientTile, {
			props: { name: 'cesnak', productType: 'zelenina', size: 'sm' as const }
		});
		expect(small.container.querySelector('.size-8')).not.toBeNull();

		const large = render(IngredientTile, {
			props: { name: 'cesnak', productType: 'zelenina', size: 'lg' as const }
		});
		expect(large.container.querySelector('.size-16')).not.toBeNull();
	});

	it('defaults to the md size', async () => {
		const screen = render(IngredientTile, {
			props: { name: 'cesnak', productType: 'zelenina' }
		});
		expect(screen.container.querySelector('.size-11')).not.toBeNull();
	});

	it('hides the emoji from assistive tech (the name is already text)', async () => {
		const screen = render(IngredientTile, {
			props: { name: 'cesnak', productType: 'zelenina' }
		});
		const emoji = screen.container.querySelector('[aria-hidden="true"]');
		expect(emoji).not.toBeNull();
		expect(emoji?.textContent).toBe('🧄');
	});

	it('still renders a tile for an unmatched name and unknown type', async () => {
		const screen = render(IngredientTile, {
			props: { name: 'niečo úplne neznáme', productType: 'nejaká nová kategória' }
		});
		expect(screen.container.textContent?.trim()).not.toBe('');
	});
});
