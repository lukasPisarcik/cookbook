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
	 * A full-width photo that scrolls away with the page — plainly, no sticky
	 * stage. A collapsing-toolbar peek was tried and rejected: pinned to a
	 * sliver, a photo crop shows nothing useful and just eats the top of the
	 * screen. The app header stays put instead, which is what navigation
	 * actually needs.
	 *
	 * `-mx-4 -mt-4` cancels the layout's gutter so the photo runs edge to edge
	 * and sits flush under the header. Keeping the bleed here means the layout
	 * does not have to special-case this route. On desktop the column stays
	 * `max-w-lg`, so the photo bleeds to the column's edges, not the browser's.
	 */
</script>

<div
	class="relative -mx-4 -mt-4 aspect-[4/5] overflow-hidden rounded-b-3xl bg-muted sm:aspect-[4/3]"
>
	{#if imageUrl}
		<img src={imageUrl} alt={title} class="h-full w-full object-cover" />
	{:else}
		<!-- 20 recipes have no photo; the block scales up instead of looking broken. -->
		<div class="flex h-full w-full items-center justify-center text-7xl">🥗</div>
	{/if}

	<!-- Scrim: keeps the white floating buttons legible on pale photos. -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent"
	></div>

	<div class="absolute inset-x-0 top-3 flex items-center justify-between px-3">
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
