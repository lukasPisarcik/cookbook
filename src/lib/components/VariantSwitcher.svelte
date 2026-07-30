<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		labels: string[];
		selected: number;
		onSelect: (index: number) => void;
	}

	let { labels, selected, onSelect }: Props = $props();
</script>

{#if labels.length > 1}
	<div
		role="tablist"
		class="inline-flex items-center gap-1 rounded-full bg-muted p-1"
		data-testid="variant-switcher"
	>
		{#each labels as label, index (label)}
			<button
				type="button"
				role="tab"
				aria-selected={index === selected}
				onclick={() => onSelect(index)}
				class={cn(
					'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
					index === selected
						? 'bg-primary text-primary-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				)}
			>
				{label}
			</button>
		{/each}
	</div>
{/if}
