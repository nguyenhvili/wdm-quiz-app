import { json } from '@sveltejs/kit';
import { quizInputSchema } from '#lib/schema.js';
import { readBody } from '#lib/server/http.js';
import { createQuiz, getDb } from '#lib/server/quizzes.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await readBody(request, quizInputSchema);
	if ('response' in body) return body.response;
	const created = await createQuiz(getDb(), body.data);
	return json(created, { status: 201 });
};
