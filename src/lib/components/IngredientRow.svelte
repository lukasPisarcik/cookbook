<script lang="ts">
	import { IngredientTile } from '$lib/components';

	interface Props {
		name: string;
		quantity?: number;
		unit?: string;
		productType?: string;
	}

	let { name, quantity, unit, productType }: Props = $props();

	/**
	 * „150 g" / „2 ks" / „1.5 PL" — one decimal only when the portion
	 * multiplier produced a fraction. Empty when the source gives no amount
	 * („soľ podľa chuti").
	 */
	const amount = $derived.by(() => {
		if (quantity === undefined) return unit ?? '';
		const value = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
		return unit ? `${value} ${unit}` : value;
	});
</script>

<div class="flex items-center gap-3 rounded-2xl bg-card px-3 py-2 shadow-sm">
	<IngredientTile {name} {productType} size="md" />
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm leading-snug font-medium">{name}</p>
		{#if productType}
			<p class="truncate text-[11px] text-muted-foreground">{productType}</p>
		{/if}
	</div>
	{#if amount !== ''}
		<span class="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
			{amount}
		</span>
	{/if}
</div>
