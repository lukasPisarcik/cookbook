<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import logo from '$lib/assets/logo.svg';
	import { d, type MeetingLanguageCode } from '$lib';
	import { langStore, themeStore } from '$lib/stores';
	import { Button } from '$lib/components';
	import { Moon, Sun } from '@lucide/svelte';

	const title = $derived.by(() => {
		const pathname = page.url.pathname;
		if (pathname.startsWith('/dnes')) return d.tabDnes;
		if (pathname.startsWith('/nakup')) return d.tabNakup;
		if (pathname.startsWith('/spajza')) return d.tabSpajza;
		return d.tabRecepty;
	});

	const locales = Object.keys(langStore.config) as MeetingLanguageCode[];

	function cycleLanguage() {
		const index = locales.indexOf(langStore.locale);
		langStore.set(locales[(index + 1) % locales.length]);
	}
</script>

<header
	class="sticky top-0 z-20 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur"
>
	<div class="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-2">
		<a href={resolve('/')} class="flex items-center gap-2 transition-opacity hover:opacity-80">
			<img src={logo} alt={d.appTitle} class="h-8 w-8" />
			<span class="text-lg font-bold tracking-tight">{title}</span>
		</a>

		<div class="flex items-center gap-1">
			<Button variant="ghost" size="icon" onclick={cycleLanguage} aria-label={d.changeLanguage}>
				<span class="text-base">{langStore.currentFlag}</span>
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onclick={() => themeStore.toggle()}
				aria-label={d.toggleTheme}
			>
				{#if themeStore.current === 'dark'}
					<Moon class="h-5 w-5" />
				{:else}
					<Sun class="h-5 w-5" />
				{/if}
			</Button>
		</div>
	</div>
</header>
