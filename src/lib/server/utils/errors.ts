import { error } from '@sveltejs/kit';
import { log } from '$lib';

/**
 * Error codes for API responses
 */
export type ErrorCode =
	| 'NOT_FOUND'
	| 'VALIDATION_ERROR'
	| 'CONFIGURATION_ERROR'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'CONFLICT'
	| 'INTERNAL_ERROR'
	| 'RECORDING_ERROR';

/**
 * Create a standardized HTTP error with logging
 *
 * Generates a unique error ID, logs the error with context, and throws
 * a SvelteKit error with consistent structure.
 *
 * @param status - HTTP status code
 * @param message - Error message for the response
 * @param code - Error code for programmatic handling
 * @param context - Additional context for logging (not included in response)
 * @returns Never returns - always throws
 *
 * @example
 * ```ts
 * // In a load function or action
 * const meeting = await meetingService.getByRoomId(roomId);
 * if (!meeting) {
 *   createHttpError(404, 'Meeting not found', 'NOT_FOUND', { roomId });
 * }
 * ```
 */
export function createHttpError(
	status: number,
	message: string,
	code: ErrorCode,
	context?: Record<string, unknown>
): never {
	const errorId = crypto.randomUUID();

	// Log with context for debugging
	const logLevel = status >= 500 ? 'error' : 'warn';
	log[logLevel]({ errorId, ...context }, message);

	// Throw SvelteKit error with consistent structure
	error(status, {
		message,
		code,
		id: errorId
	});
}

/**
 * Create a 404 Not Found error
 */
export function notFoundError(message: string, context?: Record<string, unknown>): never {
	return createHttpError(404, message, 'NOT_FOUND', context);
}

/**
 * Create a 400 Bad Request error for validation failures
 */
export function validationError(message: string, context?: Record<string, unknown>): never {
	return createHttpError(400, message, 'VALIDATION_ERROR', context);
}

/**
 * Create a 500 Internal Server Error
 */
export function internalError(message: string, context?: Record<string, unknown>): never {
	return createHttpError(500, message, 'INTERNAL_ERROR', context);
}

/**
 * Create a 500 Configuration Error (for missing env vars, etc.)
 */
export function configurationError(message: string, context?: Record<string, unknown>): never {
	return createHttpError(500, message, 'CONFIGURATION_ERROR', context);
}
