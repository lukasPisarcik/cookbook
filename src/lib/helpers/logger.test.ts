import { afterEach, describe, expect, it, vi } from 'vitest';

const pinoMock = vi.hoisted(() => vi.fn(() => ({ mockedPino: true })));

vi.mock('pino', () => ({
	default: pinoMock
}));

describe('logger helper', () => {
	afterEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it('uses console-backed logger when running in browser', async () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

		vi.doMock('$app/environment', () => ({
			browser: true,
			dev: false
		}));

		const { log } = await import('./logger');

		log.info('hello');
		log.warn('careful');
		log.error('boom');
		log.debug('trace');

		expect(infoSpy).toHaveBeenCalledWith('[client]:', 'hello');
		expect(warnSpy).toHaveBeenCalledWith('[client]:', 'careful');
		expect(errorSpy).toHaveBeenCalledWith('[client]:', 'boom');
		expect(debugSpy).toHaveBeenCalledWith('[client]:', 'trace');
		expect(pinoMock).not.toHaveBeenCalled();

		infoSpy.mockRestore();
		warnSpy.mockRestore();
		errorSpy.mockRestore();
		debugSpy.mockRestore();
	});

	it('creates pino logger with pretty transport in dev server mode', async () => {
		vi.doMock('$app/environment', () => ({
			browser: false,
			dev: true
		}));

		await import('./logger');

		expect(pinoMock).toHaveBeenCalledWith({
			level: 'info',
			transport: {
				target: 'pino-pretty',
				options: { colorize: true }
			}
		});
	});

	it('creates pino logger without transport in production server mode', async () => {
		vi.doMock('$app/environment', () => ({
			browser: false,
			dev: false
		}));

		await import('./logger');

		expect(pinoMock).toHaveBeenCalledWith({
			level: 'info'
		});
	});
});
