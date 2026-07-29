<script lang="ts">
	/**
	 * Generic context wrapper for component tests.
	 *
	 * Wrap the component under test with this component and pass a `Map` of
	 * context keys → values. Useful when the component expects a store or
	 * service provided via `setContext` further up the tree.
	 *
	 * @example
	 * ```ts
	 * render(ContextWrapper, {
	 *   props: {
	 *     contexts: new Map([[MY_STORE_KEY, mockStore]]),
	 *     children: () => MyComponent
	 *   }
	 * });
	 * ```
	 */
	import { setContext, untrack, type Snippet } from 'svelte';

	interface Props {
		contexts?: Map<symbol | string, unknown>;
		children: Snippet;
	}

	let { contexts = new Map(), children }: Props = $props();

	// Register contexts exactly once at component setup. Using `untrack` makes
	// the initial-value read explicit so Svelte's linter doesn't flag it.
	untrack(() => {
		for (const [key, value] of contexts) {
			setContext(key, value);
		}
	});
</script>

{@render children()}
