<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	export const itemMediaVariants = tv({
		base: 'flex shrink-0 items-center justify-center',
		variants: {
			variant: {
				default: '',
				icon: 'bg-muted text-muted-foreground size-10 rounded-md [&_svg]:size-5',
				image: ''
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type ItemMediaVariant = VariantProps<typeof itemMediaVariants>['variant'];

	export type ItemMediaProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: ItemMediaVariant;
	};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		ref = $bindable(null),
		children,
		...restProps
	}: ItemMediaProps = $props();
</script>

<div bind:this={ref} class={cn(itemMediaVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</div>
