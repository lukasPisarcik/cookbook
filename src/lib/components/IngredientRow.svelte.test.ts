import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import IngredientRow from './IngredientRow.svelte';

describe('IngredientRow.svelte', () => {
	it('shows the name, the formatted amount and the product-type chip', async () => {
		const screen = render(IngredientRow, {
			props: { name: 'jazmínová ryža', quantity: 150, unit: 'g', productType: 'cestoviny' }
		});
		expect(screen.container.textContent).toContain('jazmínová ryža');
		expect(screen.container.textContent).toContain('150 g');
		expect(screen.container.textContent).toContain('cestoviny');
	});

	it('renders the ingredient tile', async () => {
		const screen = render(IngredientRow, {
			props: { name: 'cesnak', quantity: 2, unit: 'ks', productType: 'zelenina' }
		});
		expect(screen.container.querySelector('[aria-hidden="true"]')?.textContent).toBe('🧄');
	});

	it('omits the amount when the source gives no quantity', async () => {
		const screen = render(IngredientRow, {
			props: { name: 'soľ', productType: 'korenie' }
		});
		expect(screen.container.textContent).toContain('soľ');
		expect(screen.container.textContent).not.toMatch(/\d/);
	});

	it('shows a bare unit when there is no quantity but a unit', async () => {
		const screen = render(IngredientRow, {
			props: { name: 'soľ', unit: 'podľa chuti', productType: 'korenie' }
		});
		expect(screen.container.textContent).toContain('podľa chuti');
	});

	it('renders a scaled quantity with one decimal', async () => {
		const screen = render(IngredientRow, {
			props: { name: 'mlieko', quantity: 1.5, unit: 'PL', productType: 'mliečné výrobky' }
		});
		expect(screen.container.textContent).toContain('1.5 PL');
	});
});
