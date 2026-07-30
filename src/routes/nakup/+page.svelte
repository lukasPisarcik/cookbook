<script lang="ts">
	import { page } from '$app/state';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { d, groupByProductType } from '$lib';
	import { ShoppingSection, Spinner } from '$lib/components';
	import { ChevronDown } from '@lucide/svelte';

	const token = $derived(page.data.convexToken as string);
	const client = useConvexClient();

	const shopping = useQuery(api.shopping.list, () => ({ token }));

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
		await client.mutation(api.shopping.setChecked, {
			token,
			id: id as (typeof actionable)[number]['_id'],
			checked
		});
	}

	async function setOverride(id: (typeof actionable)[number]['_id'], overridden: boolean) {
		await client.mutation(api.shopping.setOverridden, { token, id, overridden });
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
	<div class="space-y-4">
		<p class="text-sm font-semibold text-muted-foreground tabular-nums">
			{checkedCount}/{actionable.length}
			{d.nakupDone}
		</p>

		{#each groups as group (group.productType)}
			<ShoppingSection title={group.productType} items={group.items} onToggle={toggle} />
		{/each}

		{#if atHome.length > 0}
			<details class="group rounded-xl border bg-card">
				<summary
					class="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold"
				>
					<span>{d.mamDomaSection} ({atHome.length})</span>
					<ChevronDown class="h-4 w-4 transition-transform group-open:rotate-180" />
				</summary>
				<ul class="divide-y border-t">
					{#each atHome as item (item._id)}
						<li class="flex items-center justify-between gap-3 px-3 py-2.5">
							<span class="text-sm text-muted-foreground">
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
								class="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-muted dark:text-sky-300"
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
