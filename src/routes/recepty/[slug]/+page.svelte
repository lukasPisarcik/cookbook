<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d } from '$lib';
	import { Button, Spinner, VariantSwitcher } from '$lib/components';
	import { ArrowLeft, CalendarCheck, Clock, Heart, Users } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	const token = $derived(page.data.convexToken as string);
	const slug = $derived(page.params.slug ?? '');
	const client = useConvexClient();

	const recipe = useQuery(api.recipes.bySlug, () => ({ token, slug }));

	let selectedVariant = $state(0);
	let variantTouched = $state(false);

	const variant = $derived.by(() => {
		const data = recipe.data;
		if (!data) return undefined;
		const index = variantTouched
			? selectedVariant
			: (data.cookingToday?.variantIndex ?? selectedVariant);
		return data.variants[Math.min(index, data.variants.length - 1)];
	});

	const activeIndex = $derived.by(() => {
		const data = recipe.data;
		if (!data) return 0;
		return Math.min(
			variantTouched ? selectedVariant : (data.cookingToday?.variantIndex ?? selectedVariant),
			data.variants.length - 1
		);
	});

	function selectVariant(index: number) {
		selectedVariant = index;
		variantTouched = true;
	}

	async function toggleFavorite() {
		await client.mutation(api.recipes.toggleFavorite, { token, slug });
	}

	async function toggleCookingToday() {
		const data = recipe.data;
		if (!data) return;
		await client.mutation(api.recipes.setCookingToday, {
			token,
			slug,
			value: data.cookingToday ? null : { variantIndex: activeIndex, portionMultiplier: 1 }
		});
	}
</script>

<svelte:head>
	<title>{recipe.data?.title ?? d.appTitle} · {d.appTitle}</title>
</svelte:head>

{#if recipe.isLoading}
	<div class="flex justify-center py-16"><Spinner /></div>
{:else if !recipe.data}
	<div class="space-y-4 py-16 text-center">
		<p class="text-sm text-muted-foreground">{d.recipeNotFound}</p>
		<Button variant="outline" href={resolve('/')}>
			<ArrowLeft class="mr-2 h-4 w-4" />
			{d.backToList}
		</Button>
	</div>
{:else}
	{@const data = recipe.data}
	<article class="space-y-5">
		<a
			href={resolve('/')}
			class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-4 w-4" />
			{d.backToList}
		</a>

		<div class="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-sm">
			{#if data.imageUrl}
				<img src={data.imageUrl} alt={data.title} class="h-full w-full object-cover" />
			{:else}
				<div class="flex h-full w-full items-center justify-center text-6xl">🥗</div>
			{/if}
		</div>

		<div class="flex items-start justify-between gap-3">
			<h1 class="font-display text-2xl leading-tight font-bold tracking-tight">{data.title}</h1>
			<button
				type="button"
				onclick={toggleFavorite}
				aria-label={d.favoriteToggle}
				aria-pressed={data.isFavorite}
				class="shrink-0 rounded-full bg-card p-2.5 shadow-sm transition-colors hover:bg-accent"
			>
				<Heart
					class={cn(
						'h-5 w-5',
						data.isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'
					)}
				/>
			</button>
		</div>

		{#if data.dietTags.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each data.dietTags as tag (tag)}
					<span
						class="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
					>
						{tag}
					</span>
				{/each}
			</div>
		{/if}

		<VariantSwitcher
			labels={data.variants.map((entry) => entry.label)}
			selected={activeIndex}
			onSelect={selectVariant}
		/>

		{#if variant}
			<div class="grid grid-cols-3 gap-2 text-center">
				<div class="rounded-2xl bg-card py-3 shadow-sm">
					<p class="font-display text-xl font-bold tabular-nums">{variant.kcalPerPortion ?? '–'}</p>
					<p class="text-[11px] text-muted-foreground">{d.kcalPerPortionLabel}</p>
				</div>
				<div class="flex flex-col items-center justify-center rounded-2xl bg-card py-3 shadow-sm">
					{#if variant.portions}
						<p class="flex items-center gap-1 font-display text-xl font-bold tabular-nums">
							<Users class="h-4 w-4 text-primary" />{variant.portions}
						</p>
						<p class="text-[11px] text-muted-foreground">{d.portionsLabel}</p>
					{:else}
						<p class="font-display text-xl font-bold">–</p>
						<p class="text-[11px] text-muted-foreground">{d.portionsLabel}</p>
					{/if}
				</div>
				<div class="flex flex-col items-center justify-center rounded-2xl bg-card py-3 shadow-sm">
					{#if data.prepTimeMinutes}
						<p class="flex items-center gap-1 font-display text-xl font-bold tabular-nums">
							<Clock class="h-4 w-4 text-primary" />{data.prepTimeMinutes}
						</p>
						<p class="text-[11px] text-muted-foreground">{d.minutesShort} · {d.prepTimeLabel}</p>
					{:else}
						<p class="font-display text-xl font-bold">–</p>
						<p class="text-[11px] text-muted-foreground">{d.prepTimeLabel}</p>
					{/if}
				</div>
			</div>

			{#if variant.macros}
				<div class="grid grid-cols-3 gap-2 text-center text-sm">
					<div class="rounded-xl bg-secondary py-2">
						<span class="font-semibold tabular-nums">{variant.macros.carbs} g</span>
						<span class="block text-[11px] text-muted-foreground">{d.macrosCarbs}</span>
					</div>
					<div class="rounded-xl bg-secondary py-2">
						<span class="font-semibold tabular-nums">{variant.macros.protein} g</span>
						<span class="block text-[11px] text-muted-foreground">{d.macrosProtein}</span>
					</div>
					<div class="rounded-xl bg-secondary py-2">
						<span class="font-semibold tabular-nums">{variant.macros.fat} g</span>
						<span class="block text-[11px] text-muted-foreground">{d.macrosFat}</span>
					</div>
				</div>
			{/if}

			<section class="space-y-2">
				<h2 class="font-display text-xs font-bold tracking-widest text-muted-foreground uppercase">
					{d.ingredientsHeading}
				</h2>
				<ul class="divide-y rounded-2xl bg-card px-1 shadow-sm">
					{#each variant.ingredients as ingredient, index (`${index}|${ingredient.nameNorm}|${ingredient.unit ?? ''}`)}
						<li class="flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm">
							<span>{ingredient.name}</span>
							<span class="shrink-0 text-xs text-muted-foreground tabular-nums">
								{ingredient.quantity ?? ''}
								{ingredient.unit ?? ''}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if data.steps.length > 0}
			<section class="space-y-2">
				<h2 class="font-display text-xs font-bold tracking-widest text-muted-foreground uppercase">
					{d.stepsHeading}
				</h2>
				<ol class="space-y-3">
					{#each data.steps as step, index (index)}
						<li class="flex gap-3 text-sm leading-relaxed">
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground shadow-sm"
							>
								{index + 1}
							</span>
							<span>{step}</span>
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		{#if data.funFact}
			<aside
				class="rounded-2xl border border-primary/20 bg-accent p-4 text-sm leading-relaxed text-accent-foreground"
			>
				<p class="mb-1 font-display font-bold">💡 {d.funFactHeading}</p>
				<p>{data.funFact}</p>
			</aside>
		{/if}

		<div class="sticky bottom-20 pt-2">
			<Button class="w-full rounded-full shadow-lg" size="lg" onclick={toggleCookingToday}>
				<CalendarCheck class="mr-2 h-5 w-5" />
				{data.cookingToday ? d.cookingTodayRemove : d.cookingTodayAdd}
			</Button>
		</div>
	</article>
{/if}
