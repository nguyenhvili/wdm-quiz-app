<!--
	Quiz editor used by /new and /q/[id]/edit. Sub-screens (tags, question, question type, links)
	are shallow-routed states of the same page, so the browser back button returns to the previous screen
	and nothing is lost before the quiz is saved.
-->
<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import SystemErrorDialog from './SystemErrorDialog.svelte';
	import QuestionForm from './QuestionForm.svelte';
	import QuizLinks from './QuizLinks.svelte';
	import TagPicker from './TagPicker.svelte';
	import {
		changeType,
		fromDraft,
		QUESTION_TYPES,
		questionSummary,
		toDraft,
		TYPE_HINTS,
		TYPE_LABELS,
		validateQuiz,
		type DraftQuestion
	} from '#lib/editor.js';
	import { LIMITS } from '#lib/limits.js';
	import { api } from '#lib/api.js';
	import { myQuizzes } from '#lib/storage.js';
	import type { SystemErrorInfo } from '#lib/systemError.js';
	import type { CreatedQuiz, QuestionType, QuizInput } from '#lib/types.js';

	type Props = {
		/** Quiz to edit; omitted when creating a new one. */
		initial?: QuizInput;
		/** Id and edit token of a saved quiz (edit mode). */
		existing?: { id: string; editToken: string };
	};
	let { initial, existing }: Props = $props();

	const empty: QuizInput = { title: '', description: '', tags: [], visibility: 'unlisted', questions: [] };
	let quiz = $state<QuizInput>(structuredClone(untrack(() => initial) ?? empty));
	let savedSnapshot = $state(JSON.stringify(quiz));
	const dirty = $derived(JSON.stringify(quiz) !== savedSnapshot);

	let draft = $state<DraftQuestion | null>(null);
	let draftIndex = $state<number | null>(null);
	let pendingType = $state<QuestionType>('single');

	// Validation errors update live once shown, so fixed problems disappear from the list.
	let validated = $state(false);
	let serverError = $state('');
	let systemError = $state<SystemErrorInfo | null>(null);
	let systemAction = $state('save the quiz');
	const errors = $derived([...(validated ? validateQuiz(quiz) : []), ...(serverError ? [serverError] : [])]);
	let status = $state('');
	let saving = $state(false);
	let confirmDeleteQuestion = $state(false);
	let confirmDeleteQuiz = $state(false);

	// ---- Sub-screens -------------------------------------------------------------------------

	const requested = $derived(page.state.editorView);
	const view = $derived.by(() => {
		if ((requested === 'question' || requested === 'type') && !draft) return 'main';
		if (requested === 'links' && !existing) return 'main';
		return requested ?? 'main';
	});

	const headings = $derived({
		main: existing ? 'Edit quiz' : 'New quiz',
		tags: 'Select tags',
		question: 'New question',
		type: 'Change question type',
		links: 'Quiz links'
	});
	const heading = $derived(view === 'question' && draftIndex !== null ? 'Edit question' : headings[view]);

	const crumbs = $derived([
		existing ? { label: 'My quizzes', href: '/my' } : { label: 'Home', href: '/' },
		{ label: headings.main, href: page.url.pathname + page.url.search },
		...(view === 'type' ? [{ label: draftIndex === null ? 'New question' : 'Edit question' }] : []),
		...(view !== 'main' ? [{ label: heading }] : [])
	]);

	const open = (editorView: App.PageState['editorView']) =>
		goto(page.url.pathname + page.url.search, { shallow: true, state: { editorView } });
	const back = () => history.back();

	// Move focus to the new screen's heading so screen readers announce it.
	let headingEl = $state<HTMLElement>();
	let firstView = true;
	$effect(() => {
		void view;
		if (firstView) {
			firstView = false;
			return;
		}
		tick().then(() => {
			window.scrollTo(0, 0);
			headingEl?.focus();
		});
	});

	// ---- Questions ---------------------------------------------------------------------------

	function addQuestion() {
		draft = toDraft();
		draftIndex = null;
		open('question');
	}

	function editQuestion(i: number) {
		draft = toDraft(quiz.questions[i]);
		draftIndex = i;
		open('question');
	}

	function saveQuestion() {
		if (!draft) return;
		const question = fromDraft(draft);
		if (draftIndex === null) quiz.questions.push(question);
		else quiz.questions[draftIndex] = question;
		draft = null;
		back();
	}

	function deleteQuestion() {
		if (draftIndex !== null) quiz.questions.splice(draftIndex, 1);
		draft = null;
		back();
	}

	function openTypePicker() {
		if (!draft) return;
		pendingType = draft.type;
		open('type');
	}

	function applyType() {
		if (draft) changeType(draft, pendingType);
		back();
	}

	async function move(i: number, by: -1 | 1) {
		const list = quiz.questions;
		[list[i], list[i + by]] = [list[i + by], list[i]];
		// Keep focus on the moved question's button (or its other arrow at the ends of the list).
		await tick();
		const id = list[i + by].id;
		const button = document.getElementById(`move-${by < 0 ? 'up' : 'down'}-${id}`) as HTMLButtonElement | null;
		(button && !button.disabled ? button : document.getElementById(`move-${by < 0 ? 'down' : 'up'}-${id}`))?.focus();
	}

	// ---- Saving and deleting -----------------------------------------------------------------

	let errorBox = $state<HTMLElement>();

	async function showErrors(message?: string) {
		serverError = message ?? '';
		await tick();
		errorBox?.focus();
	}

	function authHeaders(): Record<string, string> {
		return existing ? { authorization: `Bearer ${existing.editToken}` } : {};
	}

	/** Problems the user can fix go to the error summary; everything else opens the system error dialog. */
	function userMessage(status: number, error: string, action: string): string {
		if (status === 401) return `This edit link is no longer valid, so the quiz could not be ${action}.`;
		if (status === 404) return `This quiz no longer exists, so it could not be ${action}.`;
		return `The quiz could not be ${action}: ${error}`;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		status = '';
		serverError = '';
		validated = true;
		if (validateQuiz(quiz).length) return showErrors();

		saving = true;
		try {
			const res = await api<CreatedQuiz>(existing ? `/api/quizzes/${existing.id}` : '/api/quizzes', {
				method: existing ? 'PUT' : 'POST',
				headers: { 'content-type': 'application/json', ...authHeaders() },
				body: JSON.stringify(quiz)
			});
			if ('systemError' in res) {
				systemAction = 'save the quiz';
				systemError = res.systemError;
				return;
			}
			if ('userError' in res) return showErrors(userMessage(res.status, res.userError, 'saved'));
			savedSnapshot = JSON.stringify(quiz);

			if (existing) {
				myQuizzes.save({ id: existing.id, title: quiz.title.trim(), editToken: existing.editToken });
				status = 'Changes saved.';
				return;
			}
			// New quiz: continue on its edit page and show the links.
			const created = res.data;
			myQuizzes.save({ id: created.id, title: quiz.title.trim(), editToken: created.editToken });
			const editUrl = `/q/${created.id}/edit?key=${encodeURIComponent(created.editToken)}`;
			await goto(editUrl, { replace: true });
			await goto(editUrl, { shallow: true, state: { editorView: 'links' } });
		} finally {
			saving = false;
		}
	}

	async function deleteQuiz() {
		if (!existing) return;
		const res = await api<void>(`/api/quizzes/${existing.id}`, { method: 'DELETE', headers: authHeaders() });
		if ('systemError' in res) {
			systemAction = 'delete the quiz';
			systemError = res.systemError;
			return;
		}
		if ('userError' in res && res.status !== 404) return showErrors(userMessage(res.status, res.userError, 'deleted'));
		myQuizzes.remove(existing.id);
		savedSnapshot = JSON.stringify(quiz);
		await goto('/my');
	}

	// Warn before leaving the page with unsaved changes (moving between sub-screens is fine).
	beforeNavigate((nav) => {
		if (!dirty || nav.to?.url.pathname === page.url.pathname) return;
		if (nav.type === 'leave') nav.cancel();
		else if (!confirm('You have unsaved changes. Leave without saving them?')) nav.cancel();
	});
</script>

<svelte:head>
	<title>{heading} · QuizLab</title>
</svelte:head>

<Breadcrumbs items={crumbs} />

<div class="view-header">
	{#if view !== 'main'}
		<button
			type="button"
			class="icon-button secondary outline"
			aria-label={view === 'question' ? 'Close without saving the question' : 'Back'}
			onclick={back}>{view === 'question' ? '×' : '←'}</button
		>
	{/if}
	<h1 tabindex="-1" bind:this={headingEl}>{heading}</h1>
	{#if view === 'main' && existing}
		<button type="button" class="link-button" onclick={() => open('links')}>Links</button>
	{:else if view === 'question' && draftIndex !== null}
		<button type="button" class="link-button" onclick={() => (confirmDeleteQuestion = true)}>Delete</button>
	{/if}
</div>

{#if view === 'tags'}
	<TagPicker bind:tags={quiz.tags} ondone={back} />
{:else if view === 'question' && draft}
	<QuestionForm bind:draft onsave={saveQuestion} onchangetype={openTypePicker} />
{:else if view === 'type' && draft}
	<p class="muted">Choose how people answer this question.</p>
	<fieldset>
		<legend>Question type</legend>
		<ul class="choice-list">
			{#each QUESTION_TYPES as type (type)}
				<li>
					<label class="choice" class:selected={pendingType === type}>
						<input
							type="radio"
							name="question-type"
							value={type}
							bind:group={pendingType}
							aria-labelledby="type-name-{type}"
							aria-describedby="type-hint-{type}"
						/>
						<span>
							<span id="type-name-{type}">{TYPE_LABELS[type]}</span>
							<small id="type-hint-{type}" class="type-hint">{TYPE_HINTS[type]}</small>
						</span>
					</label>
				</li>
			{/each}
		</ul>
	</fieldset>
	<p class="muted">Current type: {TYPE_LABELS[draft.type]}</p>
	<button type="button" class="full-width" onclick={applyType}>Done</button>
{:else if view === 'links' && existing}
	<QuizLinks id={existing.id} title={quiz.title} editToken={existing.editToken} />
{:else}
	<form onsubmit={save} novalidate>
		{#if existing}
			<p class="notice">You're editing with your private edit link. Anyone who has it can change this quiz.</p>
		{/if}

		<label>
			Quiz title
			<input
				type="text"
				bind:value={quiz.title}
				maxlength={LIMITS.title}
				placeholder="e.g. Linear algebra"
				required
				aria-invalid={errors.length && !quiz.title.trim() ? true : undefined}
			/>
		</label>

		<label>
			Description (optional)
			<textarea
				bind:value={quiz.description}
				rows="3"
				maxlength={LIMITS.description}
				placeholder="What is this quiz about?"
			></textarea>
		</label>

		<section class="field" aria-labelledby="tags-heading">
			<h2 id="tags-heading" class="field-heading">Tags</h2>
			{#if quiz.tags.length}
				<ul class="chip-list">
					{#each quiz.tags as tag (tag)}<li class="chip chip-selected">{tag}</li>{/each}
				</ul>
			{/if}
			<button type="button" class="outline" onclick={() => open('tags')}>
				{quiz.tags.length ? 'Change tags' : '+ Add tags'}
			</button>
			<small class="muted">Pick one or more so people can find your quiz.</small>
		</section>

		<fieldset>
			<legend>Who can find this quiz?</legend>
			<label>
				<input type="radio" name="visibility" value="unlisted" bind:group={quiz.visibility} />
				Unlisted – only people with the link or code
			</label>
			<label>
				<input type="radio" name="visibility" value="public" bind:group={quiz.visibility} />
				Public – also listed in the catalogue and search
			</label>
		</fieldset>

		<section class="field" aria-labelledby="questions-heading">
			<div class="section-head">
				<h2 id="questions-heading" class="field-heading">Questions</h2>
				<span class="muted">{quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}</span>
			</div>

			{#if quiz.questions.length === 0}
				<div class="notice empty">
					<p><strong>No questions yet</strong></p>
					<p>Add at least one question to save your quiz.</p>
				</div>
			{:else}
				<ol class="question-list">
					{#each quiz.questions as question, i (question.id)}
						<li>
							<button
								type="button"
								class="question-card"
								onclick={() => editQuestion(i)}
							>
								<span class="question-text"><span class="visually-hidden">Edit question </span>{i + 1}. {question.text}</span>
								<span class="question-meta">{questionSummary(question)}</span>
							</button>
							<div class="move">
								<button
									type="button"
									id="move-up-{question.id}"
									class="secondary outline"
									aria-label="Move question {i + 1} up"
									disabled={i === 0}
									onclick={() => move(i, -1)}>↑</button
								>
								<button
									type="button"
									id="move-down-{question.id}"
									class="secondary outline"
									aria-label="Move question {i + 1} down"
									disabled={i === quiz.questions.length - 1}
									onclick={() => move(i, 1)}>↓</button
								>
							</div>
						</li>
					{/each}
				</ol>
			{/if}

			{#if quiz.questions.length < LIMITS.questions}
				<button type="button" class="outline full-width" onclick={addQuestion}>+ Add question</button>
			{/if}
		</section>

		{#if errors.length}
			<div class="error-summary" role="alert" tabindex="-1" bind:this={errorBox}>
				<p>Before saving, fix:</p>
				<ul>
					{#each errors as error (error)}<li>{error}</li>{/each}
				</ul>
			</div>
		{/if}

		{#if !existing}
			<p class="muted center">You'll get a share link and a private edit link. No account needed.</p>
		{/if}
		<p class="center" role="status">{status}</p>
		<button type="submit" class="full-width" aria-busy={saving} disabled={saving}>
			{existing ? 'Save changes' : 'Save quiz'}
		</button>
	</form>

	{#if existing}
		<section class="danger-zone" aria-labelledby="delete-heading">
			<h2 id="delete-heading" class="field-heading">Delete quiz</h2>
			<p class="muted">Deleting removes the quiz for everyone, including people you shared it with.</p>
			<button type="button" class="secondary outline full-width" onclick={() => (confirmDeleteQuiz = true)}>
				Delete quiz
			</button>
		</section>
	{/if}
{/if}

<ConfirmDialog
	bind:open={confirmDeleteQuestion}
	title="Delete this question?"
	message="The question and its answers will be removed from the quiz."
	confirmLabel="Delete question"
	onconfirm={deleteQuestion}
/>
<ConfirmDialog
	bind:open={confirmDeleteQuiz}
	title="Delete this quiz?"
	message="This can't be undone. The quiz will be removed for everyone, and its share and edit links will stop working."
	confirmLabel="Delete quiz"
	onconfirm={deleteQuiz}
/>
<SystemErrorDialog bind:error={systemError} action={systemAction} />

<style>
	.type-hint {
		display: block;
		font-weight: 400;
		color: var(--pico-muted-color);
	}

	.view-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.view-header h1 {
		flex: 1;
		margin: 0;
		font-size: 1.75rem;
	}

	.icon-button {
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		margin: 0;
		font-size: 1.4rem;
		line-height: 1;
	}

	.field {
		margin-bottom: var(--pico-spacing);
	}

	.field-heading {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.field small {
		display: block;
		margin-top: 0.25rem;
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.empty {
		text-align: center;
	}

	.empty p {
		margin-bottom: 0.25rem;
	}

	.question-list {
		padding: 0;
		margin: 0 0 0.75rem;
	}

	.question-list li {
		list-style: none;
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.question-card {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		margin: 0;
		text-align: left;
		background: transparent;
		color: inherit;
		border: 1px solid var(--pico-form-element-border-color);
	}

	.question-card:hover {
		border-color: var(--pico-primary);
		background: var(--ql-surface);
	}

	.question-text {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.question-meta {
		font-size: 0.875rem;
		color: var(--pico-muted-color);
	}

	.move {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.move button {
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		margin: 0;
	}

	.center {
		text-align: center;
	}

	.danger-zone {
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--pico-muted-border-color);
	}
</style>
