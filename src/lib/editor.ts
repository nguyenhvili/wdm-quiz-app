// Editor-side model of a question. The editor works on a "draft" with every field of every type present,
// so switching the question type back and forth doesn't lose what was typed.
import type { Question, QuestionType } from './types';

export const QUESTION_TYPES = ['single', 'multiple', 'truefalse', 'numeric', 'matching', 'ordering'] as const;

export const TYPE_LABELS: Record<QuestionType, string> = {
	single: 'Single choice',
	multiple: 'Multiple choice',
	truefalse: 'True / false',
	numeric: 'Numeric answer',
	matching: 'Matching',
	ordering: 'Ordering'
};

export const TYPE_HINTS: Record<QuestionType, string> = {
	single: 'Pick one correct answer from several options.',
	multiple: 'Pick all correct answers – one or more.',
	truefalse: 'Decide whether a statement is true or false.',
	numeric: 'Type a number, optionally with an allowed tolerance.',
	matching: 'Match each item on the left with one on the right.',
	ordering: 'Put items into the correct order.'
};

/** `noExplanation`: the creator explicitly chose not to explain why this (incorrect) option is wrong. */
export type DraftOption = { id: string; text: string; correct: boolean; explanation: string; noExplanation: boolean };
export type DraftPair = { id: string; left: string; right: string };
export type DraftItem = { id: string; text: string };

export type DraftQuestion = {
	id: string;
	type: QuestionType;
	text: string;
	explanation: string;
	/** The creator explicitly chose not to explain the correct answer. */
	noExplanation: boolean;
	/** Why other answers are wrong (all types except single/multiple, which explain per option). */
	incorrectExplanation: string;
	/** True/false: the creator explicitly chose not to explain why the other answer is wrong. */
	noIncorrectExplanation: boolean;
	options: DraftOption[]; // single, multiple
	correct: boolean; // truefalse
	value: string; // numeric – kept as typed text, parsed on save
	tolerance: string; // numeric
	pairs: DraftPair[]; // matching
	items: DraftItem[]; // ordering, in the correct order
};

export const newId = () => crypto.randomUUID();
export const newOption = (): DraftOption => ({ id: newId(), text: '', correct: false, explanation: '', noExplanation: false });
export const newPair = (): DraftPair => ({ id: newId(), left: '', right: '' });
export const newItem = (text = ''): DraftItem => ({ id: newId(), text });

/** Accepts both "2.5" and "2,5". Returns null for anything that isn't a finite number. */
export function parseNumber(value: string): number | null {
	const s = value.trim().replace(',', '.').replace(/\s+/g, '');
	if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
	const n = Number(s);
	return Number.isFinite(n) ? n : null;
}

export function toDraft(q?: Question): DraftQuestion {
	const draft: DraftQuestion = {
		id: q?.id ?? newId(),
		type: q?.type ?? 'single',
		text: q?.text ?? '',
		explanation: q?.explanation ?? '',
		// A saved question without an explanation was saved with the box ticked.
		noExplanation: q ? !q.explanation : false,
		incorrectExplanation: '',
		noIncorrectExplanation: false,
		options: [newOption(), newOption()],
		correct: true,
		value: '',
		tolerance: '',
		pairs: [newPair(), newPair()],
		items: [newItem(), newItem(), newItem()]
	};
	if (!q) return draft;
	if (q.type === 'single' || q.type === 'multiple') {
		// Saved incorrect options without an explanation were saved with their box ticked.
		draft.options = q.options.map((o) => ({ ...o, explanation: o.explanation ?? '', noExplanation: !o.correct && !o.explanation }));
	} else {
		draft.incorrectExplanation = q.incorrectExplanation ?? '';
		if (q.type === 'truefalse') {
			draft.correct = q.correct;
			draft.noIncorrectExplanation = !q.incorrectExplanation;
		}
		if (q.type === 'numeric') {
			draft.value = String(q.value);
			draft.tolerance = q.tolerance === undefined ? '' : String(q.tolerance);
		}
		if (q.type === 'matching') draft.pairs = q.pairs.map((p) => ({ id: newId(), ...p }));
		if (q.type === 'ordering') draft.items = q.items.map((text) => newItem(text));
	}
	return draft;
}

const optional = (value: string) => value.trim() || undefined;

/** Converts a valid draft (see validateQuestion) into the stored question format. */
export function fromDraft(d: DraftQuestion): Question {
	const base = { id: d.id, text: d.text.trim(), explanation: d.noExplanation ? undefined : optional(d.explanation) };
	const incorrectExplanation = optional(d.incorrectExplanation);
	switch (d.type) {
		case 'single':
		case 'multiple':
			return {
				...base,
				type: d.type,
				options: d.options.map((o) => ({
					id: o.id,
					text: o.text.trim(),
					correct: o.correct,
					// The option explanation says why the option is wrong, so it only exists on incorrect options.
					explanation: o.correct || o.noExplanation ? undefined : optional(o.explanation)
				}))
			};
		case 'truefalse':
			return {
				...base,
				type: 'truefalse',
				correct: d.correct,
				incorrectExplanation: d.noIncorrectExplanation ? undefined : incorrectExplanation
			};
		case 'numeric': {
			const tolerance = d.tolerance.trim() ? Math.abs(parseNumber(d.tolerance) ?? 0) : undefined;
			return { ...base, type: 'numeric', value: parseNumber(d.value) ?? 0, tolerance: tolerance || undefined, incorrectExplanation };
		}
		case 'matching':
			return {
				...base,
				type: 'matching',
				pairs: d.pairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() })),
				incorrectExplanation
			};
		case 'ordering':
			return { ...base, type: 'ordering', items: d.items.map((i) => i.text.trim()), incorrectExplanation };
	}
}

/** Switches the type; a single choice question keeps only the first correct answer. */
export function changeType(d: DraftQuestion, type: QuestionType): void {
	if (type === 'single' && d.type !== 'single') {
		const first = d.options.findIndex((o) => o.correct);
		d.options.forEach((o, i) => (o.correct = i === first));
	}
	d.type = type;
}

const hasDuplicates = (values: string[]) => {
	const filled = values.map((v) => v.trim().toLowerCase()).filter(Boolean);
	return new Set(filled).size !== filled.length;
};

/** Everything that is missing or wrong, as messages for the user. Empty = OK. */
export function validateQuestion(d: DraftQuestion): string[] {
	const errors: string[] = [];
	if (!d.text.trim()) errors.push('Write the question.');

	switch (d.type) {
		case 'single':
		case 'multiple': {
			if (d.options.length < 2) errors.push('Add at least two answers.');
			d.options.forEach((o, i) => {
				if (!o.text.trim()) errors.push(`Answer ${i + 1} is empty. Fill it in or remove it.`);
			});
			if (hasDuplicates(d.options.map((o) => o.text))) errors.push('Two answers have the same text.');
			const correct = d.options.filter((o) => o.correct).length;
			if (d.type === 'single' && correct !== 1) errors.push('Mark the correct answer.');
			if (d.type === 'multiple' && correct < 1) errors.push('Mark at least one correct answer.');
			d.options.forEach((o, i) => {
				if (!o.correct && !o.noExplanation && !o.explanation.trim()) {
					errors.push(`Explain why answer ${i + 1} is wrong, or tick “No explanation for this answer”.`);
				}
			});
			break;
		}
		case 'truefalse':
			if (!d.noIncorrectExplanation && !d.incorrectExplanation.trim()) {
				errors.push('Explain why the other answer is wrong, or tick “No explanation for the other answer”.');
			}
			break;
		case 'numeric':
			if (!d.value.trim()) errors.push('Enter the correct answer.');
			else if (parseNumber(d.value) === null) errors.push('The correct answer must be a number, e.g. 42 or 3.14.');
			if (d.tolerance.trim()) {
				const t = parseNumber(d.tolerance);
				if (t === null || t < 0) errors.push('The tolerance must be a number of 0 or more, e.g. 0.5.');
			}
			break;
		case 'matching':
			if (d.pairs.length < 2) errors.push('Add at least two pairs.');
			d.pairs.forEach((p, i) => {
				if (!p.left.trim() || !p.right.trim()) errors.push(`Pair ${i + 1} is incomplete. Fill in both sides or remove it.`);
			});
			if (hasDuplicates(d.pairs.map((p) => p.left))) errors.push('Two items on the left are the same.');
			if (hasDuplicates(d.pairs.map((p) => p.right))) errors.push('Two items on the right are the same.');
			break;
		case 'ordering':
			if (d.items.length < 2) errors.push('Add at least two items.');
			d.items.forEach((item, i) => {
				if (!item.text.trim()) errors.push(`Item ${i + 1} is empty. Fill it in or remove it.`);
			});
			if (hasDuplicates(d.items.map((i) => i.text))) errors.push('Two items have the same text.');
			break;
	}

	if (!d.noExplanation && !d.explanation.trim()) {
		errors.push('Explain the correct answer, or tick “No explanation for this question”.');
	}
	return errors;
}

export function validateQuiz(quiz: { title: string; questions: Question[] }): string[] {
	const errors: string[] = [];
	if (!quiz.title.trim()) errors.push('Add a quiz title.');
	if (quiz.questions.length === 0) errors.push('Add at least one question.');
	return errors;
}

/** "Single choice · 4 answers" */
export function questionSummary(q: Question): string {
	const label = TYPE_LABELS[q.type];
	const parts = [label];
	if (q.type === 'single' || q.type === 'multiple') parts.push(`${q.options.length} answers`);
	if (q.type === 'truefalse') parts.push(`answer: ${q.correct ? 'true' : 'false'}`);
	if (q.type === 'numeric') parts.push(`answer: ${q.value}${q.tolerance ? ` ± ${q.tolerance}` : ''}`);
	if (q.type === 'matching') parts.push(`${q.pairs.length} pairs`);
	if (q.type === 'ordering') parts.push(`${q.items.length} items`);
	if (!q.explanation) parts.push('no explanation');
	return parts.join(' · ');
}
