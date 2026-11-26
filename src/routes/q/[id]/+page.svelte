<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
	import { formatQuizCode } from '#lib/quizCode.js';
	import { favourites, myQuizzes, sharedQuizzes, takenQuizzes } from '#lib/storage.js';
	import type { MyQuiz, TakenQuiz } from '#lib/types.js';

	let { data } = $props();
	const quiz = $derived(data.quiz);

	// Browser-only state, filled after mounting.
	let mine = $state<MyQuiz | undefined>();
	let isFavourite = $state(false);
	let lastTaken = $state<TakenQuiz | undefined>();

	afterNavigate((nav) => {
		const { id, title } = quiz;
		mine = myQuizzes.list().find((q) => q.id === id);
		isFavourite = favourites.has(id);
		lastTaken = takenQuizzes.list().find((q) => q.id === id);

		// Keep stored titles current if the author renamed the quiz.
		favourites.update(id, { title });
		takenQuizzes.update(id, { title });
		if (mine) myQuizzes.update(id, { title });

		// "Shared with you": the page was opened directly from a link (pasted, chat, e-mail…), not by
		// clicking around inside QuizLab, and it isn't the user's own quiz.
		if (nav.type === 'enter' && !mine) sharedQuizzes.save({ id, title, date: new Date().toISOString() });
		else sharedQuizzes.update(id, { title });
	});

	function toggleFavourite() {
		if (isFavourite) favourites.remove(quiz.id);
		else favourites.save({ id: quiz.id, title: quiz.title });
		isFavourite = !isFavourite;
	}

	const shareUrl = $derived(`${page.url.origin}/q/${quiz.id}`);
	let status = $state('');
	let shareInput = $state<HTMLInputElement>();

	async function copyShareLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			status = 'Share link copied.';
		} catch {
			shareInput?.select();
			status = "Couldn't copy automatically. The link is selected, press Ctrl+C to copy it.";
		}
	}

	const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
	const formatDate = (iso: string) => dateFormat.format(new Date(iso));
	const n = $derived(quiz.questionCount);
</script>

<svelte:head>
	<title>{quiz.title} · QuizLab</title>
</svelte:head>

<Breadcrumbs
	items={[
		quiz.visibility === 'public' ? { label: 'Catalogue', href: '/quizzes' } : { label: 'Home', href: '/' },
		{ label: quiz.title }
	]}
/>

<article class="detail">
	<header>
		<h1>{quiz.title}</h1>
		{#if quiz.tags.length}
			<ul class="chip-list" aria-label="Tags">
				{#each quiz.tags as tag (tag)}<li class="chip">{tag}</li>{/each}
			</ul>
		{/if}
	</header>

	{#if quiz.description}
		<p class="description">{quiz.description}</p>
	{/if}

	<dl class="facts">
		<div>
			<dt>Questions</dt>
			<dd>{n}</dd>
		</div>
		<div>
			<dt>Quiz code</dt>
			<dd class="code">{formatQuizCode(quiz.id)}</dd>
		</div>
		<div>
			<dt>Created</dt>
			<dd><time datetime={quiz.createdAt}>{formatDate(quiz.createdAt)}</time></dd>
		</div>
		{#if quiz.updatedAt !== quiz.createdAt}
			<div>
				<dt>Updated</dt>
				<dd><time datetime={quiz.updatedAt}>{formatDate(quiz.updatedAt)}</time></dd>
			</div>
		{/if}
		{#if lastTaken}
			<div>
				<dt>Your last score</dt>
				<dd>{Math.round(lastTaken.score * 100)} %</dd>
			</div>
		{/if}
	</dl>

	<a href="/q/{quiz.id}/play" role="button" class="full-width">Take quiz</a>

	<div class="secondary-actions">
		<button type="button" class="secondary outline" aria-pressed={isFavourite} onclick={toggleFavourite}>
			<span aria-hidden="true">{isFavourite ? '★' : '☆'}</span>
			{isFavourite ? 'In favourites' : 'Add to favourites'}
		</button>
		{#if mine}
			<a href="/q/{quiz.id}/edit?key={encodeURIComponent(mine.editToken)}" role="button" class="secondary outline">
				Edit quiz
			</a>
		{/if}
	</div>
</article>

<section class="share" aria-labelledby="share-heading">
	<h2 id="share-heading">Share this quiz</h2>
	<label for="share-link">Share link</label>
	<input id="share-link" type="text" readonly value={shareUrl} bind:this={shareInput} />
	<button type="button" class="outline full-width" onclick={copyShareLink}>Copy share link</button>
	<p class="status" role="status">{status}</p>
</section>

<style>
	.detail header {
		margin-bottom: 1rem;
	}

	h1 {
		margin-bottom: 0.75rem;
		overflow-wrap: anywhere;
	}

	.description {
		white-space: pre-line;
		overflow-wrap: anywhere;
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
		gap: 0.75rem;
		margin: 0 0 1.25rem;
	}

	.facts div {
		padding: 0.6rem 0.8rem;
		border-radius: var(--pico-border-radius);
		background: var(--ql-surface);
	}

	.facts dt {
		font-size: 0.8rem;
		color: var(--pico-muted-color);
	}

	.facts dd {
		margin: 0;
		font-weight: 600;
	}

	.code {
		font-family: var(--pico-font-family-monospace);
		letter-spacing: 0.08em;
	}

	.secondary-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.secondary-actions > * {
		flex: 1 1 12rem;
		margin: 0;
	}

	.share h2 {
		font-size: 1.15rem;
	}

	.status {
		min-height: 1.5em;
		text-align: center;
	}
</style>
