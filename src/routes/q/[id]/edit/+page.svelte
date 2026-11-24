<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
	import QuizEditor from '#lib/components/QuizEditor.svelte';
	import { myQuizzes } from '#lib/storage.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const editToken = $derived(page.url.searchParams.get('key') ?? '');
	const { title, description, tags, visibility, questions } = $derived(data.quiz);

	// Opening a valid edit link remembers the quiz in "My quizzes" on this device.
	onMount(() => {
		if (data.canEdit) myQuizzes.save({ id: data.quiz.id, title: data.quiz.title, editToken });
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
	{#if !data.canEdit}<title>Edit link not valid · QuizLab</title>{/if}
</svelte:head>

{#if data.canEdit}
	{#key data.quiz.id}
		<QuizEditor
			initial={{ title, description, tags, visibility, questions }}
			existing={{ id: data.quiz.id, editToken }}
		/>
	{/key}
{:else}
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Edit link not valid' }]} />
	<h1>Edit link not valid</h1>
	<p>
		This link doesn't allow editing “{data.quiz.title}”. Check that you copied the whole edit link, or ask the quiz's
		creator for it.
	</p>
	<p>
		<a href="/q/{data.quiz.id}" role="button">Go to the quiz</a>
		<a href="/my" role="button" class="secondary outline">My quizzes</a>
	</p>
{/if}
