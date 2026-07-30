<script lang="ts">
	import { resolve } from '$app/paths';
	import { d } from '$lib';
	import { ChevronRight, Clock, Heart } from '@lucide/svelte';

	interface Props {
		slug: string;
		title: string;
		imageUrl: string | null;
		kcalOptions: number[];
		isFavorite: boolean;
		prepTimeMinutes?: number;
	}

	let { slug, title, imageUrl, kcalOptions, isFavorite, prepTimeMinutes }: Props = $props();

	const kcalText = $derived(
		[...new Set(kcalOptions)]
			.sort((a, b) => a - b)
			.map((kcal) => Math.round(kcal))
			.join(' / ')
	);
</script>

<a
	href={resolve('/recepty/[slug]', { slug })}
	class="group flex items-center gap-3 rounded-2xl bg-card p-2.5 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
>
	<div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
		{#if imageUrl}
			<img
				src={imageUrl}
				alt={title}
				loading="lazy"
				class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-2xl">🥗</div>
		{/if}
	</div>

	<div class="min-w-0 flex-1 space-y-0.5">
		<h3 class="line-clamp-2 font-display text-[15px] leading-snug font-bold">{title}</h3>
		<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
			{#if prepTimeMinutes}
				<span class="flex items-center gap-1 tabular-nums">
					<Clock class="h-3.5 w-3.5" />{prepTimeMinutes}
					{d.minutesShort}
				</span>
			{/if}
			{#if prepTimeMinutes && kcalText}
				<span aria-hidden="true">·</span>
			{/if}
			{#if kcalText}
				<span class="tabular-nums">{kcalText} kcal</span>
			{/if}
		</p>
	</div>

	{#if isFavorite}
		<span data-testid="favorite-indicator" class="shrink-0">
			<Heart class="h-4 w-4 fill-primary text-primary" />
		</span>
	{/if}
	<ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground/60" />
</a>
