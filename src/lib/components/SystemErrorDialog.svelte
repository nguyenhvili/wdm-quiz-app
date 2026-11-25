<!--
	Modal window for failures of the app itself (database, server, network). Deliberately looks
	different from form validation, so users can tell "the system broke" from "I typed something wrong".
-->
<script lang="ts">
	import SystemErrorDetails from './SystemErrorDetails.svelte';
	import type { SystemErrorInfo } from '#lib/systemError.js';

	let {
		error = $bindable(null),
		action,
		note = 'Your work is still on this page. Keep it open and try again later.'
	}: {
		error?: SystemErrorInfo | null;
		/** What the user was doing, e.g. "save the quiz". */
		action: string;
		note?: string;
	} = $props();

	let dialog: HTMLDialogElement;
	const id = $props.id();

	$effect(() => {
		if (error && !dialog.open) dialog.showModal();
		else if (!error && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={() => (error = null)} role="alertdialog" aria-labelledby="{id}-title">
	<article>
		<header class="bar">
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
				<path d="M12 3 2 21h20L12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
				<path d="M12 10v5M12 18v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			<h2 id="{id}-title">System error</h2>
		</header>
		{#if error}
			<p>Couldn't {action} because of a problem in QuizLab, not in your quiz.</p>
			<SystemErrorDetails {error} />
			<p class="muted note">{note}</p>
		{/if}
		<footer>
			<button type="button" onclick={() => (error = null)}>Close</button>
		</footer>
	</article>
</dialog>

<style>
	article {
		padding-top: 0;
		max-width: 34rem;
	}

	/* Overrides Pico's article header so the red bar spans the whole top edge. */
	header.bar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0 calc(var(--pico-block-spacing-horizontal) * -1) var(--pico-spacing);
		padding: 0.75rem var(--pico-block-spacing-horizontal);
		background: var(--ql-danger);
		color: var(--ql-on-danger);
		border-bottom: 0;
		border-radius: var(--pico-border-radius) var(--pico-border-radius) 0 0;
	}

	header.bar h2 {
		margin: 0;
		font-size: 1.15rem;
		color: inherit;
	}

	.note {
		margin-bottom: 0;
		font-size: 0.875rem;
	}

	footer button {
		margin-bottom: 0;
	}
</style>
