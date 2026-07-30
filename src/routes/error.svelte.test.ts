/**
 * Browser component tests for `src/routes/+error.svelte`.
 *
 * The error page derives its content purely from `page.status` and
 * `page.error`, so we expose a mutable page object and mutate it
 * before each scenario.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

type PageError = { id?: string; code?: string; message?: string } | null;

interface MockPage {
	url: URL;
	params: Record<string, string>;
	route: { id: string | null };
	status: number;
	error: PageError;
	data: Record<string, unknown>;
	form: unknown;
	state: Record<string, unknown>;
}

const mockPage = vi.hoisted<MockPage>(() => ({
	url: new URL('http://localhost/'),
	params: {},
	route: { id: null },
	status: 500,
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

import { langStore } from '$lib/stores';
import ErrorPage from './+error.svelte';

function setPage(status: number, error: PageError) {
	mockPage.status = status;
	mockPage.error = error;
}

describe('+error.svelte', () => {
	beforeEach(() => {
		langStore.set('en_us');
		setPage(500, null);
	});

	it('renders a 401 auth error with retry action', async () => {
		setPage(401, {
			id: 'err-1',
			code: 'session_required',
			message: 'session_required'
		});

		const screen = render(ErrorPage);

		await expect.element(screen.getByText('401')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /try again/i })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: /go home/i })).toBeVisible();
	});

	it('renders a 404 not-found error without a retry action', async () => {
		setPage(404, { id: 'err-2', code: 'not_found', message: 'not_found' });

		const screen = render(ErrorPage);

		await expect.element(screen.getByText('404')).toBeVisible();
		await expect.element(screen.getByRole('link', { name: /go home/i })).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: /try again/i }))
			.not.toBeInTheDocument();
	});

	it('renders a 500 server error with a retry action', async () => {
		setPage(500, { id: 'err-3', code: 'unknown', message: 'unknown' });

		const screen = render(ErrorPage);

		await expect.element(screen.getByText('500')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /try again/i })).toBeVisible();
	});

	it('shows the error id footer when one is provided', async () => {
		setPage(401, {
			id: 'abc-123',
			code: 'session_required',
			message: 'session_required'
		});

		const screen = render(ErrorPage);

		await expect.element(screen.getByText('abc-123')).toBeVisible();
	});

	it('shows validation metadata for 4xx validation errors', async () => {
		setPage(422, { message: 'validation_failed' });
		const screen = render(ErrorPage);

		await expect.element(screen.getByText('422')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /try again/i })).toBeVisible();
	});

	it('hides the error id footer when no id is provided', async () => {
		setPage(500, { code: 'unknown', message: 'unknown' });
		const screen = render(ErrorPage);

		await expect.element(screen.getByText(/error id/i)).not.toBeInTheDocument();
	});

	it('renders the generic 500 page when page error is null', async () => {
		setPage(500, null);
		const screen = render(ErrorPage);

		await expect.element(screen.getByText('500')).toBeVisible();
	});
});
