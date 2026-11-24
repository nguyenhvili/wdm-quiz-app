import { json } from '@sveltejs/kit';
import { normalizeQuizCode } from '#lib/quizCode.js';
import { quizInputSchema } from '#lib/schema.js';
import { fail, readBody } from '#lib/server/http.js';
import { deleteQuiz, getDb, getQuiz, isAuthorized, updateQuiz } from '#lib/server/quizzes.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = normalizeQuizCode(params.id);
	const found = id && (await getQuiz(getDb(), id));
	if (!found) return fail(404, 'Quiz not found');
	return json(found.quiz);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	const id = normalizeQuizCode(params.id);
	const found = id && (await getQuiz(db, id));
	if (!id || !found) return fail(404, 'Quiz not found');
	if (!(await isAuthorized(request, found.editTokenHash))) return fail(401, 'Invalid edit token');

	const body = await readBody(request, quizInputSchema);
	if ('response' in body) return body.response;
	await updateQuiz(db, id, body.data);
	return json({ id });
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	const id = normalizeQuizCode(params.id);
	const found = id && (await getQuiz(db, id));
	if (!id || !found) return fail(404, 'Quiz not found');
	if (!(await isAuthorized(request, found.editTokenHash))) return fail(401, 'Invalid edit token');

	await deleteQuiz(db, id);
	return new Response(null, { status: 204 });
};
