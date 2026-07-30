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
	 * A collapsing toolbar, modelled on the trip-planner map stage.
	 *
	 * The stage is `sticky` with a **negative** top — `peek − height` — so it
	 * scrolls away naturally under its own momentum until only
	 * `--recipe-hero-peek` remains pinned below the status bar. The photo then
	 * reads as a photo-backed app bar rather than sliding off the screen and
	 * taking the back button with it.
	 *
	 * Three things make it behave:
	 *
	 * - The height is **constant** (`--recipe-hero-h`) and there is no scroll
	 *   listener. Resizing a sticky stage per scroll frame resizes the document
	 *   mid-scroll, which fights the browser's scroll anchoring and stutters.
	 * - `overflow-hidden` lives on the inner frame, never on the stage: on the
	 *   stage it would become the scroll container for its own children and kill
	 *   the controls' stickiness.
	 * - The controls are `sticky self-start` inside the stage, so they ride the
	 *   peek and stay reachable for the whole scroll.
	 *
	 * The stage sits at `z-2` and the route's content column at `z-1`, so the
	 * content slides *behind* the pinned peek. On desktop the column stays
	 * `max-w-lg`, so the photo bleeds to the column's edges, not the browser's.
	 */
</script>

<div
	class="sticky top-[calc(env(safe-area-inset-top)+var(--recipe-hero-peek)-var(--recipe-hero-h))] z-2 grid h-(--recipe-hero-h) w-full *:col-start-1 *:row-start-1 *:min-w-0"
>
	<div class="relative overflow-hidden rounded-b-3xl bg-muted">
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
	</div>

	<!-- Controls ride the peek, like the trip-planner map controls. -->
	<div
		class="pointer-events-none sticky top-[calc(env(safe-area-inset-top)+0.75rem)] z-3 flex items-center justify-between self-start px-4"
	>
		<a
			href={resolve('/')}
			aria-label={d.backToList}
			class="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur transition-colors hover:bg-card"
		>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<button
			type="button"
			onclick={onToggleFavorite}
			aria-label={d.favoriteToggle}
			aria-pressed={isFavorite}
			class="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur transition-colors hover:bg-card"
		>
			<Heart class={cn('h-5 w-5', isFavorite ? 'fill-primary text-primary' : 'text-foreground')} />
		</button>
	</div>
</div>
