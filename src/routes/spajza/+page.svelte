<script lang="ts">
	import { page } from '$app/state';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d, groupByProductType, normalizeName } from '$lib';
	import { Button, Input, Spinner } from '$lib/components';
	import { Plus, X } from '@lucide/svelte';

	const token = $derived(page.data.convexToken as string);
	const client = useConvexClient();

	const pantry = useQuery(api.pantry.list, () => ({ token }));
	const known = useQuery(api.pantry.knownIngredients, () => ({ token }));

	let newItem = $state('');
	let adding = $state(false);

	const suggestions = $derived.by(() => {
		const query = normalizeName(newItem);
		if (query.length < 2) return [];
		const inPantry = new Set((pantry.data ?? []).map((item) => item.nameNorm));
		return (known.data ?? [])
			.filter((entry) => entry.nameNorm.includes(query) && !inPantry.has(entry.nameNorm))
			.slice(0, 6);
	});

	const groups = $derived(
		groupByProductType((pantry.data ?? []).map((item) => ({ ...item, id: item._id })))
	);

	async function add(name: string, productType?: string) {
		const trimmed = name.trim();
		if (trimmed === '' || adding) return;
		adding = true;
		try {
			await client.mutation(api.pantry.add, { token, name: trimmed, productType });
			newItem = '';
		} finally {
			adding = false;
		}
	}

	async function remove(id: (typeof groups)[number]['items'][number]['_id']) {
		await client.mutation(api.pantry.remove, { token, id });
	}
</script>

<svelte:head>
	<title>{d.tabSpajza} · {d.appTitle}</title>
</svelte:head>

<div class="space-y-4">
	<form
		class="space-y-2"
		onsubmit={(event) => {
			event.preventDefault();
			add(newItem);
		}}
	>
		<div class="flex gap-2">
			<Input
				type="text"
				placeholder={d.spajzaPlaceholder}
				bind:value={newItem}
				autocomplete="off"
				class="rounded-full border-transparent bg-card shadow-sm"
			/>
			<Button
				type="submit"
				class="shrink-0 rounded-full"
				disabled={newItem.trim() === '' || adding}
			>
				<Plus class="mr-1 h-4 w-4" />
				{d.spajzaAdd}
			</Button>
		</div>

		{#if suggestions.length > 0}
			<ul class="overflow-hidden rounded-2xl bg-card shadow-sm">
				{#each suggestions as suggestion (suggestion.nameNorm)}
					<li>
						<button
							type="button"
							onclick={() => add(suggestion.name, suggestion.productType)}
							class="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
						>
							<span>{suggestion.name}</span>
							<span class="text-xs text-muted-foreground">{suggestion.productType}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</form>

	{#if pantry.isLoading}
		<div class="flex justify-center py-16"><Spinner /></div>
	{:else if (pantry.data ?? []).length === 0}
		<p class="mx-auto max-w-xs py-12 text-center text-sm text-muted-foreground">{d.spajzaEmpty}</p>
	{:else}
		<div class="space-y-4">
			{#each groups as group (group.productType)}
				<section class="space-y-0.5">
					<h3
						class="px-1 pt-3 pb-1 font-display text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
					>
						{group.productType}
					</h3>
					<ul>
						{#each group.items as item (item._id)}
							<li
								class="flex items-center justify-between gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-muted/60"
							>
								<span class="text-sm">{item.name}</span>
								<button
									type="button"
									onclick={() => remove(item._id)}
									aria-label={d.removeLabel}
									class="rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
								>
									<X class="h-4 w-4" />
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>
