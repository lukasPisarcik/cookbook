import { describe, expect, it } from 'vitest';

import {
	configurationError,
	createHttpError,
	internalError,
	notFoundError,
	validationError
} from './errors';

type HttpErrorLike = {
	status?: number;
	body?: {
		message?: string;
		code?: string;
		id?: string;
	};
};

function getThrownHttpError(fn: () => never): HttpErrorLike {
	try {
		fn();
		throw new Error('Expected helper to throw');
	} catch (error) {
		return error as HttpErrorLike;
	}
}

describe('server error helpers', () => {
	it('throws sveltekit error payload for 4xx responses', () => {
		const error = getThrownHttpError(() =>
			createHttpError(404, 'Meeting not found', 'NOT_FOUND', { groupId: 'group-1' })
		);

		expect(error.status).toBe(404);
		expect(error.body).toMatchObject({
			message: 'Meeting not found',
			code: 'NOT_FOUND'
		});
		expect(typeof error.body?.id).toBe('string');
		expect(error.body?.id?.length).toBeGreaterThan(0);
	});

	it('throws sveltekit error payload for 5xx responses', () => {
		const error = getThrownHttpError(() => internalError('Unexpected failure'));

		expect(error.status).toBe(500);
		expect(error.body).toMatchObject({
			message: 'Unexpected failure',
			code: 'INTERNAL_ERROR'
		});
	});

	it('exposes convenience wrappers with expected status/code pairs', () => {
		const notFound = getThrownHttpError(() => notFoundError('Missing'));
		expect(notFound.status).toBe(404);
		expect(notFound.body).toMatchObject({ code: 'NOT_FOUND' });

		const validation = getThrownHttpError(() => validationError('Invalid input'));
		expect(validation.status).toBe(400);
		expect(validation.body).toMatchObject({ code: 'VALIDATION_ERROR' });

		const configuration = getThrownHttpError(() => configurationError('Missing env'));
		expect(configuration.status).toBe(500);
		expect(configuration.body).toMatchObject({ code: 'CONFIGURATION_ERROR' });
	});
});
