<script lang="ts">
	import { ingredientIcon } from '$lib';
	import { cn } from '$lib/utils';

	interface Props {
		name: string;
		productType?: string;
		/** 32px shopping rows · 44px detail rows · 64px Špajza grid. */
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { name, productType, size = 'md', class: className }: Props = $props();

	const icon = $derived(ingredientIcon(name, productType));

	const sizeClasses = {
		sm: 'size-8 rounded-lg text-base',
		md: 'size-11 rounded-xl text-xl',
		lg: 'size-16 rounded-2xl text-3xl'
	} as const;
</script>

<span
	class={cn(
		'flex shrink-0 items-center justify-center leading-none',
		sizeClasses[size],
		icon.tint,
		className
	)}
>
	<!-- Decoration: the ingredient name is already text next to it. -->
	<span aria-hidden="true">{icon.emoji}</span>
</span>
