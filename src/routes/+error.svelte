<script lang="ts">
	import { page } from '$app/state';
	import SystemErrorDetails from '#lib/components/SystemErrorDetails.svelte';

	const notFound = $derived(page.status === 404);
	const system = $derived(page.error?.system);
	const heading = $derived(notFound ? 'Page not found' : system ? 'System error' : 'Something went wrong');
</script>

<svelte:head>
	<title>{heading} · QuizLab</title>
</svelte:head>

<h1>{heading}</h1>
{#if notFound}
	<p>We couldn't find this page. The link may be mistyped, or the quiz may have been deleted.</p>
{:else if system}
	<section class="system-error" aria-label="Error details">
		<p>This page couldn't be loaded because of a problem in QuizLab. Try again in a moment.</p>
		<SystemErrorDetails error={system} />
	</section>
{:else}
	<p>{page.error?.message ?? 'Try again in a moment.'}</p>
{/if}
<p>
	<a href="/" role="button">Go to the home page</a>
	<a href="/new" role="button" class="secondary outline">Create a quiz</a>
</p>

<style>
	.system-error {
		margin-bottom: var(--pico-spacing);
		padding: 1rem;
		border: 2px solid var(--ql-danger);
		border-left-width: 0.5rem;
		border-radius: var(--pico-border-radius);
	}
</style>
