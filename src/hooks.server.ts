import type { HandleServerError } from '@sveltejs/kit';
import { log } from '$lib';

/**
 * Server-side error handler for unexpected errors.
 *
 * This hook catches errors that bypass the normal error handling flow
 * (e.g., unhandled exceptions, runtime crashes). Errors thrown via
 * createHttpError() already have proper IDs and logging.
 */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	const errorDetails = {
		errorId,
		status,
		message,
		url: event.url.pathname,
		method: event.request.method
	};

	if (error instanceof Error) {
		log.error({ ...errorDetails, stack: error.stack, name: error.name }, error.message);
	} else {
		log.error(errorDetails, 'Unexpected server error');
	}

	return {
		message: status >= 500 ? 'An unexpected error occurred' : message,
		code: 'UNEXPECTED_ERROR',
		id: errorId
	};
};
