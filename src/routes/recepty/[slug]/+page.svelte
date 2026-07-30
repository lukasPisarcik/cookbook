<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d } from '$lib';
	import { Button, IngredientRow, RecipeHero, Spinner, VariantSwitcher } from '$lib/components';
	import { profileStore } from '$lib/stores';
	import { ArrowLeft, CalendarCheck, Clock, Flame, Users } from '@lucide/svelte';

	const token = $derived(page.data.convexToken as string);
	const userId = $derived(profileStore.userId);
	const slug = $derived(page.params.slug ?? '');
	const client = useConvexClient();

	const recipe = useQuery(api.recipes.bySlug, () => (userId ? { token, userId, slug } : 'skip'));

	let selectedVariant = $state(0);
	let variantTouched = $state(false);

	// The displayed variant defaults to whatever „Dnes varím" stored and only
	// follows the pills once one has been tapped.
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
		if (!userId) return;
		await client.mutation(api.recipes.toggleFavorite, { token, userId, slug });
	}

	async function toggleCookingToday() {
		const data = recipe.data;
		if (!data || !userId) return;
		await client.mutation(api.recipes.setCookingToday, {
			token,
			userId,
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
	<div class="space-y-4 px-4 py-16 text-center">
		<p class="text-sm text-muted-foreground">{d.recipeNotFound}</p>
		<Button variant="outline" href={resolve('/')}>
			<ArrowLeft class="mr-2 h-4 w-4" />
			{d.backToList}
		</Button>
	</div>
{:else}
	{@const data = recipe.data}
	<article>
		<RecipeHero
			imageUrl={data.imageUrl}
			title={data.title}
			isFavorite={data.isFavorite}
			onToggleFavorite={toggleFavorite}
		/>

		<!-- Only the photo bleeds; everything below re-applies the gutter. -->
		<div class="space-y-5 px-4 pt-4">
			<div class="space-y-2">
				<h1 class="font-display text-2xl leading-tight font-bold tracking-tight">{data.title}</h1>
				{#if data.dietTags.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each data.dietTags as tag (tag)}
							<span
								class="rounded-full border border-primary/25 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
							>
								{tag}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<VariantSwitcher
				labels={data.variants.map((entry) => entry.label)}
				selected={activeIndex}
				onSelect={selectVariant}
			/>

			{#if variant}
				<div class="grid grid-cols-3 gap-2 text-center">
					<div class="flex flex-col items-center gap-0.5 rounded-2xl bg-card py-3 shadow-sm">
						<Clock class="h-4 w-4 text-primary" />
						<p class="font-display text-lg font-bold tabular-nums">
							{data.prepTimeMinutes ?? '–'}
							{#if data.prepTimeMinutes}<span class="text-xs font-semibold">{d.minutesShort}</span
								>{/if}
						</p>
						<p class="text-[11px] text-muted-foreground">{d.statTime}</p>
					</div>
					<div class="flex flex-col items-center gap-0.5 rounded-2xl bg-card py-3 shadow-sm">
						<Flame class="h-4 w-4 text-primary" />
						<p class="font-display text-lg font-bold tabular-nums">
							{variant.kcalPerPortion ?? '–'}
						</p>
						<p class="text-[11px] text-muted-foreground">{d.statKcal}</p>
					</div>
					<div class="flex flex-col items-center gap-0.5 rounded-2xl bg-card py-3 shadow-sm">
						<Users class="h-4 w-4 text-primary" />
						<p class="font-display text-lg font-bold tabular-nums">{variant.portions ?? '–'}</p>
						<p class="text-[11px] text-muted-foreground">{d.statPortions}</p>
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
					<h2
						class="font-display text-xs font-bold tracking-widest text-muted-foreground uppercase"
					>
						{d.ingredientsHeading} ({variant.ingredients.length})
					</h2>
					<ul class="space-y-2">
						{#each variant.ingredients as ingredient, index (`${index}|${ingredient.nameNorm}|${ingredient.unit ?? ''}`)}
							<li>
								<IngredientRow
									name={ingredient.name}
									quantity={ingredient.quantity}
									unit={ingredient.unit}
									productType={ingredient.productType}
								/>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if data.steps.length > 0}
				<section class="space-y-2">
					<h2
						class="font-display text-xs font-bold tracking-widest text-muted-foreground uppercase"
					>
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

			<!--
				The CTA floats above the tab bar for the whole scroll, so it needs a
				fade behind it — otherwise it reads as colliding with whatever row
				happens to sit under it rather than as a bar on top of the content.
			-->
			<div
				class="sticky bottom-20 -mx-4 bg-gradient-to-t from-background via-background to-transparent px-4 pt-8 pb-1"
			>
				<Button class="w-full rounded-full shadow-lg" size="lg" onclick={toggleCookingToday}>
					<CalendarCheck class="mr-2 h-5 w-5" />
					{data.cookingToday ? d.cookingTodayRemove : d.cookingTodayAdd}
				</Button>
			</div>
		</div>
	</article>
{/if}
