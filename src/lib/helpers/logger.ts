import { browser, dev } from '$app/environment';
import pino from 'pino';

export const log = browser
	? {
			info: (...args: unknown[]) => console.info('[client]:', ...args),
			warn: (...args: unknown[]) => console.warn('[client]:', ...args),
			error: (...args: unknown[]) => console.error('[client]:', ...args),
			debug: (...args: unknown[]) => console.debug('[client]:', ...args)
		}
	: pino({
			level: 'info',
			// TODO: pino transport for monitoring of deployed instances
			...(dev
				? {
						transport: {
							target: 'pino-pretty',
							options: { colorize: true }
						}
					}
				: {})
		});
