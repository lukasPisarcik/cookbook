<script lang="ts">
	import { resolve } from '$app/paths';
	import { d } from '$lib';
	import { ArrowLeft, Heart } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		imageUrl: string | null;
		title: string;
		isFavorite: boolean;
		onToggleFavorite: () => void;
	}

	let { imageUrl, title, isFavorite, onToggleFavorite }: Props = $props();

	/**
	 * The root layout drops its top padding and hides the TopBar on
	 * `/recepty/*`, so this photo already starts at y = 0 — behind the status
	 * bar. Only the floating controls need the safe-area offset; keeping that
	 * maths here rather than in the route file.
	 *
	 * On desktop the column stays `max-w-lg`, so the photo bleeds to the
	 * column's edges, not the browser's — a full-width photo on a big monitor
	 * would read as broken, and the app is mobile-first.
	 */
</script>

<div class="relative aspect-[4/5] w-full overflow-hidden rounded-b-3xl bg-muted sm:aspect-[4/3]">
	{#if imageUrl}
		<img src={imageUrl} alt={title} class="h-full w-full object-cover" />
	{:else}
		<!-- 20 recipes have no photo; the block scales up instead of looking broken. -->
		<div class="flex h-full w-full items-center justify-center text-7xl">🥗</div>
	{/if}

	<!-- Scrim: keeps white floating buttons legible on pale photos. -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/25 to-transparent"
	></div>

	<div
		class="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center justify-between px-4"
	>
		<a
			href={resolve('/')}
			aria-label={d.backToList}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur transition-colors hover:bg-card"
		>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<button
			type="button"
			onclick={onToggleFavorite}
			aria-label={d.favoriteToggle}
			aria-pressed={isFavorite}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur transition-colors hover:bg-card"
		>
			<Heart class={cn('h-5 w-5', isFavorite ? 'fill-primary text-primary' : 'text-foreground')} />
		</button>
	</div>
</div>
