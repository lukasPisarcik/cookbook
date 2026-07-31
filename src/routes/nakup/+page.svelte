<script lang="ts">
	import { page } from '$app/state';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d, groupByProductType } from '$lib';
	import { IngredientTile, ShoppingSection, Spinner } from '$lib/components';
	import { profileStore } from '$lib/stores';
	import { ChevronDown } from '@lucide/svelte';

	const token = $derived(page.data.convexToken as string);
	const userId = $derived(profileStore.userId);
	const client = useConvexClient();

	const shopping = useQuery(api.shopping.list, () => (userId ? { token, userId } : 'skip'));

	const actionable = $derived(
		(shopping.data ?? []).filter((item) => !item.excludedByPantry || item.overridden)
	);
	const atHome = $derived(
		(shopping.data ?? []).filter((item) => item.excludedByPantry && !item.overridden)
	);
	const checkedCount = $derived(actionable.filter((item) => item.checked).length);
	const groups = $derived(
		groupByProductType(actionable.map((item) => ({ ...item, id: item._id })))
	);

	async function toggle(id: string, checked: boolean) {
		if (!userId) return;
		await client.mutation(api.shopping.setChecked, {
			token,
			userId,
			id: id as (typeof actionable)[number]['_id'],
			checked
		});
	}

	async function setOverride(id: (typeof actionable)[number]['_id'], overridden: boolean) {
		if (!userId) return;
		await client.mutation(api.shopping.setOverridden, { token, userId, id, overridden });
	}
</script>

<svelte:head>
	<title>{d.tabNakup} · {d.appTitle}</title>
</svelte:head>

{#if shopping.isLoading}
	<div class="flex justify-center py-16"><Spinner /></div>
{:else if (shopping.data ?? []).length === 0}
	<p class="mx-auto max-w-xs py-16 text-center text-sm text-muted-foreground">{d.nakupEmpty}</p>
{:else}
	<div class="space-y-3">
		<div class="space-y-1.5">
			<p
				id="shopping-progress-label"
				class="font-display text-sm font-bold text-muted-foreground tabular-nums"
			>
				{checkedCount}/{actionable.length}
				{d.nakupDone}
			</p>
			<!-- Native <progress> keeps the fill an attribute, not an inline style. -->
			<progress
				aria-labelledby="shopping-progress-label"
				value={checkedCount}
				max={Math.max(actionable.length, 1)}
				class="h-1 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-300"
			></progress>
		</div>

		{#each groups as group (group.productType)}
			<ShoppingSection title={group.productType} items={group.items} onToggle={toggle} />
		{/each}

		{#if atHome.length > 0}
			<details class="group pt-2">
				<summary
					class="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-1 py-2 font-display text-[11px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:bg-muted/60"
				>
					<ChevronDown class="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
					<span>{d.mamDomaSection} ({atHome.length})</span>
				</summary>
				<ul>
					{#each atHome as item (item._id)}
						<li class="flex items-center gap-3 rounded-lg px-1 py-2">
							<IngredientTile name={item.name} productType={item.productType} size="sm" />
							<span class="min-w-0 flex-1 text-sm text-muted-foreground">
								{item.name}
								{#if item.quantity !== undefined}
									<span class="ml-1 text-xs tabular-nums">
										{Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(1)}
										{item.unit ?? ''}
									</span>
								{/if}
							</span>
							<button
								type="button"
								onclick={() => setOverride(item._id, true)}
								class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-accent-foreground transition-colors hover:bg-primary/10"
							>
								{d.buyAnyway}
							</button>
						</li>
					{/each}
				</ul>
			</details>
		{/if}
	</div>
{/if}
