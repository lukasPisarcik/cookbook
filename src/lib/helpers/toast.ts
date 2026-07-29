import { toast as sonnerToast, type ExternalToast } from 'svelte-sonner';
import { type ToastVariant } from '$lib/schemas';

export type ToastOptions = ExternalToast & {
	variant?: ToastVariant;
};

/**
 * Toast service for displaying notifications throughout the app.
 *
 * @example
 * // Simple usage
 * toast.success('Changes saved!');
 * toast.error('Something went wrong');
 *
 * // With options
 * toast.info('New message', { description: 'You have 3 unread messages' });
 *
 * // With action
 * toast.success('Email sent', {
 *   action: { label: 'Undo', onClick: () => undoSend() }
 * });
 */
export const toast = {
	show(message: string, options?: ToastOptions) {
		const { variant = 'default', ...rest } = options ?? {};

		return variant === 'default' ? sonnerToast(message, rest) : sonnerToast[variant](message, rest);
	},

	success(message: string, options?: ExternalToast) {
		return sonnerToast.success(message, options);
	},

	error(message: string, options?: ExternalToast) {
		return sonnerToast.error(message, options);
	},

	warning(message: string, options?: ExternalToast) {
		return sonnerToast.warning(message, options);
	},

	info(message: string, options?: ExternalToast) {
		return sonnerToast.info(message, options);
	},

	loading(message: string, options?: ExternalToast) {
		return sonnerToast.loading(message, options);
	},

	promise<T>(
		promise: Promise<T> | (() => Promise<T>),
		options: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((error: unknown) => string);
		}
	) {
		return sonnerToast.promise(promise, options);
	},

	dismiss(toastId?: string | number) {
		return sonnerToast.dismiss(toastId);
	}
};
