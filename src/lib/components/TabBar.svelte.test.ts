import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

const mockPage = vi.hoisted(() => ({
	url: new URL('http://localhost/'),
	params: {} as Record<string, string>,
	route: { id: null as string | null },
	status: 200,
	error: null,
	data: {},
	form: null,
	state: {}
}));

vi.mock('$app/state', () => ({
	page: mockPage,
	navigating: null,
	updated: { current: false }
}));

import TabBar from './TabBar.svelte';

describe('TabBar.svelte', () => {
	beforeEach(() => {
		mockPage.url = new URL('http://localhost/');
	});

	it('renders all four tabs', async () => {
		const screen = render(TabBar);
		const links = screen.container.querySelectorAll('a');
		expect(links).toHaveLength(4);
		expect([...links].map((link) => link.getAttribute('href'))).toEqual([
			'/',
			'/dnes',
			'/nakup',
			'/spajza'
		]);
	});

	it('marks the active route with aria-current', async () => {
		mockPage.url = new URL('http://localhost/nakup');
		const screen = render(TabBar);
		const active = screen.container.querySelector('a[aria-current="page"]');
		expect(active?.getAttribute('href')).toBe('/nakup');
	});

	it('keeps the Recepty tab active on recipe detail routes', async () => {
		mockPage.url = new URL('http://localhost/recepty/thajske-kari');
		const screen = render(TabBar);
		const active = screen.container.querySelector('a[aria-current="page"]');
		expect(active?.getAttribute('href')).toBe('/');
	});
});
