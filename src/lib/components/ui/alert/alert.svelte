<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const alertVariants = tv({
		base: 'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
		variants: {
			variant: {
				default:
					'border-blue-200 bg-blue-50 text-blue-900 dark:border-slate-400/30 dark:bg-slate-500/15 dark:text-slate-200 *:data-[slot=alert-description]:text-blue-700 dark:*:data-[slot=alert-description]:text-slate-300 [&>svg]:text-blue-500 dark:[&>svg]:text-slate-400',
				destructive:
					'border-red-300 bg-red-100 text-red-900 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200 *:data-[slot=alert-description]:text-red-800 dark:*:data-[slot=alert-description]:text-red-300 [&>svg]:text-red-600 dark:[&>svg]:text-red-400',
				warning:
					'border-amber-400 bg-amber-100 text-foreground dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200 *:data-[slot=alert-description]:text-foreground/80 dark:*:data-[slot=alert-description]:text-amber-300 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type AlertVariant = VariantProps<typeof alertVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert"
	class={cn(alertVariants({ variant }), className)}
	{...restProps}
	role="alert"
>
	{@render children?.()}
</div>
