<script lang="ts">
	import { systemErrorText, type SystemErrorInfo } from '#lib/systemError.js';

	let { error }: { error: SystemErrorInfo } = $props();

	let copyStatus = $state('');
	let details = $state<HTMLElement>();

	async function copy() {
		try {
			await navigator.clipboard.writeText(systemErrorText(error));
			copyStatus = 'Error details copied.';
		} catch {
			if (details) getSelection()?.selectAllChildren(details);
			copyStatus = "Couldn't copy automatically. The details are selected, press Ctrl+C to copy them.";
		}
	}

	const time = $derived(new Date(error.time).toLocaleString());
</script>

<p class="what">{error.message}</p>

<dl class="details" bind:this={details}>
	<div>
		<dt>Subsystem</dt>
		<dd>{error.subsystem}</dd>
	</div>
	<div>
		<dt>Details</dt>
		<dd>{error.detail}</dd>
	</div>
	<div>
		<dt>Error code</dt>
		<dd><code>{error.code}</code></dd>
	</div>
	{#if error.status}
		<div>
			<dt>HTTP status</dt>
			<dd>{error.status}</dd>
		</div>
	{/if}
	{#if error.reference}
		<div>
			<dt>Reference</dt>
			<dd><code>{error.reference}</code></dd>
		</div>
	{/if}
	<div>
		<dt>Time</dt>
		<dd><time datetime={error.time}>{time}</time></dd>
	</div>
</dl>

<button type="button" class="secondary outline full-width" onclick={copy}>Copy error details</button>
<p class="copy-status" role="status">{copyStatus}</p>

<style>
	.what {
		font-weight: 600;
	}

	.details {
		margin: 0 0 1rem;
		padding: 0.75rem 1rem;
		border-radius: var(--pico-border-radius);
		background: var(--ql-surface);
		font-size: 0.9rem;
	}

	.details div {
		display: grid;
		grid-template-columns: 7.5rem 1fr;
		gap: 0.75rem;
		padding: 0.3rem 0;
	}

	.details div + div {
		border-top: 1px solid var(--pico-muted-border-color);
	}

	dt {
		font-weight: 600;
	}

	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}

	@media (max-width: 420px) {
		.details div {
			grid-template-columns: 1fr;
			gap: 0;
		}
	}

	.copy-status {
		min-height: 1.5em;
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		text-align: center;
	}
</style>
