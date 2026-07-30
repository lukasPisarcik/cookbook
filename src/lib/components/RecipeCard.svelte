<script lang="ts">
	import { resolve } from '$app/paths';
	import { Heart } from '@lucide/svelte';

	interface Props {
		slug: string;
		title: string;
		imageUrl: string | null;
		kcalOptions: number[];
		isFavorite: boolean;
	}

	let { slug, title, imageUrl, kcalOptions, isFavorite }: Props = $props();

	const kcalText = $derived(
		[...new Set(kcalOptions)]
			.sort((a, b) => a - b)
			.map((kcal) => Math.round(kcal))
			.join(' / ')
	);
</script>

<a
	href={resolve('/recepty/[slug]', { slug })}
	class="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
>
	<div class="relative aspect-[4/3] w-full bg-muted">
		{#if imageUrl}
			<img
				src={imageUrl}
				alt={title}
				loading="lazy"
				class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-3xl">🥗</div>
		{/if}
		{#if isFavorite}
			<span
				data-testid="favorite-indicator"
				class="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 backdrop-blur"
			>
				<Heart class="h-4 w-4 fill-destructive text-destructive" />
			</span>
		{/if}
	</div>
	<div class="space-y-0.5 p-3">
		<h3 class="line-clamp-2 text-sm leading-snug font-semibold">{title}</h3>
		{#if kcalText}
			<p class="text-xs text-muted-foreground">{kcalText} kcal</p>
		{/if}
	</div>
</a>
