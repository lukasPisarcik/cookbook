import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import VariantSwitcher from './VariantSwitcher.svelte';

describe('VariantSwitcher.svelte', () => {
	it('renders nothing for a single variant', async () => {
		const screen = render(VariantSwitcher, {
			props: { labels: ['štandard'], selected: 0, onSelect: () => {} }
		});
		expect(screen.container.querySelector('[data-testid="variant-switcher"]')).toBeNull();
	});

	it('renders a tab per variant and marks the selected one', async () => {
		const screen = render(VariantSwitcher, {
			props: { labels: ['400 kcal', '500 kcal', '600 kcal'], selected: 1, onSelect: () => {} }
		});
		const tabs = screen.container.querySelectorAll('[role="tab"]');
		expect(tabs).toHaveLength(3);
		expect(tabs[1].getAttribute('aria-selected')).toBe('true');
	});

	it('emits the tapped variant index', async () => {
		const onSelect = vi.fn();
		const screen = render(VariantSwitcher, {
			props: { labels: ['400 kcal', '500 kcal', '600 kcal'], selected: 0, onSelect }
		});
		await screen.getByRole('tab', { name: '600 kcal' }).click();
		expect(onSelect).toHaveBeenCalledWith(2);
	});
});
