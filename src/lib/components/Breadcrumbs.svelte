<script lang="ts">
	type Crumb = { label: string; href?: string };
	let { items }: { items: Crumb[] } = $props();
</script>

<nav aria-label="breadcrumb">
	<ul>
		{#each items as item, i (i)}
			<li>
				{#if item.href && i < items.length - 1}
					<a href={item.href}>{item.label}</a>
				{:else}
					<span aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
