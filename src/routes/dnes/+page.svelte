<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d, toast } from '$lib';
	import { Button, Spinner, VariantSwitcher } from '$lib/components';
	import { Minus, Plus, ShoppingCart, Trash2, X } from '@lucide/svelte';

	const token = $derived(page.data.convexToken as string);
	const client = useConvexClient();

	const flagged = useQuery(api.recipes.cookingToday, () => ({ token }));

	let generating = $state(false);

	async function update(slug: string, variantIndex: number, portionMultiplier: number) {
		await client.mutation(api.recipes.setCookingToday, {
			token,
			slug,
			value: { variantIndex, portionMultiplier: Math.max(0.5, portionMultiplier) }
		});
	}

	async function remove(slug: string) {
		await client.mutation(api.recipes.setCookingToday, { token, slug, value: null });
	}

	async function clearAll() {
		await client.mutation(api.recipes.clearCookingToday, { token });
	}

	async function generate() {
		generating = true;
		try {
			await client.mutation(api.shopping.regenerate, { token });
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
						selected={recipe.cookingToday.variantIndex}
						onSelect={(index) => update(recipe.slug, index, recipe.cookingToday.portionMultiplier)}
					/>

					<div class="flex items-center gap-2 text-sm">
						<span class="text-xs text-muted-foreground">{d.portionsMultiplierLabel}</span>
						<button
							type="button"
							aria-label="−"
							onclick={() =>
								update(
									recipe.slug,
									recipe.cookingToday.variantIndex,
									recipe.cookingToday.portionMultiplier - 0.5
								)}
							class="rounded-full bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20"
						>
							<Minus class="h-3.5 w-3.5" />
						</button>
						<span class="w-8 text-center font-display font-bold tabular-nums">
							{recipe.cookingToday.portionMultiplier}
						</span>
						<button
							type="button"
							aria-label="+"
							onclick={() =>
								update(
									recipe.slug,
									recipe.cookingToday.variantIndex,
									recipe.cookingToday.portionMultiplier + 0.5
								)}
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
