// Turns unexpected server exceptions into a SystemErrorInfo that is safe to show to users:
// it names the subsystem and the kind of failure, but never table/column names, SQL or values.
import type { Subsystem, SystemErrorInfo } from '#lib/systemError.js';

/** Thrown on purpose when a subsystem is misconfigured (e.g. the DB binding is missing). */
export class SystemFault extends Error {
	constructor(
		readonly subsystem: Subsystem,
		readonly code: string,
		message: string,
		readonly detail: string
	) {
		super(message);
	}
}

type Rule = { test: RegExp; code: string; message: string; detail: string };

// Checked in order; D1 messages look like "D1_ERROR: no such table: quizzes: SQLITE_ERROR".
const DATABASE_RULES: Rule[] = [
	{
		test: /no such table|no such column|has no column/i,
		code: 'DB_SCHEMA_MISSING',
		message: 'The database is not set up for this version of the app.',
		detail: 'A required table or column does not exist – the database migrations have not been applied to this database.'
	},
	{
		test: /SQLITE_READONLY|read-?only/i,
		code: 'DB_READ_ONLY',
		message: 'The database refused to save data.',
		detail: 'The database is in read-only mode, so the app is not allowed to write to it.'
	},
	{
		test: /SQLITE_AUTH|SQLITE_PERM|not authori[sz]ed|unauthori[sz]ed|permission|access denied|forbidden/i,
		code: 'DB_ACCESS_DENIED',
		message: 'The app was not allowed to access the database.',
		detail: 'The database access rights of this app are not sufficient for this operation.'
	},
	{
		test: /UNIQUE constraint/i,
		code: 'DB_CONFLICT',
		message: 'The database rejected the data as a duplicate.',
		detail: 'A record with the same unique value already exists.'
	},
	{
		test: /CHECK constraint|NOT NULL constraint|FOREIGN KEY constraint|SQLITE_CONSTRAINT/i,
		code: 'DB_CONSTRAINT',
		message: 'The database rejected the data.',
		detail: 'The data broke one of the database rules (a required value is missing or not allowed).'
	},
	{
		test: /too big|SQLITE_TOOBIG|SQLITE_FULL|exceeded|storage limit|database is full/i,
		code: 'DB_LIMIT',
		message: 'A database limit was reached.',
		detail: 'The data is too large, or the database has reached its size or usage limit.'
	},
	{
		test: /SQLITE_BUSY|database is locked|overloaded|timed? ?out|network connection lost|unavailable|internal error|reset/i,
		code: 'DB_UNAVAILABLE',
		message: 'The database is not available right now.',
		detail: 'The database did not respond or was temporarily overloaded. Trying again later usually helps.'
	}
];

/** Removes identifiers, quoted values and SQL fragments from a subsystem message. */
function sanitize(message: string): string {
	return message
		.replace(/\b(table|column|index|view|trigger)\s*:?\s*[\w."]+/gi, '$1')
		.replace(/(["'`]).*?\1/g, '…')
		.replace(/\bnear\b.*$/i, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 200);
}

/** The SQLite result code, e.g. "SQLITE_ERROR", if the message contains one. */
const sqliteCode = (message: string) => /SQLITE_[A-Z]+/.exec(message)?.[0];

function classify(err: unknown): Omit<SystemErrorInfo, 'time' | 'reference'> {
	if (err instanceof SystemFault) {
		return { subsystem: err.subsystem, code: err.code, message: err.message, detail: err.detail, status: 500 };
	}

	const raw = err instanceof Error ? `${err.message} ${(err.cause as Error | undefined)?.message ?? ''}` : String(err);
	const isDatabase = /D1_|SQLITE|\bD1\b/.test(raw);

	if (isDatabase) {
		const rule = DATABASE_RULES.find((r) => r.test.test(raw));
		const code = sqliteCode(raw);
		if (rule) {
			return {
				subsystem: 'Database',
				code: rule.code,
				message: rule.message,
				detail: code ? `${rule.detail} (${code})` : rule.detail,
				status: 500
			};
		}
		return {
			subsystem: 'Database',
			code: 'DB_ERROR',
			message: 'The database could not complete the request.',
			detail: `The database reported: ${sanitize(raw) || 'an unknown error'}`,
			status: 500
		};
	}

	if (/crypto|subtle|digest/i.test(raw)) {
		return {
			subsystem: 'Security',
			code: 'CRYPTO_FAILED',
			message: 'The edit token could not be created or checked.',
			detail: `The cryptography module reported: ${sanitize(raw)}`,
			status: 500
		};
	}

	const name = err instanceof Error ? err.name : 'Error';
	return {
		subsystem: 'Server',
		code: 'SERVER_ERROR',
		message: 'The server ran into an unexpected problem.',
		detail: `${name}: ${sanitize(raw) || 'no details'}`,
		status: 500
	};
}

/** Classifies the error and logs the full original under a reference id. */
export function describeError(err: unknown, where: string): SystemErrorInfo {
	const reference = crypto.randomUUID().slice(0, 8).toUpperCase();
	console.error(`[${reference}] ${where}`, err);
	return { ...classify(err), reference, time: new Date().toISOString() };
}
