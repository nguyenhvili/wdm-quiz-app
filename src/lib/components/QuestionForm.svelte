<script lang="ts">
	import { tick } from 'svelte';
	import { LIMITS } from '#lib/limits.js';
	import {
		newItem,
		newOption,
		newPair,
		parseNumber,
		TYPE_LABELS,
		validateQuestion,
		type DraftQuestion
	} from '#lib/editor.js';

	let {
		draft = $bindable(),
		onsave,
		onchangetype
	}: { draft: DraftQuestion; onsave: () => void; onchangetype: () => void } = $props();

	// Validation errors update live once shown, so fixed problems disappear from the list.
	let validated = $state(false);
	const errors = $derived(validated ? validateQuestion(draft) : []);
	let errorBox = $state<HTMLElement>();

	const focusLater = async (id: string) => {
		await tick();
		document.getElementById(id)?.focus();
	};

	// ---- Single / multiple choice
	function addAnswer() {
		const option = newOption();
		draft.options.push(option);
		focusLater(`answer-${option.id}`);
	}
	function markCorrect(i: number) {
		draft.options.forEach((o, j) => (o.correct = j === i));
	}

	// ---- Matching
	function addPair() {
		const pair = newPair();
		draft.pairs.push(pair);
		focusLater(`left-${pair.id}`);
	}

	// ---- Ordering
	function addItem() {
		const item = newItem();
		draft.items.push(item);
		focusLater(`item-${item.id}`);
	}
	async function moveItem(i: number, by: -1 | 1) {
		const list = draft.items;
		[list[i], list[i + by]] = [list[i + by], list[i]];
		// Keep focus on the moved item (or its other arrow at the ends of the list).
		await tick();
		const id = list[i + by].id;
		const button = document.getElementById(`item-${by < 0 ? 'up' : 'down'}-${id}`) as HTMLButtonElement | null;
		(button && !button.disabled ? button : document.getElementById(`item-${by < 0 ? 'down' : 'up'}-${id}`))?.focus();
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

	// Numeric: the accepted range, e.g. [9.71, 9.91], once both numbers are valid.
	const range = $derived.by(() => {
		const value = parseNumber(draft.value);
		const tolerance = parseNumber(draft.tolerance);
		if (value === null || !tolerance) return null;
		const round = (n: number) => Number(n.toPrecision(12)); // hide float noise like 9.709999999
		return [round(value - Math.abs(tolerance)), round(value + Math.abs(tolerance))];
	});

	const hasIncorrectExplanation = $derived(draft.type !== 'single' && draft.type !== 'multiple');
</script>

<div class="type-row">
	<span class="chip">{TYPE_LABELS[draft.type]}</span>
	<button type="button" class="link-button" onclick={onchangetype}>Change type</button>
</div>

<label>
	{draft.type === 'truefalse' ? 'Statement' : 'Question'}
	<textarea
		bind:value={draft.text}
		rows="3"
		maxlength={LIMITS.text}
		required
		placeholder={draft.type === 'truefalse' ? 'e.g. The Earth orbits the Sun.' : ''}
	></textarea>
</label>

{#if draft.type === 'truefalse'}
	<fieldset>
		<legend>The statement is</legend>
		<label><input type="radio" name="tf-correct" value={true} bind:group={draft.correct} /> True</label>
		<label><input type="radio" name="tf-correct" value={false} bind:group={draft.correct} /> False</label>
	</fieldset>
{:else if draft.type === 'numeric'}
	<div class="grid-2">
		<label>
			Correct answer
			<input type="text" inputmode="decimal" bind:value={draft.value} placeholder="e.g. 42" autocomplete="off" />
		</label>
		<label>
			Allowed tolerance (optional)
			<input type="text" inputmode="decimal" bind:value={draft.tolerance} placeholder="e.g. 0.5" autocomplete="off" />
		</label>
	</div>
	<p class="hint">
		{#if range}
			Answers from {range[0]} to {range[1]} count as correct.
		{:else}
			Without a tolerance, only the exact number counts as correct.
		{/if}
	</p>
{:else if draft.type === 'matching'}
	<fieldset class="rows">
		<legend>
			<span>Pairs</span>
			<small>The right column is shuffled for people taking the quiz</small>
		</legend>
		{#each draft.pairs as pair, i (pair.id)}
			<div class="row pair">
				<span class="num" aria-hidden="true">{i + 1}.</span>
				<label for="left-{pair.id}" class="visually-hidden">Pair {i + 1}, left item</label>
				<input id="left-{pair.id}" type="text" bind:value={pair.left} maxlength={LIMITS.text} placeholder="Left item" />
				<span class="arrow" aria-hidden="true">↔</span>
				<label for="right-{pair.id}" class="visually-hidden">Pair {i + 1}, matching right item</label>
				<input id="right-{pair.id}" type="text" bind:value={pair.right} maxlength={LIMITS.text} placeholder="Matches" />
				<button
					type="button"
					class="remove secondary outline"
					aria-label="Remove pair {i + 1}"
					onclick={() => draft.pairs.splice(i, 1)}>×</button
				>
			</div>
		{/each}
		{#if draft.pairs.length < LIMITS.pairs}
			<button type="button" class="outline full-width" onclick={addPair}>+ Add pair</button>
		{/if}
	</fieldset>
{:else if draft.type === 'ordering'}
	<fieldset class="rows">
		<legend>
			<span>Items in the correct order</span>
			<small>They are shuffled for people taking the quiz</small>
		</legend>
		<ol class="items">
			{#each draft.items as item, i (item.id)}
				<li class="row">
					<span class="num" aria-hidden="true">{i + 1}.</span>
					<label for="item-{item.id}" class="visually-hidden">Item {i + 1}</label>
					<input id="item-{item.id}" type="text" bind:value={item.text} maxlength={LIMITS.text} placeholder="Item {i + 1}" />
					<button
						type="button"
						id="item-up-{item.id}"
						class="move secondary outline"
						aria-label="Move item {i + 1} up"
						disabled={i === 0}
						onclick={() => moveItem(i, -1)}>↑</button
					>
					<button
						type="button"
						id="item-down-{item.id}"
						class="move secondary outline"
						aria-label="Move item {i + 1} down"
						disabled={i === draft.items.length - 1}
						onclick={() => moveItem(i, 1)}>↓</button
					>
					<button
						type="button"
						class="remove secondary outline"
						aria-label="Remove item {i + 1}"
						onclick={() => draft.items.splice(i, 1)}>×</button
					>
				</li>
			{/each}
		</ol>
		{#if draft.items.length < LIMITS.items}
			<button type="button" class="outline full-width" onclick={addItem}>+ Add item</button>
		{/if}
	</fieldset>
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
					onclick={() => draft.options.splice(i, 1)}>×</button
				>
			</div>
			{#if !option.correct}
				<div class="why">
					{#if !option.noExplanation}
						<label for="why-{option.id}">Why is answer {i + 1} wrong?</label>
						<textarea
							id="why-{option.id}"
							bind:value={option.explanation}
							rows="2"
							maxlength={LIMITS.explanation}
							aria-invalid={validated && !option.explanation.trim() ? true : undefined}
						></textarea>
					{/if}
					<label class="no-explanation">
						<input type="checkbox" bind:checked={option.noExplanation} />
						No explanation for this answer<span class="visually-hidden"> ({i + 1})</span>
					</label>
				</div>
			{/if}
		{/each}
		{#if draft.options.length < LIMITS.options}
			<button type="button" class="outline full-width" onclick={addAnswer}>+ Add answer</button>
		{/if}
	</fieldset>
{/if}

<fieldset class="explanation">
	<legend>Explanation</legend>
	{#if !draft.noExplanation}
		<label for="explanation" class="visually-hidden">Explanation of the correct answer</label>
		<textarea
			id="explanation"
			bind:value={draft.explanation}
			rows="3"
			maxlength={LIMITS.explanation}
			aria-describedby="explanation-hint"
			aria-invalid={errors.length && !draft.explanation.trim() ? true : undefined}
			placeholder={draft.type === 'multiple' ? 'Why are these the right answers?' : 'Why is this the right answer?'}
		></textarea>
		<small id="explanation-hint" class="hint">People see it after answering – it's how they learn from mistakes.</small>
	{/if}
	<label class="no-explanation">
		<input type="checkbox" bind:checked={draft.noExplanation} />
		No explanation for this question
	</label>
</fieldset>

{#if draft.type === 'truefalse'}
	<fieldset class="explanation">
		<legend>Why is the other answer wrong?</legend>
		{#if !draft.noIncorrectExplanation}
			<label for="tf-why" class="visually-hidden">Why the other answer is wrong</label>
			<textarea
				id="tf-why"
				bind:value={draft.incorrectExplanation}
				rows="2"
				maxlength={LIMITS.explanation}
				aria-invalid={validated && !draft.incorrectExplanation.trim() ? true : undefined}
			></textarea>
		{/if}
		<label class="no-explanation">
			<input type="checkbox" bind:checked={draft.noIncorrectExplanation} />
			No explanation for the other answer
		</label>
	</fieldset>
{:else if hasIncorrectExplanation}
	<label>
		Common mistake – why might an answer be wrong? (optional)
		<textarea bind:value={draft.incorrectExplanation} rows="2" maxlength={LIMITS.explanation}></textarea>
	</label>
{/if}

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

	legend {
		font-weight: 600;
	}

	.answers legend,
	.rows legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0 1rem;
		width: 100%;
	}

	legend small {
		color: var(--pico-muted-color);
		font-weight: 400;
	}

	.hint {
		display: block;
		margin: -0.5rem 0 1rem;
		color: var(--pico-muted-color);
		font-size: 0.875rem;
	}

	.grid-2 {
		display: grid;
		gap: 0 1rem;
	}

	@media (min-width: 576px) {
		.grid-2 {
			grid-template-columns: 1fr 1fr;
		}
	}

	/* Rows of answers, pairs and items: one bordered line with inline controls. */
	.answer,
	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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

	.answer input[type='text'],
	.row input[type='text'] {
		flex: 1;
		min-width: 0;
		margin: 0;
		border: 0;
		background: transparent;
	}

	.answer.correct input[type='text'] {
		font-weight: 600;
	}

	.items {
		padding: 0;
		margin: 0;
	}

	.items li {
		list-style: none;
	}

	.num {
		flex: none;
		min-width: 1.5rem;
		color: var(--pico-muted-color);
	}

	.arrow {
		flex: none;
		color: var(--pico-muted-color);
	}

	/* On narrow screens a pair takes two lines: the left item, and its match below it. */
	@media (max-width: 575px) {
		.pair {
			display: grid;
			grid-template-columns: 1.5rem 1fr 2.75rem;
			grid-template-areas:
				'num left remove'
				'arrow right .';
			row-gap: 0;
		}

		.pair .num {
			grid-area: num;
		}

		.pair input[id^='left-'] {
			grid-area: left;
		}

		.pair .arrow {
			grid-area: arrow;
		}

		.pair input[id^='right-'] {
			grid-area: right;
			border-top: 1px dashed var(--pico-muted-border-color);
			border-radius: 0;
		}

		.pair .remove {
			grid-area: remove;
		}
	}

	.remove,
	.move {
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		margin: 0;
		border: 0;
		font-size: 1.3rem;
		line-height: 1;
	}

	.move {
		font-size: 1.1rem;
	}

	/* Explanation of a wrong answer, indented under its answer row. */
	.why {
		margin: -0.1rem 0 0.9rem 0.9rem;
		padding-left: 0.75rem;
		border-left: 2px solid var(--pico-muted-border-color);
		font-size: 0.875rem;
	}

	.why textarea {
		margin-bottom: 0.4rem;
	}

	.why .no-explanation {
		margin-bottom: 0;
		font-size: 0.875rem;
	}

	.explanation textarea {
		margin-bottom: 0.75rem;
	}

	.explanation .hint {
		margin-top: -0.5rem;
	}

	.no-explanation {
		font-size: 0.95rem;
	}
</style>
