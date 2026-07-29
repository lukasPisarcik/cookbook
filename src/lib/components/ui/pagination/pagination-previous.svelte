<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import { ChevronLeft } from '@lucide/svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PaginationPrimitive.PrevButtonProps = $props();
</script>

<PaginationPrimitive.PrevButton
	bind:ref
	class={cn(buttonVariants({ variant: 'ghost', size: 'default' }), 'gap-1 pl-2.5', className)}
	{...restProps}
>
	<ChevronLeft class="size-4" />
	<span>Previous</span>
</PaginationPrimitive.PrevButton>
