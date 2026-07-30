<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { d } from '$lib';
	import { Archive, BookOpenText, CalendarCheck, ShoppingCart } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	const tabs = $derived([
		{
			href: resolve('/'),
			label: d.tabRecepty,
			icon: BookOpenText,
			match: (p: string) => p === '/' || p.startsWith('/recepty')
		},
		{
			href: resolve('/dnes'),
			label: d.tabDnes,
			icon: CalendarCheck,
			match: (p: string) => p.startsWith('/dnes')
		},
		{
			href: resolve('/nakup'),
			label: d.tabNakup,
			icon: ShoppingCart,
			match: (p: string) => p.startsWith('/nakup')
		},
		{
			href: resolve('/spajza'),
			label: d.tabSpajza,
			icon: Archive,
			match: (p: string) => p.startsWith('/spajza')
		}
	]);
</script>

<nav
	aria-label={d.appTitle}
	class="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
>
	<div class="mx-auto grid w-full max-w-lg grid-cols-4">
		{#each tabs as tab (tab.href)}
			{@const active = tab.match(page.url.pathname)}
			<a
				href={tab.href}
				aria-current={active ? 'page' : undefined}
				class={cn(
					'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
					active ? 'text-sky-700 dark:text-sky-300' : 'text-muted-foreground hover:text-foreground'
				)}
			>
				<tab.icon class={cn('h-5 w-5', active && 'text-primary')} />
				<span>{tab.label}</span>
			</a>
		{/each}
	</div>
</nav>
