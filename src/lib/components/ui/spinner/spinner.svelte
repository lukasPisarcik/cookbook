<script lang="ts">
	import { cn } from '$lib/utils';
	import { Loader2 } from '@lucide/svelte';

	let { class: className = '', size = 24 }: { class?: string; size?: number } = $props();
</script>

<Loader2 class={cn('animate-spin text-primary', className)} {size} />
