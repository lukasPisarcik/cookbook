import type { HandleClientError } from '@sveltejs/kit';
import { themeStore, langStore } from '$lib/stores';

// Initialize stores on client load
themeStore.init();
langStore.init();

/**
 * Client-side error handler for unexpected errors.
 *
 * Catches unhandled errors in the browser and provides
 * consistent error structure for the error page.
 */
export const handleError: HandleClientError = ({ error, status, message }) => {
	const errorId = crypto.randomUUID();

	console.error('[Client Error]', {
		errorId,
		status,
		message,
		error
	});

	return {
		message: status >= 500 ? 'An unexpected error occurred' : message,
		code: 'CLIENT_ERROR',
		id: errorId
	};
};
