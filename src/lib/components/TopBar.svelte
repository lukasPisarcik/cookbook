<script lang="ts">
	import { resolve } from '$app/paths';
	import logo from '$lib/assets/logo.svg';
	import { d, type MeetingLanguageCode } from '$lib';
	import { langStore, themeStore } from '$lib/stores';
	import { Button, ProfileSwitcher } from '$lib/components';
	import { Moon, Sun } from '@lucide/svelte';

	// A fixed wordmark, not the active tab's name — the bottom tab bar already
	// says which tab you are on, so repeating it left the app with no identity.

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
			<img src={logo} alt="" class="h-8 w-8" />
			<span class="font-display text-lg font-bold tracking-tight">{d.appTitle}</span>
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
			<ProfileSwitcher variant="switcher" />
		</div>
	</div>
</header>
