// zod schemas for validating request bodies on the server. Must stay in sync with ./types.ts.
import { z } from 'zod';
import type { Question, QuizInput } from './types';

export const LIMITS = {
	title: 200,
	description: 2000,
	tags: 10,
	tag: 30,
	questions: 200,
	text: 2000,
	explanation: 2000,
	options: 10,
	pairs: 10,
	items: 10,
	id: 64
} as const;

const id = z.string().trim().min(1).max(LIMITS.id);
const text = z.string().trim().min(1).max(LIMITS.text);
const explanation = z.string().trim().max(LIMITS.explanation).optional();

const option = z.object({
	id,
	text,
	correct: z.boolean(),
	explanation
});

const base = { id, text, explanation };

const question = z
	.discriminatedUnion('type', [
		z.object({ ...base, type: z.literal('single'), options: z.array(option).min(2).max(LIMITS.options) }),
		z.object({ ...base, type: z.literal('multiple'), options: z.array(option).min(2).max(LIMITS.options) }),
		z.object({
			...base,
			type: z.literal('truefalse'),
			correct: z.boolean(),
			incorrectExplanation: explanation
		}),
		z.object({
			...base,
			type: z.literal('numeric'),
			value: z.number().finite(),
			tolerance: z.number().finite().min(0).optional(),
			incorrectExplanation: explanation
		}),
		z.object({
			...base,
			type: z.literal('matching'),
			pairs: z.array(z.object({ left: text, right: text })).min(2).max(LIMITS.pairs),
			incorrectExplanation: explanation
		}),
		z.object({
			...base,
			type: z.literal('ordering'),
			items: z.array(text).min(2).max(LIMITS.items),
			incorrectExplanation: explanation
		})
	])
	.superRefine((q, ctx) => {
		const unique = (values: string[], path: string, message: string) => {
			if (new Set(values).size !== values.length) ctx.addIssue({ code: 'custom', path: [path], message });
		};
		switch (q.type) {
			case 'single':
			case 'multiple': {
				const correct = q.options.filter((o) => o.correct).length;
				if (q.type === 'single' && correct !== 1)
					ctx.addIssue({ code: 'custom', path: ['options'], message: 'Exactly one option must be correct' });
				if (q.type === 'multiple' && correct < 1)
					ctx.addIssue({ code: 'custom', path: ['options'], message: 'At least one option must be correct' });
				unique(q.options.map((o) => o.id), 'options', 'Option ids must be unique');
				break;
			}
			case 'matching':
				unique(q.pairs.map((p) => p.left), 'pairs', 'Left items must be unique');
				unique(q.pairs.map((p) => p.right), 'pairs', 'Right items must be unique');
				break;
			case 'ordering':
				unique(q.items, 'items', 'Items must be unique');
				break;
		}
	});

/** Tags are normalised (trimmed, lowercase) and de-duplicated. */
const tags = z
	.array(z.string().trim().toLowerCase().min(1).max(LIMITS.tag))
	.max(LIMITS.tags)
	.transform((t) => [...new Set(t)]);

export const quizInputSchema = z
	.object({
		title: z.string().trim().min(1).max(LIMITS.title),
		description: z.string().trim().max(LIMITS.description).default(''),
		tags: tags.default([]),
		visibility: z.enum(['public', 'unlisted']).default('unlisted'),
		questions: z.array(question).min(1).max(LIMITS.questions)
	})
	.superRefine((quiz, ctx) => {
		const ids = quiz.questions.map((q) => q.id);
		if (new Set(ids).size !== ids.length)
			ctx.addIssue({ code: 'custom', path: ['questions'], message: 'Question ids must be unique' });
	});

export const catalogueQuerySchema = z.object({
	q: z.string().trim().max(LIMITS.title).default(''),
	tags: z
		.string()
		.default('')
		.transform((s) => [...new Set(s.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))])
		.pipe(z.array(z.string().max(LIMITS.tag)).max(LIMITS.tags)),
	length: z.enum(['short', 'medium', 'long']).optional(),
	sort: z.enum(['newest', 'popular', 'questions', 'title']).default('newest'),
	page: z.coerce.number().int().min(1).default(1)
});

export type CatalogueQuery = z.infer<typeof catalogueQuerySchema>;

// Compile-time check that the schema output matches the hand-written types.
type Assert<T extends true> = T;
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type _QuestionMatches = Assert<Equals<z.infer<typeof question>, Question>>;
export type _QuizInputMatches = Assert<Equals<z.infer<typeof quizInputSchema>, QuizInput>>;
