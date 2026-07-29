<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import { ChevronRight } from '@lucide/svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PaginationPrimitive.NextButtonProps = $props();
</script>

<PaginationPrimitive.NextButton
	bind:ref
	class={cn(buttonVariants({ variant: 'ghost', size: 'default' }), 'gap-1 pr-2.5', className)}
	{...restProps}
>
	<span>Next</span>
	<ChevronRight class="size-4" />
</PaginationPrimitive.NextButton>
