<script lang="ts">
	import { page } from '$app/state';
	import { formatQuizCode } from '#lib/quizCode.js';

	let { id, title, editToken }: { id: string; title: string; editToken: string } = $props();

	const shareUrl = $derived(`${page.url.origin}/q/${id}`);
	const editUrl = $derived(`${page.url.origin}/q/${id}/edit?key=${encodeURIComponent(editToken)}`);

	let status = $state('');

	async function copy(text: string, what: string, input: HTMLInputElement | undefined) {
		try {
			await navigator.clipboard.writeText(text);
			status = `${what} copied.`;
		} catch {
			input?.select();
			status = `Couldn't copy automatically. The ${what.toLowerCase()} is selected, press Ctrl+C to copy it.`;
		}
	}

	let shareInput = $state<HTMLInputElement>();
	let editInput = $state<HTMLInputElement>();
</script>

<h2>{title}</h2>
<p class="muted">Share the quiz or keep your private edit link safe.</p>

<label for="share-link">Share link</label>
<input id="share-link" type="text" readonly value={shareUrl} bind:this={shareInput} />
<small class="muted">Anyone with this link or code can take the quiz, but can't edit it.</small>
<button type="button" class="outline full-width" onclick={() => copy(shareUrl, 'Share link', shareInput)}>
	Copy share link
</button>

<p class="code-row">
	<span>Quiz code</span>
	<strong class="code">{formatQuizCode(id)}</strong>
</p>

<section class="notice private" aria-labelledby="edit-link-heading">
	<h3 id="edit-link-heading">Private edit link</h3>
	<p>
		Anyone with this link can edit or delete the quiz. Keep it private and save it somewhere safe – if you lose
		it, the quiz can't be edited anymore. It's also remembered in “My quizzes” in this browser.
	</p>
	<label for="edit-link">Edit link (private)</label>
	<input id="edit-link" type="text" readonly value={editUrl} bind:this={editInput} />
	<button type="button" class="outline full-width" onclick={() => copy(editUrl, 'Edit link', editInput)}>
		Copy edit link
	</button>
</section>

<p class="status" role="status">{status}</p>

<a href="/q/{id}" role="button" class="full-width">Done</a>

<style>
	h2 {
		margin-bottom: 0.25rem;
	}

	.muted {
		color: var(--pico-muted-color);
	}

	small.muted {
		display: block;
		margin: -0.5rem 0 0.75rem;
	}

	.code-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin: 1.5rem 0;
		font-weight: 600;
	}

	.code {
		font-size: 1.5rem;
		letter-spacing: 0.12em;
		font-family: var(--pico-font-family-monospace);
	}

	.private h3 {
		font-size: 1.05rem;
		margin-bottom: 0.5rem;
	}

	.private button {
		margin-bottom: 0;
	}

	.status {
		min-height: 1.5em;
		text-align: center;
	}
</style>
