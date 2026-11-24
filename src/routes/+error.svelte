<script lang="ts">
	import { page } from '$app/state';

	const notFound = $derived(page.status === 404);
	const heading = $derived(notFound ? 'Page not found' : 'Something went wrong');
</script>

<svelte:head>
	<title>{heading} · QuizLab</title>
</svelte:head>

<h1>{heading}</h1>
<p>
	{notFound
		? "We couldn't find this page. The link may be mistyped, or the quiz may have been deleted."
		: 'Try again in a moment.'}
</p>
<p>
	<a href="/" role="button">Go to the home page</a>
	<a href="/new" role="button" class="secondary outline">Create a quiz</a>
</p>
