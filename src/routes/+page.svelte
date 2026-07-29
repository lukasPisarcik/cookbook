<script lang="ts">
	import { d } from '$lib';
</script>

<div class="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center gap-6 p-6">
	<div class="w-full max-w-xl space-y-4 text-center">
		<h1 class="text-4xl font-bold tracking-tight">{d.appTitle}</h1>
		<p class="text-muted-foreground">{d.appDescription}</p>
	</div>
</div>
