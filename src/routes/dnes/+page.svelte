<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d, toast } from '$lib';
	import { Button, Spinner, VariantSwitcher } from '$lib/components';
	import { profileStore } from '$lib/stores';
	import { Minus, Plus, ShoppingCart, Trash2, X } from '@lucide/svelte';

	const token = $derived(page.data.convexToken as string);
	const userId = $derived(profileStore.userId);
	const client = useConvexClient();

	const flagged = useQuery(api.recipes.cookingToday, () => (userId ? { token, userId } : 'skip'));

	let generating = $state(false);

	interface Cooking {
		variantIndex: number;
		portionMultiplier: number;
	}

	/**
	 * Optimistic „Dnes varím" state per slug, so the row reads back instantly
	 * while its mutation is still debounced. Holds *both* fields together: a
	 * pending write must carry the current variant too, or switching variant
	 * mid-debounce would be reverted by the older timer.
	 */
	let pending = $state<Record<string, Cooking>>({});
	/** Deliberately not reactive — a timer registry the template never reads. */
	const pendingTimers: Record<string, ReturnType<typeof setTimeout>> = {};

	/** Long enough to coalesce a held +, short enough to feel immediate. */
	const STEPPER_DEBOUNCE_MS = 300;

	function cookingFor(slug: string, server: Cooking): Cooking {
		return pending[slug] ?? server;
	}

	async function update(slug: string, variantIndex: number, portionMultiplier: number) {
		if (!userId) return;
		await client.mutation(api.recipes.setCookingToday, {
			token,
			userId,
			slug,
			value: { variantIndex, portionMultiplier: Math.max(0.5, portionMultiplier) }
		});
	}

	function clearTimer(slug: string) {
		clearTimeout(pendingTimers[slug]);
		delete pendingTimers[slug];
	}

	/** Forget the optimistic value once its write has landed. */
	function settle(slug: string) {
		const { [slug]: _done, ...rest } = pending;
		pending = rest;
	}

	/**
	 * Holding + used to fire one mutation per tap, and each one invalidated the
	 * `cookingToday` subscription — so every tap also cost a re-read. Coalesce
	 * them: show the new value now, write once the taps stop.
	 */
	function step(slug: string, current: Cooking, portionMultiplier: number) {
		const next: Cooking = {
			variantIndex: current.variantIndex,
			portionMultiplier: Math.max(0.5, portionMultiplier)
		};
		pending = { ...pending, [slug]: next };

		clearTimer(slug);
		pendingTimers[slug] = setTimeout(async () => {
			delete pendingTimers[slug];
			// Read back from `pending` rather than closing over `next`, so a later
			// variant switch inside the window is not overwritten by this timer.
			const value = pending[slug] ?? next;
			try {
				await update(slug, value.variantIndex, value.portionMultiplier);
			} finally {
				settle(slug);
			}
		}, STEPPER_DEBOUNCE_MS);
	}

	/**
	 * Switching variant is a single deliberate tap, so it writes through at once
	 * — carrying any pending multiplier with it and cancelling that timer, so the
	 * two controls can never fight over the row.
	 */
	async function selectVariant(slug: string, current: Cooking, variantIndex: number) {
		const next: Cooking = { variantIndex, portionMultiplier: current.portionMultiplier };
		clearTimer(slug);
		pending = { ...pending, [slug]: next };
		try {
			await update(slug, next.variantIndex, next.portionMultiplier);
		} finally {
			settle(slug);
		}
	}

	/**
	 * Write every still-pending step immediately. Needed before anything that
	 * reads the stored value server-side, and when leaving the page.
	 */
	async function flushPending() {
		const slugs = Object.keys(pendingTimers);
		for (const slug of slugs) {
			clearTimer(slug);
			const value = pending[slug];
			if (!value) continue;
			try {
				await update(slug, value.variantIndex, value.portionMultiplier);
			} finally {
				settle(slug);
			}
		}
	}

	/** Drop any debounced write for these slugs — it would resurrect the row. */
	function cancelPending(slugs: string[]) {
		for (const slug of slugs) clearTimer(slug);
		pending = Object.fromEntries(Object.entries(pending).filter(([slug]) => !slugs.includes(slug)));
	}

	// Navigating away inside the debounce window would otherwise drop the step.
	// Not awaited (teardown cannot be async) — the client still sends it, since
	// an in-app navigation keeps the Convex socket open.
	onDestroy(() => {
		void flushPending();
	});

	async function remove(slug: string) {
		if (!userId) return;
		cancelPending([slug]);
		await client.mutation(api.recipes.setCookingToday, { token, userId, slug, value: null });
	}

	async function clearAll() {
		if (!userId) return;
		cancelPending(Object.keys(pendingTimers));
		await client.mutation(api.recipes.clearCookingToday, { token, userId });
	}

	async function generate() {
		if (!userId) return;
		generating = true;
		try {
			// The shopping list scales quantities by the stored multiplier, so a
			// still-debounced step has to land before we aggregate — otherwise
			// generating right after tapping + would use the previous value.
			await flushPending();
			await client.mutation(api.shopping.regenerate, { token, userId });
			toast.success(d.dnesGenerated);
			await goto(resolve('/nakup'));
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>{d.tabDnes} · {d.appTitle}</title>
</svelte:head>

{#if flagged.isLoading}
	<div class="flex justify-center py-16"><Spinner /></div>
{:else if (flagged.data ?? []).length === 0}
	<div class="space-y-2 py-16 text-center">
		<p class="font-display text-base font-bold">{d.dnesEmpty}</p>
		<p class="mx-auto max-w-xs text-sm text-muted-foreground">{d.dnesEmptyHint}</p>
	</div>
{:else}
	<div class="space-y-3">
		{#each flagged.data ?? [] as recipe (recipe.slug)}
			{@const cooking = cookingFor(recipe.slug, recipe.cookingToday)}
			<div class="flex gap-3 rounded-2xl bg-card p-3 shadow-sm">
				<a
					href={resolve('/recepty/[slug]', { slug: recipe.slug })}
					class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted"
				>
					{#if recipe.imageUrl}
						<img src={recipe.imageUrl} alt={recipe.title} class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center text-xl">🥗</div>
					{/if}
				</a>
				<div class="min-w-0 flex-1 space-y-2">
					<div class="flex items-start justify-between gap-2">
						<a
							href={resolve('/recepty/[slug]', { slug: recipe.slug })}
							class="font-display text-sm leading-snug font-bold"
						>
							{recipe.title}
						</a>
						<button
							type="button"
							onclick={() => remove(recipe.slug)}
							aria-label={d.removeLabel}
							class="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
						>
							<X class="h-4 w-4" />
						</button>
					</div>

					<VariantSwitcher
						labels={recipe.variants.map((variant) => variant.label)}
						selected={cooking.variantIndex}
						onSelect={(index) => selectVariant(recipe.slug, cooking, index)}
					/>

					<div class="flex items-center gap-2 text-sm">
						<span class="text-xs text-muted-foreground">{d.portionsMultiplierLabel}</span>
						<button
							type="button"
							aria-label="−"
							onclick={() => step(recipe.slug, cooking, cooking.portionMultiplier - 0.5)}
							class="rounded-full bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20"
						>
							<Minus class="h-3.5 w-3.5" />
						</button>
						<span class="w-8 text-center font-display font-bold tabular-nums">
							{cooking.portionMultiplier}
						</span>
						<button
							type="button"
							aria-label="+"
							onclick={() => step(recipe.slug, cooking, cooking.portionMultiplier + 0.5)}
							class="rounded-full bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20"
						>
							<Plus class="h-3.5 w-3.5" />
						</button>
					</div>
				</div>
			</div>
		{/each}

		<div class="space-y-2 pt-2">
			<Button
				class="w-full rounded-full shadow-lg"
				size="lg"
				onclick={generate}
				disabled={generating}
			>
				<ShoppingCart class="mr-2 h-5 w-5" />
				{d.dnesGenerate}
			</Button>
			<Button variant="ghost" class="w-full text-muted-foreground" onclick={clearAll}>
				<Trash2 class="mr-2 h-4 w-4" />
				{d.dnesClearAll}
			</Button>
		</div>
	</div>
{/if}
