import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
	it('merges conditional classes and resolves tailwind conflicts', () => {
		const hidden: false | string = false;
		const className = cn('px-2 py-1', hidden && 'hidden', 'px-4', undefined, 'text-sm');
		expect(className).toBe('py-1 px-4 text-sm');
	});

	it('supports object and array style class inputs', () => {
		const className = cn(['rounded', 'border'], { 'font-bold': true, italic: false });
		expect(className).toBe('rounded border font-bold');
	});
});
