import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sonnerCalls } = vi.hoisted(() => ({
	sonnerCalls: {
		base: [] as Array<{ message: string; options?: unknown }>,
		success: [] as Array<{ message: string; options?: unknown }>,
		error: [] as Array<{ message: string; options?: unknown }>,
		warning: [] as Array<{ message: string; options?: unknown }>,
		info: [] as Array<{ message: string; options?: unknown }>,
		loading: [] as Array<{ message: string; options?: unknown }>,
		promise: [] as Array<{ promise: unknown; options: unknown }>,
		dismiss: [] as Array<{ toastId: string | number | undefined }>
	}
}));

function resetSonnerCalls(): void {
	sonnerCalls.base = [];
	sonnerCalls.success = [];
	sonnerCalls.error = [];
	sonnerCalls.warning = [];
	sonnerCalls.info = [];
	sonnerCalls.loading = [];
	sonnerCalls.promise = [];
	sonnerCalls.dismiss = [];
}

vi.mock('svelte-sonner', () => {
	const mockedToast = ((message: string, options?: unknown) => {
		sonnerCalls.base.push({ message, options });
		return 'base-toast-id';
	}) as unknown as {
		(message: string, options?: unknown): string;
		success: (message: string, options?: unknown) => string;
		error: (message: string, options?: unknown) => string;
		warning: (message: string, options?: unknown) => string;
		info: (message: string, options?: unknown) => string;
		loading: (message: string, options?: unknown) => string;
		promise: <T>(promise: Promise<T> | (() => Promise<T>), options: unknown) => string;
		dismiss: (toastId?: string | number) => boolean;
	};

	mockedToast.success = (message: string, options?: unknown) => {
		sonnerCalls.success.push({ message, options });
		return 'success-toast-id';
	};
	mockedToast.error = (message: string, options?: unknown) => {
		sonnerCalls.error.push({ message, options });
		return 'error-toast-id';
	};
	mockedToast.warning = (message: string, options?: unknown) => {
		sonnerCalls.warning.push({ message, options });
		return 'warning-toast-id';
	};
	mockedToast.info = (message: string, options?: unknown) => {
		sonnerCalls.info.push({ message, options });
		return 'info-toast-id';
	};
	mockedToast.loading = (message: string, options?: unknown) => {
		sonnerCalls.loading.push({ message, options });
		return 'loading-toast-id';
	};
	mockedToast.promise = <T>(promise: Promise<T> | (() => Promise<T>), options: unknown) => {
		sonnerCalls.promise.push({ promise, options });
		return 'promise-toast-id';
	};
	mockedToast.dismiss = (toastId?: string | number) => {
		sonnerCalls.dismiss.push({ toastId });
		return true;
	};

	return { toast: mockedToast };
});

import { toast } from './toast';

describe('toast helper', () => {
	beforeEach(() => {
		resetSonnerCalls();
	});

	it('uses default sonner toast when variant is omitted', () => {
		const result = toast.show('Hello', { description: 'World' });

		expect(result).toBe('base-toast-id');
		expect(sonnerCalls.base).toEqual([{ message: 'Hello', options: { description: 'World' } }]);
	});

	it('uses default sonner toast when options are omitted entirely', () => {
		const result = toast.show('Bare message');

		expect(result).toBe('base-toast-id');
		expect(sonnerCalls.base).toEqual([{ message: 'Bare message', options: {} }]);
	});

	it('uses default sonner toast when variant is "default"', () => {
		const result = toast.show('Hi', { variant: 'default', duration: 1000 });

		expect(result).toBe('base-toast-id');
		expect(sonnerCalls.base).toEqual([{ message: 'Hi', options: { duration: 1000 } }]);
	});

	it('routes non-default variants to the matching sonner method', () => {
		const result = toast.show('Saved', { variant: 'success', closeButton: true });

		expect(result).toBe('success-toast-id');
		expect(sonnerCalls.success).toEqual([{ message: 'Saved', options: { closeButton: true } }]);
	});

	it('forwards shorthand methods to sonner', () => {
		expect(toast.error('Oops')).toBe('error-toast-id');
		expect(toast.warning('Careful')).toBe('warning-toast-id');
		expect(toast.info('FYI')).toBe('info-toast-id');
		expect(toast.loading('Loading')).toBe('loading-toast-id');
		expect(toast.success('Done')).toBe('success-toast-id');
	});

	it('forwards promise and dismiss helpers', async () => {
		const promiseFactory = async () => 'ok';
		const options = {
			loading: 'Saving',
			success: (value: string) => `Saved ${value}`,
			error: () => 'Failed'
		};

		expect(toast.promise(promiseFactory, options)).toBe('promise-toast-id');
		expect(toast.dismiss(123)).toBe(true);
		expect(toast.dismiss()).toBe(true);
		expect(sonnerCalls.promise[0]).toEqual({ promise: promiseFactory, options });
		expect(sonnerCalls.dismiss).toEqual([{ toastId: 123 }, { toastId: undefined }]);
	});
});
