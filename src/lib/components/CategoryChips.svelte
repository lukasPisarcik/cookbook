<script lang="ts">
	import { d } from '$lib';
	import { RecipeCategory } from '$lib/schemas';
	import { cn } from '$lib/utils';

	interface Props {
		selected: string | null;
		onSelect: (category: string | null) => void;
	}

	let { selected, onSelect }: Props = $props();

	const labels = $derived<Record<RecipeCategory, string>>({
		ranajky: d.categoryRanajky,
		obedy: d.categoryObedy,
		vecere: d.categoryVecere,
		snacky: d.categorySnacky,
		smoothies: d.categorySmoothies,
		drinky: d.categoryDrinky,
		dezerty: d.categoryDezerty,
		zaklady: d.categoryZaklady
	});

	function chipClass(active: boolean): string {
		return cn(
			'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
			active
				? 'border-transparent bg-primary text-primary-foreground'
				: 'bg-card text-muted-foreground hover:text-foreground'
		);
	}
</script>

<div class="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1">
	<button type="button" class={chipClass(selected === null)} onclick={() => onSelect(null)}>
		{d.categoryAll}
	</button>
	{#each RecipeCategory.options as category (category)}
		<button
			type="button"
			class={chipClass(selected === category)}
			onclick={() => onSelect(selected === category ? null : category)}
		>
			{labels[category]}
		</button>
	{/each}
</div>
