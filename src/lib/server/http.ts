// Small helpers for JSON API responses.
import { json } from '@sveltejs/kit';
import type { z } from 'zod';

export const fail = (status: number, message: string) => json({ error: message }, { status });

/** Parses and validates a JSON body; returns the data or a 400 response. */
export async function readBody<T extends z.ZodType>(
	request: Request,
	schema: T
): Promise<{ data: z.infer<T> } | { response: Response }> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return { response: fail(400, 'Request body must be valid JSON') };
	}
	const result = schema.safeParse(body);
	if (!result.success) {
		const issue = result.error.issues[0];
		const where = issue.path.length ? `${issue.path.join('.')}: ` : '';
		return { response: fail(400, `${where}${issue.message}`) };
	}
	return { data: result.data };
}
