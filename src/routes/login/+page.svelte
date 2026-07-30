<script lang="ts">
	import { enhance } from '$app/forms';
	import logo from '$lib/assets/logo.svg';
	import { d } from '$lib';
	import { Button, Input, Label } from '$lib/components';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>{d.appTitle}</title>
</svelte:head>

<div class="flex min-h-dvh w-full items-center justify-center p-6">
	<div class="w-full max-w-sm space-y-6">
		<div class="space-y-3 text-center">
			<!-- Decorative: the adjacent heading is the accessible app title. -->
			<img src={logo} alt="" class="mx-auto h-16 w-16" />
			<h1 class="font-display text-3xl font-bold tracking-tight">{d.appTitle}</h1>
			<p class="text-muted-foreground">{d.loginSubtitle}</p>
		</div>

		<form
			method="POST"
			class="space-y-4 rounded-3xl bg-card p-6 shadow-sm"
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

			<Button type="submit" class="w-full rounded-full" disabled={submitting}>
				{d.loginSubmit}
			</Button>
		</form>
	</div>
</div>
