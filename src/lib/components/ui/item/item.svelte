<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';
	import type { Snippet } from 'svelte';

	export const itemVariants = tv({
		base: 'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
		variants: {
			variant: {
				default: 'bg-card',
				outline: 'border bg-transparent',
				muted: 'bg-muted/50'
			},
			size: {
				default: 'p-3',
				sm: 'p-2'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ItemVariant = VariantProps<typeof itemVariants>['variant'];
	export type ItemSize = VariantProps<typeof itemVariants>['size'];

	export type ItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: ItemVariant;
		size?: ItemSize;
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default' as ItemVariant,
		size = 'default' as ItemSize,
		ref = $bindable(null),
		child,
		children,
		...restProps
	}: ItemProps = $props();

	const derivedProps = $derived({
		class: cn(
			itemVariants({ variant, size }),
			child &&
				'hover:bg-accent focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
			className
		),
		...restProps
	});
</script>

{#if child}
	{@render child({ props: derivedProps })}
{:else}
	<div bind:this={ref} {...derivedProps}>
		{@render children?.()}
	</div>
{/if}
