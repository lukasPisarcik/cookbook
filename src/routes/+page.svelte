<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d } from '$lib';
	import { CategoryChips, Input, RecipeCard, Spinner } from '$lib/components';
	import { Heart, Search } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	const token = $derived(page.data.convexToken as string);

	let search = $state('');
	let debouncedSearch = $state('');
	let category = $state<string | null>(null);
	let dietTag = $state<string | null>(null);
	let favoritesOnly = $state(false);

	$effect(() => {
		const value = search;
		const timer = setTimeout(() => (debouncedSearch = value), 250);
		return () => clearTimeout(timer);
	});

	const recipes = useQuery(api.recipes.list, () => ({
		token,
		search: debouncedSearch.trim() || undefined,
		category: category ?? undefined,
		dietTag: dietTag ?? undefined,
		favoritesOnly: favoritesOnly || undefined
	}));

	const dietTags = useQuery(api.recipes.dietTags, () => ({ token }));
</script>

<svelte:head>
	<title>{d.tabRecepty} · {d.appTitle}</title>
</svelte:head>

<div class="space-y-3">
	<div class="sticky top-[53px] z-10 -mx-4 bg-background/95 px-4 pt-1 pb-2 backdrop-blur">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder={d.searchPlaceholder}
				bind:value={search}
				class="rounded-full border-transparent bg-card pl-9 shadow-sm"
			/>
		</div>
	</div>

	<CategoryChips selected={category} onSelect={(value) => (category = value)} />

	<div class="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1">
		<button
			type="button"
			onclick={() => (favoritesOnly = !favoritesOnly)}
			class={cn(
				'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
				favoritesOnly
					? 'border-transparent bg-primary text-primary-foreground shadow-sm'
					: 'border-transparent bg-card text-muted-foreground shadow-sm hover:text-foreground'
			)}
		>
			<Heart class={cn('h-3.5 w-3.5', favoritesOnly && 'fill-current')} />
			{d.favoritesOnly}
		</button>
		{#each dietTags.data ?? [] as tag (tag)}
			<button
				type="button"
				onclick={() => (dietTag = dietTag === tag ? null : tag)}
				class={cn(
					'shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
					dietTag === tag
						? 'border-transparent bg-primary text-primary-foreground shadow-sm'
						: 'border-transparent bg-card text-muted-foreground shadow-sm hover:text-foreground'
				)}
			>
				{tag}
			</button>
		{/each}
	</div>

	{#if recipes.isLoading}
		<div class="flex justify-center py-16"><Spinner /></div>
	{:else if (recipes.data ?? []).length === 0}
		<p class="py-16 text-center text-sm text-muted-foreground">{d.emptyRecipes}</p>
	{:else}
		<div class="space-y-2">
			{#each recipes.data ?? [] as recipe (recipe.slug)}
				<RecipeCard
					slug={recipe.slug}
					title={recipe.title}
					imageUrl={recipe.imageUrl}
					kcalOptions={recipe.kcalOptions}
					isFavorite={recipe.isFavorite}
					prepTimeMinutes={recipe.prepTimeMinutes}
				/>
			{/each}
		</div>
	{/if}
</div>
