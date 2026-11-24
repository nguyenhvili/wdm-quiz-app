import { json } from '@sveltejs/kit';
import { getDb, popularTags } from '#lib/server/quizzes.js';
import type { RequestHandler } from './$types';

/** Most used tags of public quizzes. */
export const GET: RequestHandler = async () => {
	return json({ tags: await popularTags(getDb()) });
};
