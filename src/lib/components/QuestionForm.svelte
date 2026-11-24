<script lang="ts">
	import { tick } from 'svelte';
	import { LIMITS } from '#lib/limits.js';
	import { newOption, TYPE_LABELS, validateQuestion, type DraftQuestion } from '#lib/editor.js';

	let {
		draft = $bindable(),
		onsave,
		onchangetype
	}: { draft: DraftQuestion; onsave: () => void; onchangetype: () => void } = $props();

	// Validation errors update live once shown, so fixed problems disappear from the list.
	let validated = $state(false);
	const errors = $derived(validated ? validateQuestion(draft) : []);
	let errorBox = $state<HTMLElement>();

	async function addAnswer() {
		const option = newOption();
		draft.options.push(option);
		await tick();
		document.getElementById(`answer-${option.id}`)?.focus();
	}

	function removeAnswer(i: number) {
		draft.options.splice(i, 1);
	}

	function markCorrect(i: number) {
		draft.options.forEach((o, j) => (o.correct = j === i));
	}

	async function save() {
		validated = true;
		if (errors.length) {
			await tick();
			errorBox?.focus();
			return;
		}
		onsave();
	}
</script>

<div class="type-row">
	<span class="chip">{TYPE_LABELS[draft.type]}</span>
	<button type="button" class="link-button" onclick={onchangetype}>Change type</button>
</div>

<label>
	Question
	<textarea bind:value={draft.text} rows="3" maxlength={LIMITS.text} required></textarea>
</label>

{#if draft.type === 'truefalse'}
	<fieldset>
		<legend>Correct answer</legend>
		<label><input type="radio" name="tf-correct" value={true} bind:group={draft.correct} /> True</label>
		<label><input type="radio" name="tf-correct" value={false} bind:group={draft.correct} /> False</label>
	</fieldset>
	<label>
		Why is the other answer wrong? (optional)
		<textarea bind:value={draft.incorrectExplanation} rows="2" maxlength={LIMITS.explanation}></textarea>
	</label>
{:else}
	<fieldset class="answers">
		<legend>
			<span>Answers</span>
			<small>{draft.type === 'single' ? 'Select the correct one' : 'Select all correct answers'}</small>
		</legend>
		{#each draft.options as option, i (option.id)}
			<div class="answer" class:correct={option.correct}>
				{#if draft.type === 'single'}
					<input
						id="correct-{option.id}"
						type="radio"
						name="single-correct"
						checked={option.correct}
						onchange={() => markCorrect(i)}
					/>
				{:else}
					<input id="correct-{option.id}" type="checkbox" bind:checked={option.correct} />
				{/if}
				<label for="correct-{option.id}" class="visually-hidden">Answer {i + 1} is correct</label>
				<label for="answer-{option.id}" class="visually-hidden">Answer {i + 1}</label>
				<input
					id="answer-{option.id}"
					type="text"
					bind:value={option.text}
					maxlength={LIMITS.text}
					placeholder="Answer {i + 1}"
				/>
				<button
					type="button"
					class="remove secondary outline"
					aria-label="Remove answer {i + 1}"
					onclick={() => removeAnswer(i)}>×</button
				>
			</div>
			{#if !option.correct}
				<details open={option.explanation !== ''}>
					<summary>Why is answer {i + 1} wrong? (optional)</summary>
					<label for="why-{option.id}" class="visually-hidden">Why answer {i + 1} is wrong</label>
					<textarea id="why-{option.id}" bind:value={option.explanation} rows="2" maxlength={LIMITS.explanation}
					></textarea>
				</details>
			{/if}
		{/each}
		{#if draft.options.length < LIMITS.options}
			<button type="button" class="outline full-width" onclick={addAnswer}>+ Add answer</button>
		{/if}
	</fieldset>
{/if}

<label>
	Explanation (optional)
	<textarea
		bind:value={draft.explanation}
		rows="3"
		maxlength={LIMITS.explanation}
		placeholder={draft.type === 'multiple' ? 'Why are these the right answers?' : 'Why is this the right answer?'}
	></textarea>
</label>

{#if errors.length}
	<div class="error-summary" role="alert" tabindex="-1" bind:this={errorBox}>
		<p>Before saving the question, fix:</p>
		<ul>
			{#each errors as error (error)}<li>{error}</li>{/each}
		</ul>
	</div>
{/if}

<button type="button" class="full-width" onclick={save}>Save question</button>

<style>
	.type-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.answers legend {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.answers legend small {
		color: var(--pico-muted-color);
	}

	.answer {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.25rem 0.5rem 0.25rem 0.9rem;
		margin-bottom: 0.5rem;
		border: 1px solid var(--pico-form-element-border-color);
		border-radius: var(--pico-border-radius);
	}

	.answer.correct {
		border: 2px solid var(--pico-primary);
		background: var(--ql-selected-bg);
	}

	.answer input[type='radio'],
	.answer input[type='checkbox'] {
		flex: none;
		margin: 0;
	}

	.answer input[type='text'] {
		flex: 1;
		min-width: 0;
		margin: 0;
		border: 0;
		background: transparent;
	}

	.answer.correct input[type='text'] {
		font-weight: 600;
	}

	.remove {
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		margin: 0;
		border: 0;
		font-size: 1.4rem;
		line-height: 1;
	}

	details {
		margin: -0.25rem 0 0.75rem 0.9rem;
	}

	details summary {
		font-size: 0.875rem;
	}
</style>
