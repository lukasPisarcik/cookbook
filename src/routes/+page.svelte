<script lang="ts">
	import { page } from '$app/state';
	import { useQuery, usePaginatedQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d } from '$lib';
	import { CategoryChips, Input, RecipeCard, Spinner } from '$lib/components';
	import { profileStore } from '$lib/stores';
	import { Heart, Search } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	/**
	 * Rows per page. 20 fills a phone screen roughly twice over, so the sentinel
	 * has something to scroll towards before it fires, and one page is ~5.7 KB
	 * against the 188 KB the unpaginated list used to read.
	 */
	const PAGE_SIZE = 20;

	const token = $derived(page.data.convexToken as string);
	const userId = $derived(profileStore.userId);

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

	/**
	 * The card read. It no longer takes the profile's state with it — favourites
	 * arrive separately below — so nothing this profile writes can invalidate it
	 * and force a re-read of every loaded page.
	 *
	 * `userId` is still passed (and still gates on the profile) because the
	 * favourites filter resolves server-side; every other branch ignores it.
	 * Changing any argument resets pagination to the first page, which
	 * `usePaginatedQuery` does for us on an args change.
	 */
	const recipes = usePaginatedQuery(
		api.recipes.list,
		() =>
			userId
				? {
						token,
						userId,
						search: debouncedSearch.trim() || undefined,
						category: category ?? undefined,
						dietTag: dietTag ?? undefined,
						favoritesOnly: favoritesOnly || undefined
					}
				: 'skip',
		() => ({ initialNumItems: PAGE_SIZE })
	);

	// One indexed read of this profile's state, merged into the cards client-side
	// for the heart indicator. A toggle re-runs this ~1 KB query and nothing else.
	const favorites = useQuery(api.recipes.favoriteSlugs, () =>
		userId ? { token, userId } : 'skip'
	);
	const favoriteSlugs = $derived(new Set(favorites.data ?? []));

	const dietTags = useQuery(api.recipes.dietTags, () => ({ token }));

	/**
	 * Infinite scroll. Guarded on `CanLoadMore` rather than on scroll position,
	 * because with a short filtered result the sentinel can already be in view
	 * on first paint — a scroll-based guard would chain `loadMore` calls.
	 */
	let sentinel = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!sentinel || recipes.status !== 'CanLoadMore') return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) recipes.loadMore(PAGE_SIZE);
			},
			// Start fetching before the sentinel is actually visible, so the next
			// page is usually already there by the time the user reaches it.
			{ rootMargin: '400px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
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

	{#if recipes.status === 'LoadingFirstPage'}
		<div class="flex justify-center py-16"><Spinner /></div>
	{:else if recipes.results.length === 0}
		<p class="py-16 text-center text-sm text-muted-foreground">{d.emptyRecipes}</p>
	{:else}
		<div class="space-y-2" data-testid="recipe-list">
			{#each recipes.results as recipe (recipe.slug)}
				<RecipeCard
					slug={recipe.slug}
					title={recipe.title}
					imageUrl={recipe.imageUrl}
					kcalOptions={recipe.kcalOptions}
					isFavorite={favoriteSlugs.has(recipe.slug)}
					prepTimeMinutes={recipe.prepTimeMinutes}
				/>
			{/each}
		</div>

		{#if recipes.status === 'LoadingMore'}
			<div class="flex justify-center py-6"><Spinner /></div>
		{/if}

		<!-- Scrolled into view → the next page loads. No button, no polling. -->
		<div bind:this={sentinel} aria-hidden="true"></div>
	{/if}
</div>
