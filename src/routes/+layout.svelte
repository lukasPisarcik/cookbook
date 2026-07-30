<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { Tooltip, Toaster, TopBar, TabBar, ProfileSwitcher, Spinner } from '$lib/components';
	import { initConvex } from '$lib/convex';
	import { profileStore } from '$lib/stores';
	import '../app.css';

	let { children, data } = $props();

	initConvex();

	// Hydrate the profile *after* mount so the server and the first client
	// render agree (both show the spinner); the gate then resolves in place.
	$effect(() => {
		profileStore.init();
	});

	/**
	 * The profile gate gets skipped on error pages. `+error.svelte` renders as
	 * this layout's children, so gating it would mean a first-time visitor who
	 * hits a 404 sees „Kto si?" instead of the 404 — and could not reach the
	 * error page at all. An error page is not a tab; it needs no identity.
	 */
	const gateOnProfile = $derived(data.authed && page.error === null);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Tooltip.Provider>
	{#if data.authed}
		{#if gateOnProfile && !profileStore.resolved}
			<div class="flex min-h-dvh items-center justify-center"><Spinner /></div>
		{:else if gateOnProfile && !profileStore.current}
			<ProfileSwitcher variant="gate" />
		{:else}
			<!--
				Every authenticated route gets the same chrome — the top bar included.
				A route that wants a full-width element (the recipe hero) bleeds out of
				this gutter with negative margins, which keeps the exception inside the
				component that needs it instead of making the layout route-aware.
			-->
			<div class="flex min-h-dvh w-full flex-col">
				<TopBar />
				<main class="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-28">
					{@render children?.()}
				</main>
				<TabBar />
			</div>
		{/if}
	{:else}
		{@render children?.()}
	{/if}
</Tooltip.Provider>

<Toaster richColors closeButton position="top-center" />
