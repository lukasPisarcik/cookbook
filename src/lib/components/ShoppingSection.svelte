<script lang="ts">
	import { Checkbox, IngredientTile } from '$lib/components';
	import { cn } from '$lib/utils';

	interface ShoppingRow {
		id: string;
		name: string;
		quantity?: number;
		unit?: string;
		productType?: string;
		checked: boolean;
	}

	interface Props {
		title: string;
		items: ShoppingRow[];
		onToggle: (id: string, checked: boolean) => void;
	}

	let { title, items, onToggle }: Props = $props();

	function formatQuantity(quantity?: number, unit?: string): string {
		if (quantity === undefined) return unit ?? '';
		const amount = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
		return unit ? `${amount} ${unit}` : amount;
	}
</script>

<section class="space-y-0.5">
	<h3
		class="px-1 pt-3 pb-1 font-display text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
	>
		{title}
	</h3>
	<ul>
		{#each items as item (item.id)}
			<li>
				<label
					class="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-muted/60"
				>
					<Checkbox
						checked={item.checked}
						onCheckedChange={(checked) => onToggle(item.id, checked === true)}
						class="size-[18px] rounded-[5px]"
					/>
					<IngredientTile name={item.name} productType={item.productType} size="sm" />
					<span
						class={cn(
							'flex-1 text-sm transition-all duration-200',
							item.checked && 'text-muted-foreground/70 line-through'
						)}
					>
						{item.name}
					</span>
					<span
						class={cn(
							'text-xs text-muted-foreground tabular-nums transition-all duration-200',
							item.checked && 'text-muted-foreground/50 line-through'
						)}
					>
						{formatQuantity(item.quantity, item.unit)}
					</span>
				</label>
			</li>
		{/each}
	</ul>
</section>
