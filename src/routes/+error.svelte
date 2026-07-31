<script lang="ts">
	import { page } from '$app/state';
	import { House, RefreshCw } from '@lucide/svelte';
	import { Button } from '$lib/components';
	import { d } from '$lib';
	import { getErrorMetadata, getStatusText } from '$lib/errors';

	const status = $derived(page.status);
	const error = $derived(page.error);

	const metadata = $derived(getErrorMetadata(status));
	const statusText = $derived(getStatusText(status));

	const title = $derived(d[metadata.titleKey as keyof typeof d] ?? statusText);
	const description = $derived(
		d[metadata.descriptionKey as keyof typeof d] ?? error?.message ?? ''
	);
	const whatHappened = $derived(d[metadata.whatHappenedKey as keyof typeof d] ?? '');
	const whatToDo = $derived(d[metadata.whatToDoKey as keyof typeof d] ?? '');

	function handleRetry() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>{status} - {title} | {d.appTitle}</title>
</svelte:head>

<div class="flex min-h-screen w-full items-center justify-center bg-background p-4">
	<div class="mx-auto w-full max-w-lg space-y-8">
		<!-- Status Code - Largest Element -->
		<div class="text-center">
			<h1 class="text-9xl font-bold tracking-tighter text-primary/20">{status}</h1>
			<h2 class="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
			<p class="mt-2 text-muted-foreground">{description}</p>
		</div>

		<!-- What Happened Section -->
		{#if whatHappened}
			<div class="rounded-lg border bg-card p-4">
				<h3 class="mb-2 font-medium">{d.errorPageWhatHappened}</h3>
				<p class="text-sm text-muted-foreground">{whatHappened}</p>
			</div>
		{/if}

		<!-- What To Do Section -->
		{#if whatToDo}
			<div class="rounded-lg border bg-card p-4">
				<h3 class="mb-2 font-medium">{d.errorPageWhatToDo}</h3>
				<p class="text-sm text-muted-foreground">{whatToDo}</p>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
			{#if metadata.showHome}
				<Button variant="default" href="/">
					<House class="mr-2 h-4 w-4" />
					{d.errorPageGoHome}
				</Button>
			{/if}

			{#if metadata.showRetry}
				<Button variant="outline" onclick={handleRetry}>
					<RefreshCw class="mr-2 h-4 w-4" />
					{d.errorPageTryAgain}
				</Button>
			{/if}
		</div>

		<!-- Error ID Footer -->
		{#if error?.id}
			<div class="text-center text-xs text-muted-foreground">
				<span>{d.errorPageErrorId}: </span>
				<code class="font-mono">{error.id}</code>
			</div>
		{/if}
	</div>
</div>
