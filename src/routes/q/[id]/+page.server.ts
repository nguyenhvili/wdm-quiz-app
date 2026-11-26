import { error } from '@sveltejs/kit';
import { normalizeQuizCode } from '#lib/quizCode.js';
import { getDb, getQuiz } from '#lib/server/quizzes.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = normalizeQuizCode(params.id);
	const found = id && (await getQuiz(getDb(), id));
	if (!found) error(404, 'Quiz not found');

	// The detail page doesn't need the questions themselves.
	const { questions: _questions, ...quiz } = found.quiz;
	return { quiz };
};
