<script lang="ts">
	import { enhance } from '$app/forms';
	import { d } from '$lib';
	import { Button, Input, Label } from '$lib/components';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>{d.appTitle}</title>
</svelte:head>

<div class="flex min-h-dvh w-full items-center justify-center p-6">
	<div class="w-full max-w-sm space-y-8">
		<div class="space-y-2 text-center">
			<h1 class="text-3xl font-bold tracking-tight">{d.appTitle}</h1>
			<p class="text-muted-foreground">{d.loginSubtitle}</p>
		</div>

		<form
			method="POST"
			class="space-y-4"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
		>
			<div class="space-y-2">
				<Label for="password">{d.loginPasswordLabel}</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					autofocus
				/>
			</div>

			{#if form?.incorrect}
				<p class="text-sm text-destructive" role="alert">{d.loginIncorrectPassword}</p>
			{/if}

			<Button type="submit" class="w-full" disabled={submitting}>
				{d.loginSubmit}
			</Button>
		</form>
	</div>
</div>
