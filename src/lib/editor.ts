// Editor-side model of a question. The editor works on a "draft" with every field present,
// so switching the question type back and forth doesn't lose what was typed.
import type { Question, QuestionType } from './types';

export const EDITABLE_TYPES = ['single', 'multiple', 'truefalse'] as const;
export type EditableType = (typeof EDITABLE_TYPES)[number];
export type EditableQuestion = Extract<Question, { type: EditableType }>;

export const TYPE_LABELS: Record<QuestionType, string> = {
	single: 'Single choice',
	multiple: 'Multiple choice',
	truefalse: 'True / false',
	numeric: 'Numeric answer',
	matching: 'Matching',
	ordering: 'Ordering'
};

export type DraftOption = { id: string; text: string; correct: boolean; explanation: string };

export type DraftQuestion = {
	id: string;
	type: EditableType;
	text: string;
	explanation: string;
	options: DraftOption[];
	correct: boolean; // true/false questions
	incorrectExplanation: string; // true/false questions
};

export const newId = () => crypto.randomUUID();

export const newOption = (): DraftOption => ({ id: newId(), text: '', correct: false, explanation: '' });

export function isEditable(q: Question): q is EditableQuestion {
	return (EDITABLE_TYPES as readonly string[]).includes(q.type);
}

export function toDraft(q?: EditableQuestion): DraftQuestion {
	const draft: DraftQuestion = {
		id: q?.id ?? newId(),
		type: q?.type ?? 'single',
		text: q?.text ?? '',
		explanation: q?.explanation ?? '',
		options: [newOption(), newOption()],
		correct: true,
		incorrectExplanation: ''
	};
	if (q?.type === 'truefalse') {
		draft.correct = q.correct;
		draft.incorrectExplanation = q.incorrectExplanation ?? '';
	} else if (q) {
		draft.options = q.options.map((o) => ({ ...o, explanation: o.explanation ?? '' }));
	}
	return draft;
}

const optional = (value: string) => value.trim() || undefined;

export function fromDraft(d: DraftQuestion): EditableQuestion {
	const base = { id: d.id, text: d.text.trim(), explanation: optional(d.explanation) };
	if (d.type === 'truefalse') {
		return { ...base, type: 'truefalse', correct: d.correct, incorrectExplanation: optional(d.incorrectExplanation) };
	}
	return {
		...base,
		type: d.type,
		options: d.options.map((o) => ({
			id: o.id,
			text: o.text.trim(),
			correct: o.correct,
			// The option explanation says why the option is wrong, so it only exists on incorrect options.
			explanation: o.correct ? undefined : optional(o.explanation)
		}))
	};
}

/** Switches the type; a single choice question keeps only the first correct answer. */
export function changeType(d: DraftQuestion, type: EditableType): void {
	if (type === 'single' && d.type !== 'single') {
		const first = d.options.findIndex((o) => o.correct);
		d.options.forEach((o, i) => (o.correct = i === first));
	}
	d.type = type;
}

/** Everything that is missing or wrong, as messages for the user. Empty = OK. */
export function validateQuestion(d: DraftQuestion): string[] {
	const errors: string[] = [];
	if (!d.text.trim()) errors.push('Write the question.');
	if (d.type === 'truefalse') return errors;

	if (d.options.length < 2) errors.push('Add at least two answers.');
	d.options.forEach((o, i) => {
		if (!o.text.trim()) errors.push(`Answer ${i + 1} is empty. Fill it in or remove it.`);
	});
	const texts = d.options.map((o) => o.text.trim().toLowerCase()).filter(Boolean);
	if (new Set(texts).size !== texts.length) errors.push('Two answers have the same text.');

	const correct = d.options.filter((o) => o.correct).length;
	if (d.type === 'single' && correct !== 1) errors.push('Mark the correct answer.');
	if (d.type === 'multiple' && correct < 1) errors.push('Mark at least one correct answer.');
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
	if (q.type === 'single' || q.type === 'multiple') return `${label} · ${q.options.length} answers`;
	if (q.type === 'truefalse') return `${label} · answer: ${q.correct ? 'true' : 'false'}`;
	return label;
}
