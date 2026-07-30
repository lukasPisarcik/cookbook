<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { Tooltip, Toaster, TopBar, TabBar } from '$lib/components';
	import { initConvex } from '$lib/convex';
	import '../app.css';

	let { children, data } = $props();

	initConvex();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Tooltip.Provider>
	{#if data.authed}
		<div class="flex min-h-dvh w-full flex-col">
			<TopBar />
			<main class="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-28">
				{@render children?.()}
			</main>
			<TabBar />
		</div>
	{:else}
		{@render children?.()}
	{/if}
</Tooltip.Provider>

<Toaster richColors closeButton position="top-center" />
