import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { log } from '$lib';
import { isValidSessionToken, SESSION_COOKIE } from '$lib/server/utils/session';

/**
 * Shared-password gate: every route except /login requires a valid
 * session cookie. The cookie is an HMAC of a fixed payload keyed by
 * APP_PASSWORD, so changing the password invalidates all sessions.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const authed = await isValidSessionToken(event.cookies.get(SESSION_COOKIE));
	event.locals.authed = authed;

	const isLoginRoute = pathname === '/login';
	if (!authed && !isLoginRoute) {
		redirect(303, '/login');
	}
	if (authed && isLoginRoute) {
		redirect(303, '/');
	}

	return resolve(event);
};

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
