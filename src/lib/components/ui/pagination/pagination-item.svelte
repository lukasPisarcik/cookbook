<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLLIElement> & { ref?: HTMLLIElement | null } = $props();
</script>

<li bind:this={ref} class={cn('', className)} {...restProps}>
	{@render children?.()}
</li>
