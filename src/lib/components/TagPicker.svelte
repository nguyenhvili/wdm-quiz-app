<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '#lib/api.js';
	import { LIMITS } from '#lib/limits.js';
	import type { SystemErrorInfo } from '#lib/systemError.js';
	import SystemErrorDetails from './SystemErrorDetails.svelte';

	let { tags = $bindable(), ondone }: { tags: string[]; ondone: () => void } = $props();

	let popular = $state<string[]>([]);
	let loading = $state(true);
	let search = $state('');

	let loadError = $state<SystemErrorInfo | null>(null);

	onMount(async () => {
		const res = await api<{ tags: { tag: string }[] }>('/api/tags');
		if (res.ok) popular = res.data.tags.map((t) => t.tag);
		else if ('systemError' in res) loadError = res.systemError;
		loading = false;
	});

	const query = $derived(search.trim().toLowerCase());
	const all = $derived([...new Set([...tags, ...popular])]);
	const shown = $derived(all.filter((t) => t.includes(query)));
	const canAdd = $derived(query !== '' && !all.includes(query) && tags.length < LIMITS.tags);
	const full = $derived(tags.length >= LIMITS.tags);

	function toggle(tag: string, checked: boolean) {
		tags = checked ? [...tags, tag] : tags.filter((t) => t !== tag);
	}

	function addCustom(e: SubmitEvent) {
		e.preventDefault();
		if (!canAdd) return;
		tags = [...tags, query];
		search = '';
	}
</script>

<form class="search" onsubmit={addCustom}>
	<label for="tag-search">Search tags</label>
	<input
		id="tag-search"
		type="search"
		bind:value={search}
		maxlength={LIMITS.tag}
		placeholder="Search by subject"
		autocomplete="off"
	/>
	{#if canAdd}
		<button type="submit" class="outline full-width">+ Add tag “{query}”</button>
	{/if}
</form>

{#if loadError}
	<section class="system-error" aria-labelledby="tags-error-heading">
		<h2 id="tags-error-heading">System error</h2>
		<p>Existing tags couldn't be loaded. You can still type your own tags above.</p>
		<SystemErrorDetails error={loadError} />
	</section>
{/if}

<fieldset>
	<legend class="tags-legend">
		<span>Tags</span>
		<small>Select one or more</small>
	</legend>
	{#if loading}
		<p aria-busy="true">Loading tags…</p>
	{:else if shown.length === 0}
		<p class="muted">
			{query ? 'No tag matches your search. Add it as a new tag above.' : 'No tags yet. Type one above to add it.'}
		</p>
	{:else}
		<ul class="choice-list">
			{#each shown as tag (tag)}
				{@const checked = tags.includes(tag)}
				<li>
					<label class="choice" class:selected={checked}>
						<input
							type="checkbox"
							{checked}
							disabled={!checked && full}
							onchange={(e) => toggle(tag, e.currentTarget.checked)}
						/>
						{tag}
					</label>
				</li>
			{/each}
		</ul>
	{/if}
</fieldset>

<p class="count" aria-live="polite">
	{tags.length}
	{tags.length === 1 ? 'tag' : 'tags'} selected{full ? ` (maximum is ${LIMITS.tags})` : ''}
</p>
<button type="button" class="full-width" onclick={ondone}>Done</button>

<style>
	.search {
		margin-bottom: 1rem;
	}

	.tags-legend {
		display: flex;
		justify-content: space-between;
		width: 100%;
		font-weight: 600;
	}

	.tags-legend small,
	.count {
		color: var(--pico-muted-color);
		font-weight: 400;
	}

	.count {
		text-align: center;
		font-size: 0.875rem;
	}

	.system-error {
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		border: 2px solid var(--ql-danger);
		border-radius: var(--pico-border-radius);
	}

	.system-error h2 {
		margin-bottom: 0.25rem;
		font-size: 1rem;
		color: var(--ql-danger);
	}
</style>
