<script lang="ts">
	import { d } from '$lib';
	import { profileStore } from '$lib/stores';
	import { Button, Input, Sheet } from '$lib/components';
	import { Check, UserPlus } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	/**
	 * Two faces of the same thing, chosen explicitly by the caller rather than
	 * inferred from whether a profile exists:
	 *
	 * - `gate` → the „Kto si?" prompt. The root layout renders this *instead of*
	 *   the tabs, so there is no way past it without an identity.
	 * - `switcher` → an initials avatar in the top bar that opens a sheet to
	 *   switch to a known profile or add a new name.
	 *
	 * The distinction matters because the shell (and so the top bar) can render
	 * with no profile resolved — error pages skip the gate deliberately, and the
	 * switcher must stay out of the way there rather than expanding into a
	 * full-screen prompt inside the header.
	 */
	interface Props {
		variant?: 'gate' | 'switcher';
	}

	let { variant = 'switcher' }: Props = $props();

	let sheetOpen = $state(false);
	let addingInSheet = $state(false);
	let typedName = $state('');

	const initials = $derived(
		(profileStore.name ?? '')
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part.charAt(0).toUpperCase())
			.join('')
	);

	function submitName(event: SubmitEvent) {
		event.preventDefault();
		if (typedName.trim() === '') return;
		profileStore.set(typedName);
		typedName = '';
		addingInSheet = false;
		sheetOpen = false;
	}

	function pick(name: string) {
		profileStore.set(name);
		sheetOpen = false;
		addingInSheet = false;
	}
</script>

{#if variant === 'gate' && !profileStore.current}
	<!-- The „Kto si?" gate — replaces the whole shell until a name is chosen. -->
	<div class="flex min-h-dvh w-full items-center justify-center px-6">
		<div class="w-full max-w-sm space-y-6 text-center">
			<div class="space-y-2">
				<p class="text-5xl">👋</p>
				<h1 class="font-display text-2xl font-bold tracking-tight">{d.profileWhoAreYou}</h1>
				<p class="text-sm text-muted-foreground">{d.profileHint}</p>
			</div>

			<form class="space-y-2" onsubmit={submitName}>
				<Input
					type="text"
					name="profileName"
					data-testid="profile-name-input"
					placeholder={d.profileNamePlaceholder}
					autocomplete="off"
					maxlength={40}
					bind:value={typedName}
					class="rounded-full border-transparent bg-card text-center shadow-sm"
				/>
				<Button
					type="submit"
					class="w-full rounded-full"
					size="lg"
					disabled={typedName.trim() === ''}
				>
					{d.profileContinue}
				</Button>
			</form>

			{#if profileStore.known.length > 0}
				<div class="space-y-2">
					<p
						class="font-display text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
					>
						{d.profileKnownHeading}
					</p>
					<div class="flex flex-wrap justify-center gap-2">
						{#each profileStore.known as entry (entry.userId)}
							<button
								type="button"
								onclick={() => pick(entry.name)}
								class="rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-accent"
							>
								{entry.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else if variant === 'switcher' && profileStore.current}
	<Sheet.Root bind:open={sheetOpen}>
		<Sheet.Trigger
			aria-label={d.profileSwitcherLabel}
			data-testid="profile-switcher"
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 font-display text-xs font-bold text-primary transition-colors hover:bg-primary/20"
		>
			{initials}
		</Sheet.Trigger>
		<Sheet.Content side="bottom" class="gap-3 rounded-t-3xl pb-[env(safe-area-inset-bottom)]">
			<Sheet.Header class="pb-0">
				<Sheet.Title class="font-display">{d.profileSwitchHeading}</Sheet.Title>
			</Sheet.Header>

			<div class="space-y-1 px-4">
				{#each profileStore.known as entry (entry.userId)}
					<button
						type="button"
						onclick={() => pick(entry.name)}
						class={cn(
							'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent',
							entry.userId === profileStore.userId && 'bg-accent font-semibold'
						)}
					>
						<span>{entry.name}</span>
						{#if entry.userId === profileStore.userId}
							<Check class="h-4 w-4 shrink-0 text-primary" />
						{/if}
					</button>
				{/each}
			</div>

			<div class="px-4 pb-4">
				{#if addingInSheet}
					<form class="flex gap-2" onsubmit={submitName}>
						<Input
							type="text"
							name="profileName"
							placeholder={d.profileNamePlaceholder}
							autocomplete="off"
							maxlength={40}
							bind:value={typedName}
							class="rounded-full border-transparent bg-card shadow-sm"
						/>
						<Button type="submit" class="shrink-0 rounded-full" disabled={typedName.trim() === ''}>
							{d.profileContinue}
						</Button>
					</form>
				{:else}
					<Button
						variant="ghost"
						class="w-full justify-start text-muted-foreground"
						onclick={() => (addingInSheet = true)}
					>
						<UserPlus class="mr-2 h-4 w-4" />
						{d.profileAddAnother}
					</Button>
				{/if}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{/if}
