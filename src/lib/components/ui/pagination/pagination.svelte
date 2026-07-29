<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Page = { type: 'page'; value: number };
	type Ellipsis = { type: 'ellipsis' };
	type PageItem = (Page | Ellipsis) & { key: string };

	type ChildrenProps = {
		pages: PageItem[];
		range: { start: number; end: number };
		currentPage: number;
	};

	let {
		ref = $bindable(null),
		class: className,
		count,
		perPage = 10,
		page = $bindable(1),
		siblingCount = 1,
		children: childrenSnippet,
		...restProps
	}: Omit<PaginationPrimitive.RootProps, 'children'> & {
		count: number;
		perPage?: number;
		siblingCount?: number;
		children?: Snippet<[ChildrenProps]>;
	} = $props();
</script>

<PaginationPrimitive.Root
	bind:ref
	bind:page
	{count}
	{perPage}
	{siblingCount}
	class={cn('mx-auto flex w-full justify-center', className)}
	{...restProps}
>
	{#snippet children(snippetProps)}
		{@render childrenSnippet?.(snippetProps)}
	{/snippet}
</PaginationPrimitive.Root>
