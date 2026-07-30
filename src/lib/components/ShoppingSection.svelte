<script lang="ts">
	import { Checkbox } from '$lib/components';
	import { cn } from '$lib/utils';

	interface ShoppingRow {
		id: string;
		name: string;
		quantity?: number;
		unit?: string;
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

<section class="space-y-1">
	<h3 class="pt-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">{title}</h3>
	<ul class="divide-y rounded-xl border bg-card">
		{#each items as item (item.id)}
			<li>
				<label class="flex cursor-pointer items-center gap-3 px-3 py-2.5">
					<Checkbox
						checked={item.checked}
						onCheckedChange={(checked) => onToggle(item.id, checked === true)}
					/>
					<span class={cn('flex-1 text-sm', item.checked && 'text-muted-foreground line-through')}>
						{item.name}
					</span>
					<span class="text-xs text-muted-foreground tabular-nums">
						{formatQuantity(item.quantity, item.unit)}
					</span>
				</label>
			</li>
		{/each}
	</ul>
</section>
