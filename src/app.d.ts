// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
/// <reference types="bun" />
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
			id?: string;
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
