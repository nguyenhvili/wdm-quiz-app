<!--
	Personalised home screen (F8). Everything below the intro comes from this browser's localStorage only.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { formatQuizCode } from '#lib/quizCode.js';
	import { favourites, hiddenFromHome, myQuizzes, sharedQuizzes, takenQuizzes } from '#lib/storage.js';
	import type { FavouriteQuiz, MyQuiz, SharedQuiz, TakenQuiz } from '#lib/types.js';

	const MY_ROW = 6;

	let loaded = $state(false);
	let taken = $state<TakenQuiz[]>([]);
	let mine = $state<MyQuiz[]>([]);
	let hidden = $state<string[]>([]);
	let favs = $state<FavouriteQuiz[]>([]);
	let shared = $state<SharedQuiz[]>([]);
	let status = $state('');

	function load() {
		taken = takenQuizzes.list();
		mine = myQuizzes.list();
		hidden = hiddenFromHome.list().map((h) => h.id);
		favs = favourites.list();
		shared = sharedQuizzes.list();
		loaded = true;
	}
	onMount(load);

	const myRow = $derived(mine.filter((q) => !hidden.includes(q.id)).slice(0, MY_ROW));
	const empty = $derived(!taken.length && !myRow.length && !favs.length && !shared.length);

	const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	const formatDate = (iso: string) => dateFormat.format(new Date(iso));

	type Section = 'taken' | 'mine' | 'favourites' | 'shared';
	const SECTION_NAMES: Record<Section, string> = {
		taken: 'Recently taken',
		mine: 'My quizzes',
		favourites: 'Favourites',
		shared: 'Shared with you'
	};

	async function remove(section: Section, quiz: { id: string; title: string }) {
		if (section === 'taken') takenQuizzes.remove(quiz.id);
		if (section === 'mine') hiddenFromHome.save({ id: quiz.id });
		if (section === 'favourites') favourites.remove(quiz.id);
		if (section === 'shared') sharedQuizzes.remove(quiz.id);
		load();
		status =
			section === 'mine'
				? `“${quiz.title}” hidden from the home screen. It's still in My quizzes.`
				: `“${quiz.title}” removed from ${SECTION_NAMES[section]}.`;
		// The removed card's button is gone: move focus to its section, or to the page heading.
		await tick();
		(document.getElementById(`${section}-heading`) ?? document.getElementById('home-heading'))?.focus();
	}
</script>

<svelte:head>
	<title>QuizLab</title>
</svelte:head>

<section class="intro" aria-labelledby="home-heading">
	<h1 id="home-heading" tabindex="-1">QuizLab</h1>
	<p class="lead">Create, share and take learning quizzes – and learn from your mistakes. No account needed.</p>
	<div class="intro-actions">
		<a href="/new" role="button">+ Create a quiz</a>
		<form class="search" method="get" action="/quizzes" role="search">
			<label for="home-search" class="visually-hidden">Search quizzes by title or tag</label>
			<input id="home-search" type="search" name="q" placeholder="Title or tag" />
			<button type="submit" class="secondary">Search</button>
		</form>
	</div>
</section>

<p class="visually-hidden" role="status">{status}</p>

{#snippet removeButton(section: Section, quiz: { id: string; title: string })}
	<button
		type="button"
		class="remove secondary outline"
		aria-label={section === 'mine'
			? `Hide “${quiz.title}” from the home screen`
			: `Remove “${quiz.title}” from ${SECTION_NAMES[section]}`}
		title={section === 'mine' ? 'Hide from home' : 'Remove from home'}
		onclick={() => remove(section, quiz)}>×</button
	>
{/snippet}

{#if !loaded}
	<p aria-busy="true">Loading your quizzes…</p>
{:else if empty}
	<div class="notice welcome">
		<p><strong>Your quizzes will show up here.</strong></p>
		<p>
			Quizzes you take, create, mark as favourite or open from a shared link appear on this screen. They're saved only
			in this browser.
		</p>
	</div>
{:else}
	{#if favs.length}
		<section aria-labelledby="favourites-heading">
			<h2 id="favourites-heading" tabindex="-1">Favourites</h2>
			<ul class="cards">
				{#each favs as quiz (quiz.id)}
					<li class="card">
						<a href="/q/{quiz.id}" class="card-title"><span aria-hidden="true">★ </span>{quiz.title}</a>
						{@render removeButton('favourites', quiz)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if taken.length}
		<section aria-labelledby="taken-heading">
			<h2 id="taken-heading" tabindex="-1">Recently taken</h2>
			<ul class="cards">
				{#each taken as quiz (quiz.id)}
					<li class="card">
						<a href="/q/{quiz.id}" class="card-title">{quiz.title}</a>
						<p class="card-meta">
							<time datetime={quiz.date}>{formatDate(quiz.date)}</time> ·
							<span class="score">Score {Math.round(quiz.score * 100)} %</span>
						</p>
						{@render removeButton('taken', quiz)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if myRow.length}
		<section aria-labelledby="mine-heading">
			<div class="section-head">
				<h2 id="mine-heading" tabindex="-1">My quizzes</h2>
				<a href="/my">See all my quizzes ({mine.length})</a>
			</div>
			<ul class="cards row">
				{#each myRow as quiz (quiz.id)}
					<li class="card">
						<a href="/q/{quiz.id}" class="card-title">{quiz.title}</a>
						<p class="card-meta">Code {formatQuizCode(quiz.id)}</p>
						{@render removeButton('mine', quiz)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if shared.length}
		<section aria-labelledby="shared-heading">
			<h2 id="shared-heading" tabindex="-1">Shared with you</h2>
			<p class="muted section-hint">Quizzes you opened from a shared link.</p>
			<ul class="cards">
				{#each shared as quiz (quiz.id)}
					<li class="card">
						<a href="/q/{quiz.id}" class="card-title">{quiz.title}</a>
						<p class="card-meta">Opened <time datetime={quiz.date}>{formatDate(quiz.date)}</time></p>
						{@render removeButton('shared', quiz)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}

<style>
	.intro {
		margin-bottom: 2rem;
	}

	.intro h1 {
		margin-bottom: 0.5rem;
	}

	.lead {
		font-size: 1.1rem;
	}

	.intro-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.intro-actions > a {
		margin: 0;
	}

	.search {
		display: flex;
		flex: 1 1 18rem;
		gap: 0.5rem;
		margin: 0;
	}

	.search input {
		margin: 0;
	}

	.search button {
		width: auto;
		margin: 0;
	}

	section + section {
		margin-top: 1.75rem;
	}

	h2 {
		font-size: 1.25rem;
		margin-bottom: 0.75rem;
	}

	.section-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: 0 1rem;
	}

	.section-hint {
		margin: -0.5rem 0 0.75rem;
		font-size: 0.875rem;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.75rem;
		padding: 0;
		margin: 0;
	}

	/* "My quizzes" is a single row that scrolls sideways inside itself, never the whole page. */
	.cards.row {
		display: flex;
		overflow-x: auto;
		scroll-snap-type: x proximity;
		padding-bottom: 0.5rem;
	}

	.cards.row .card {
		flex: 0 0 min(15rem, 80%);
		scroll-snap-align: start;
	}

	.card {
		position: relative;
		list-style: none;
		margin: 0;
		padding: 0.85rem 3rem 0.85rem 1rem;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		background: var(--pico-card-background-color);
	}

	.card-title {
		display: block;
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.card-meta {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: var(--pico-muted-color);
	}

	.score {
		font-weight: 600;
		color: var(--pico-color);
	}

	.remove {
		position: absolute;
		top: 0.35rem;
		right: 0.35rem;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		margin: 0;
		border: 0;
		font-size: 1.25rem;
		line-height: 1;
	}

	.welcome {
		margin-top: 1rem;
	}
</style>
