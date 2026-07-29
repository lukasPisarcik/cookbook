<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';

	let {
		ref = $bindable(null),
		class: className,
		page,
		isActive = false,
		children,
		...restProps
	}: PaginationPrimitive.PageProps & {
		isActive?: boolean;
	} = $props();
</script>

<PaginationPrimitive.Page
	bind:ref
	{page}
	class={cn(buttonVariants({ variant: isActive ? 'outline' : 'ghost', size: 'icon' }), className)}
	aria-current={isActive ? 'page' : undefined}
	{...restProps}
>
	{@render children?.()}
</PaginationPrimitive.Page>
