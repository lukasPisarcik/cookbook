<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Ellipsis } from '@lucide/svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & { ref?: HTMLSpanElement | null } = $props();
</script>

<span
	bind:this={ref}
	aria-hidden="true"
	class={cn('flex size-9 items-center justify-center', className)}
	{...restProps}
>
	<Ellipsis class="size-4" />
	<span class="sr-only">More pages</span>
</span>
