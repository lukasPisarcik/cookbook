import { ZodError } from 'zod';

/**
 * Prettify a ZodError into a readable array of objects
 * @param error - The ZodError instance
 * @param raw - Optional raw object to show actual received values
 * @returns Array of formatted error objects
 */
export function formatZodErrors<T>(error: ZodError<T>) {
	return error.issues.map((issue) => {
		const formatted: {
			path: string;
			expected?: string;
			received?: string;
			message: string;
		} = {
			path: issue.path.join('.') || '(root)',
			message: issue.message
		};

		if ('expected' in issue && typeof issue.expected === 'string') {
			formatted.expected = issue.expected;
		}
		if ('received' in issue && typeof issue.received === 'string') {
			formatted.received = issue.received;
		}

		return formatted;
	});
}
