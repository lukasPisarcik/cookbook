/**
 * Error Page Metadata Helpers
 *
 * Provides structured metadata for displaying user-friendly error pages.
 * Used by +error.svelte to show appropriate content based on error status.
 */

import { type ErrorCategory, type ErrorMetadata } from '$lib/schemas';

/**
 * Get error category from HTTP status code
 */
export function getErrorCategory(status: number): ErrorCategory {
	if (status === 401) return 'auth';
	if (status === 403) return 'forbidden';
	if (status === 404) return 'not_found';
	if (status >= 400 && status < 500) return 'validation';
	if (status >= 500) return 'server';
	return 'unknown';
}

/**
 * Get error metadata based on HTTP status code.
 * Returns dictionary keys and UI configuration for the error page.
 */
export function getErrorMetadata(status: number): ErrorMetadata {
	const category = getErrorCategory(status);

	switch (category) {
		case 'auth':
			return {
				category,
				titleKey: 'errorPageAuthTitle',
				descriptionKey: 'errorPageAuthDescription',
				whatHappenedKey: 'errorPageAuthWhatHappened',
				whatToDoKey: 'errorPageAuthWhatToDo',
				showRetry: true,
				showHome: true,
				showSupport: true
			};

		case 'forbidden':
			return {
				category,
				titleKey: 'errorPageForbiddenTitle',
				descriptionKey: 'errorPageForbiddenDescription',
				whatHappenedKey: 'errorPageForbiddenWhatHappened',
				whatToDoKey: 'errorPageForbiddenWhatToDo',
				showRetry: false,
				showHome: true,
				showSupport: true
			};

		case 'not_found':
			return {
				category,
				titleKey: 'errorPageNotFoundTitle',
				descriptionKey: 'errorPageNotFoundDescription',
				whatHappenedKey: 'errorPageNotFoundWhatHappened',
				whatToDoKey: 'errorPageNotFoundWhatToDo',
				showRetry: false,
				showHome: true,
				showSupport: false
			};

		case 'validation':
			return {
				category,
				titleKey: 'errorPageValidationTitle',
				descriptionKey: 'errorPageValidationDescription',
				whatHappenedKey: 'errorPageValidationWhatHappened',
				whatToDoKey: 'errorPageValidationWhatToDo',
				showRetry: true,
				showHome: true,
				showSupport: true
			};

		case 'server':
			return {
				category,
				titleKey: 'errorPageServerTitle',
				descriptionKey: 'errorPageServerDescription',
				whatHappenedKey: 'errorPageServerWhatHappened',
				whatToDoKey: 'errorPageServerWhatToDo',
				showRetry: true,
				showHome: true,
				showSupport: true
			};

		default:
			return {
				category: 'unknown',
				titleKey: 'errorPageUnknownTitle',
				descriptionKey: 'errorPageUnknownDescription',
				whatHappenedKey: 'errorPageUnknownWhatHappened',
				whatToDoKey: 'errorPageUnknownWhatToDo',
				showRetry: true,
				showHome: true,
				showSupport: true
			};
	}
}

/**
 * Get a human-readable status text for the error code
 */
export function getStatusText(status: number): string {
	const statusTexts: Record<number, string> = {
		400: 'Bad Request',
		401: 'Unauthorized',
		403: 'Forbidden',
		404: 'Not Found',
		405: 'Method Not Allowed',
		408: 'Request Timeout',
		409: 'Conflict',
		410: 'Gone',
		422: 'Unprocessable Entity',
		429: 'Too Many Requests',
		500: 'Internal Server Error',
		502: 'Bad Gateway',
		503: 'Service Unavailable',
		504: 'Gateway Timeout'
	};

	return statusTexts[status] || 'Error';
}
