<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLUListElement> & { ref?: HTMLUListElement | null } = $props();
</script>

<ul bind:this={ref} class={cn('flex flex-row items-center gap-1', className)} {...restProps}>
	{@render children?.()}
</ul>
