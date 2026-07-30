<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { Tooltip, Toaster, TopBar, TabBar, ProfileSwitcher, Spinner } from '$lib/components';
	import { initConvex } from '$lib/convex';
	import { profileStore } from '$lib/stores';
	import { cn } from '$lib/utils';
	import '../app.css';

	let { children, data } = $props();

	initConvex();

	// Hydrate the profile *after* mount so the server and the first client
	// render agree (both show the spinner); the gate then resolves in place.
	$effect(() => {
		profileStore.init();
	});

	/**
	 * The recipe detail owns its own chrome: a photo that starts at y = 0,
	 * under the status bar, with floating controls over it. Deriving the flag
	 * here beats a route group, which would duplicate this layout.
	 */
	const bare = $derived(page.url.pathname.startsWith('/recepty/'));

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
			<div class="flex min-h-dvh w-full flex-col">
				{#if !bare}
					<TopBar />
				{/if}
				<main class={cn('mx-auto w-full max-w-lg flex-1 pb-28', bare ? 'pt-0' : 'px-4 pt-4')}>
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
