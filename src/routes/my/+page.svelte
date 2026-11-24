<script lang="ts">
	import { onMount } from 'svelte';
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
	import { formatQuizCode } from '#lib/quizCode.js';
	import { myQuizzes } from '#lib/storage.js';
	import type { MyQuiz } from '#lib/types.js';

	// localStorage only exists in the browser, so the list is read after mounting.
	let quizzes = $state<MyQuiz[] | null>(null);
	onMount(() => (quizzes = myQuizzes.list()));
</script>

<svelte:head>
	<title>My quizzes · QuizLab</title>
</svelte:head>

<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My quizzes' }]} />
<h1>My quizzes</h1>
<p class="muted">
	Quizzes created or edited in this browser. The list is stored only on this device – if you clear your browser data,
	it's gone, so keep your edit links somewhere safe too.
</p>

{#if quizzes === null}
	<p aria-busy="true">Loading your quizzes…</p>
{:else if quizzes.length === 0}
	<div class="notice">
		<p><strong>You haven't created a quiz in this browser yet.</strong></p>
		<p>Quizzes you create will appear here, with their edit links.</p>
		<a href="/new" role="button">Create a quiz</a>
	</div>
{:else}
	<ul class="my-list">
		{#each quizzes as quiz (quiz.id)}
			<li>
				<article>
					<h2>{quiz.title}</h2>
					<p class="muted">Quiz code {formatQuizCode(quiz.id)}</p>
					<div class="actions">
						<a href="/q/{quiz.id}/edit?key={encodeURIComponent(quiz.editToken)}" role="button">
							Edit <span class="visually-hidden">“{quiz.title}”</span>
						</a>
						<a href="/q/{quiz.id}" role="button" class="secondary outline">
							Open <span class="visually-hidden">“{quiz.title}”</span>
						</a>
					</div>
				</article>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.my-list {
		padding: 0;
	}

	.my-list li {
		list-style: none;
	}

	.my-list article {
		margin-bottom: 1rem;
	}

	h2 {
		font-size: 1.15rem;
		margin-bottom: 0.25rem;
		overflow-wrap: anywhere;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
