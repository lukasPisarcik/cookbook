<script lang="ts">
	import { page } from '$app/state';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d, normalizeName, toast } from '$lib';
	import { IngredientTile, Input, Spinner } from '$lib/components';
	import { profileStore } from '$lib/stores';
	import { Search, X } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	const token = $derived(page.data.convexToken as string);
	const userId = $derived(profileStore.userId);
	const client = useConvexClient();

	const pantry = useQuery(api.pantry.list, () => (userId ? { token, userId } : 'skip'));
	const known = useQuery(api.pantry.knownIngredients, () => ({ token }));
	const frequent = useQuery(api.pantry.frequentIngredients, () => ({ token }));

	type PantryItem = NonNullable<typeof pantry.data>[number];

	let search = $state('');
	let busy = $state(false);

	const ownedNorms = $derived(new Set((pantry.data ?? []).map((item) => item.nameNorm)));

	const suggestions = $derived.by(() => {
		const query = normalizeName(search);
		if (query.length < 2) return [];
		return (known.data ?? [])
			.filter((entry) => entry.nameNorm.includes(query) && !ownedNorms.has(entry.nameNorm))
			.slice(0, 8);
	});

	async function add(name: string, productType?: string) {
		const trimmed = name.trim();
		if (trimmed === '' || busy || !userId) return;
		busy = true;
		try {
			await client.mutation(api.pantry.add, { token, userId, name: trimmed, productType });
			search = '';
		} finally {
			busy = false;
		}
	}

	/**
	 * Tap-to-remove with no confirmation would be destructive-by-accident on a
	 * phone, so the toast carries an „Vrátiť" action that re-adds the item —
	 * cheaper and less annoying than a dialog.
	 */
	async function remove(item: PantryItem) {
		if (!userId) return;
		await client.mutation(api.pantry.remove, { token, userId, id: item._id });
		toast.success(d.spajzaRemoved, {
			description: item.name,
			action: { label: d.spajzaUndo, onClick: () => add(item.name, item.productType) }
		});
	}
</script>

<svelte:head>
	<title>{d.tabSpajza} · {d.appTitle}</title>
</svelte:head>

<div class="space-y-6">
	<form
		class="space-y-2"
		onsubmit={(event) => {
			event.preventDefault();
			add(search);
		}}
	>
		<div class="relative">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder={d.spajzaPlaceholder}
				bind:value={search}
				autocomplete="off"
				class="rounded-full border-transparent bg-card pl-9 shadow-sm"
			/>
		</div>
	</form>

	{#if suggestions.length > 0}
		<section class="space-y-2">
			<h3
				class="font-display text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
			>
				{d.spajzaSearchResults}
			</h3>
			<div class="grid grid-cols-4 gap-2">
				{#each suggestions as entry (entry.nameNorm)}
					<button
						type="button"
						onclick={() => add(entry.name, entry.productType)}
						class="flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-colors hover:bg-accent"
					>
						<IngredientTile name={entry.name} productType={entry.productType} size="lg" />
						<span class="line-clamp-2 text-center text-[11px] leading-tight">{entry.name}</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	{#if pantry.isLoading}
		<div class="flex justify-center py-16"><Spinner /></div>
	{:else}
		<section class="space-y-2">
			<h3
				class="font-display text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
			>
				{d.spajzaMamDoma} · {(pantry.data ?? []).length}
			</h3>
			{#if (pantry.data ?? []).length === 0}
				<p class="mx-auto max-w-xs py-8 text-center text-sm text-muted-foreground">
					{d.spajzaEmpty}
				</p>
			{:else}
				<div class="grid grid-cols-4 gap-2" data-testid="spajza-grid">
					{#each pantry.data ?? [] as item (item._id)}
						<button
							type="button"
							onclick={() => remove(item)}
							aria-label={`${d.removeLabel} — ${item.name}`}
							class="group relative flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-colors hover:bg-accent"
						>
							<IngredientTile name={item.name} productType={item.productType} size="lg" />
							<span
								class="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-card text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
							>
								<X class="h-3 w-3" />
							</span>
							<span class="line-clamp-2 text-center text-[11px] leading-tight">{item.name}</span>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		{#if (frequent.data ?? []).length > 0}
			<section class="space-y-2">
				<h3
					class="font-display text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
				>
					{d.spajzaFrequent}
				</h3>
				<p class="text-xs text-muted-foreground">{d.spajzaFrequentHint}</p>
				<div class="grid grid-cols-4 gap-2" data-testid="spajza-frequent">
					{#each frequent.data ?? [] as entry (entry.nameNorm)}
						{@const owned = ownedNorms.has(entry.nameNorm)}
						<button
							type="button"
							disabled={owned}
							aria-disabled={owned}
							aria-label={owned ? `${entry.name} — ${d.spajzaAlreadyOwned}` : entry.name}
							onclick={() => add(entry.name, entry.productType)}
							class={cn(
								'flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-colors',
								owned ? 'cursor-default opacity-40' : 'hover:bg-accent'
							)}
						>
							<IngredientTile name={entry.name} productType={entry.productType} size="lg" />
							<span class="line-clamp-2 text-center text-[11px] leading-tight">{entry.name}</span>
						</button>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>
