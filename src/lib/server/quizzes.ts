// Database access for quizzes. Always prepared statements, never string concatenation.
import { env } from 'cloudflare:workers';
import { CODE_ALPHABET, CODE_LENGTH } from '#lib/quizCode.js';
import type { CreatedQuiz, Quiz, QuizInput, Visibility } from '#lib/types.js';
import { SystemFault } from './errors';

/** The D1 binding `DB` (from wrangler.jsonc; emulated locally by `vite dev`). */
export function getDb(): D1Database {
	if (!env.DB) {
		throw new SystemFault(
			'Database',
			'DB_NOT_CONNECTED',
			'The app is not connected to its database.',
			'The database binding is missing from the worker configuration, so the database cannot be reached.'
		);
	}
	return env.DB;
}

function newQuizId(): string {
	// Rejection sampling keeps every character equally likely (31 * 8 = 248 < 256).
	const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
	let id = '';
	while (id.length < CODE_LENGTH) {
		for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
			if (byte < limit && id.length < CODE_LENGTH) id += CODE_ALPHABET[byte % CODE_ALPHABET.length];
		}
	}
	return id;
}

function newEditToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

async function sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison of two hex hashes. */
function hashesEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export async function tokenMatches(token: string, hash: string): Promise<boolean> {
	if (token.length > 100) return false;
	return hashesEqual(await sha256(token), hash);
}

/** Checks `Authorization: Bearer <token>` against the stored hash. */
export async function isAuthorized(request: Request, hash: string): Promise<boolean> {
	const match = /^Bearer (\S+)$/.exec(request.headers.get('authorization') ?? '');
	return match ? tokenMatches(match[1], hash) : false;
}

type QuizRow = {
	id: string;
	title: string;
	description: string;
	visibility: Visibility;
	questions: string;
	question_count: number;
	start_count: number;
	forked_from: string | null;
	created_at: string;
	updated_at: string;
	edit_token_hash: string;
	tags: string;
};

/** SQLite `datetime('now')` is UTC without a zone: `2026-11-24 10:00:00` → ISO 8601. */
const toIso = (sqliteDate: string) => sqliteDate.replace(' ', 'T') + 'Z';

function toQuiz(row: QuizRow): Quiz {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		visibility: row.visibility,
		tags: JSON.parse(row.tags),
		questions: JSON.parse(row.questions),
		questionCount: row.question_count,
		startCount: row.start_count,
		forkedFrom: row.forked_from,
		createdAt: toIso(row.created_at),
		updatedAt: toIso(row.updated_at)
	};
}

/** Returns the quiz and its token hash; the hash must never be sent to the client. */
export async function getQuiz(
	db: D1Database,
	id: string
): Promise<{ quiz: Quiz; editTokenHash: string } | null> {
	const row = await db
		.prepare(
			`SELECT id, title, description, visibility, questions, question_count, start_count,
			        forked_from, created_at, updated_at, edit_token_hash,
			        (SELECT json_group_array(tag)
			         FROM (SELECT tag FROM quiz_tags WHERE quiz_id = quizzes.id ORDER BY tag)) AS tags
			 FROM quizzes WHERE id = ?`
		)
		.bind(id)
		.first<QuizRow>();
	return row ? { quiz: toQuiz(row), editTokenHash: row.edit_token_hash } : null;
}

function tagInserts(db: D1Database, id: string, tags: string[]) {
	return tags.map((tag) => db.prepare('INSERT INTO quiz_tags (quiz_id, tag) VALUES (?, ?)').bind(id, tag));
}

export async function createQuiz(db: D1Database, input: QuizInput): Promise<CreatedQuiz> {
	const editToken = newEditToken();
	const hash = await sha256(editToken);
	// Retry on the (very unlikely) id collision.
	for (let attempt = 0; ; attempt++) {
		const id = newQuizId();
		try {
			await db.batch([
				db
					.prepare(
						`INSERT INTO quizzes (id, title, description, visibility, questions, question_count, edit_token_hash)
						 VALUES (?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						id,
						input.title,
						input.description,
						input.visibility,
						JSON.stringify(input.questions),
						input.questions.length,
						hash
					),
				...tagInserts(db, id, input.tags)
			]);
			return { id, editToken };
		} catch (e) {
			if (attempt >= 2 || !String(e).includes('UNIQUE')) throw e;
		}
	}
}

export async function updateQuiz(db: D1Database, id: string, input: QuizInput): Promise<void> {
	await db.batch([
		db
			.prepare(
				`UPDATE quizzes
				 SET title = ?, description = ?, visibility = ?, questions = ?, question_count = ?,
				     updated_at = datetime('now')
				 WHERE id = ?`
			)
			.bind(
				input.title,
				input.description,
				input.visibility,
				JSON.stringify(input.questions),
				input.questions.length,
				id
			),
		db.prepare('DELETE FROM quiz_tags WHERE quiz_id = ?').bind(id),
		...tagInserts(db, id, input.tags)
	]);
}

export async function deleteQuiz(db: D1Database, id: string): Promise<void> {
	await db.batch([
		db.prepare('DELETE FROM quiz_tags WHERE quiz_id = ?').bind(id),
		db.prepare('DELETE FROM quizzes WHERE id = ?').bind(id)
	]);
}

export async function popularTags(db: D1Database, limit = 50): Promise<{ tag: string; count: number }[]> {
	const { results } = await db
		.prepare(
			`SELECT t.tag, COUNT(*) AS count
			 FROM quiz_tags t JOIN quizzes q ON q.id = t.quiz_id
			 WHERE q.visibility = 'public'
			 GROUP BY t.tag
			 ORDER BY count DESC, t.tag
			 LIMIT ?`
		)
		.bind(limit)
		.all<{ tag: string; count: number }>();
	return results;
}
