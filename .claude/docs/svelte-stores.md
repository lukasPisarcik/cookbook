# Svelte stores

Applies to: `src/lib/stores/*.svelte.ts`.

## Pattern: class-based stores with runes

This project uses Svelte 5's class + rune pattern instead of legacy `writable()` stores. A store is a class instantiated once and exported:

```ts
// src/lib/stores/themeStore.svelte.ts
import { browser } from '$app/environment';

class ThemeStoreClass {
	current = $state<'light' | 'dark'>('light');

	init(): void {
		if (!browser) return;
		const saved = localStorage.getItem('theme.current');
		if (saved === 'dark' || saved === 'light') this.current = saved;
		this.apply();
	}

	toggle(): void {
		this.current = this.current === 'light' ? 'dark' : 'light';
		this.apply();
		if (browser) localStorage.setItem('theme.current', this.current);
	}

	private apply(): void {
		if (!browser) return;
		document.documentElement.classList.toggle('dark', this.current === 'dark');
	}
}

export const themeStore = new ThemeStoreClass();
```

Components import the singleton and read `themeStore.current` directly — Svelte's reactivity tracks the rune.

## File naming

- `*.svelte.ts` extension — required for files that use runes outside `.svelte` components.
- `<feature>Store.svelte.ts` — camelCase, suffixed `Store`.
- Each store gets a sibling `<feature>Store.test.ts` (server project — runes work in Vitest's Svelte plugin too).

## Don't

- Don't use `writable()` / `readable()` stores from legacy Svelte. Stick to the rune pattern.
- Don't put domain logic in stores — stores hold state and surface getters/setters; domain logic goes in services.
- Don't import multiple stores via `$lib` (the root barrel) on the server side; import from `$lib/stores` to keep browser-only code out of SSR.
