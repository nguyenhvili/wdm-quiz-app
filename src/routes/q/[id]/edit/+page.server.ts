import { error } from '@sveltejs/kit';
import { normalizeQuizCode } from '#lib/quizCode.js';
import { getDb, getQuiz, tokenMatches } from '#lib/server/quizzes.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const id = normalizeQuizCode(params.id);
	const found = id && (await getQuiz(getDb(), id));
	if (!found) error(404, 'Quiz not found');

	// The URL contains the secret edit token: don't cache the page or leak the URL to other sites.
	setHeaders({ 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });

	const key = url.searchParams.get('key');
	return {
		quiz: found.quiz,
		canEdit: key !== null && (await tokenMatches(key, found.editTokenHash))
	};
};
