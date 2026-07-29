<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { Tooltip, Toaster } from '$lib/components';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Tooltip.Provider>
	<div class="flex h-screen w-full flex-col">
		<div class="flex w-full flex-1 items-center justify-center overflow-auto">
			<div class="text-text flex h-full w-full items-center justify-center">
				{@render children?.()}
			</div>
		</div>
	</div>
</Tooltip.Provider>

<Toaster richColors closeButton position="top-center" />
