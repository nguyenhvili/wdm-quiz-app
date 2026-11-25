// System errors: failures of the app itself (database, server, network), as opposed to mistakes
// in what the user typed. Shown in the system error dialog / error page with enough detail to report.

export type Subsystem = 'Database' | 'Server' | 'Network' | 'Security';

export type SystemErrorInfo = {
	subsystem: Subsystem;
	/** Stable machine-readable code, e.g. `DB_SCHEMA_MISSING`. */
	code: string;
	/** One sentence: what went wrong. */
	message: string;
	/** Details from the subsystem, without table names or other internals. */
	detail: string;
	/** HTTP status of the failed request, if there was one. */
	status?: number;
	/** Id of the server log entry with the full error. */
	reference?: string;
	/** ISO time when the error happened. */
	time: string;
};

/** Plain-text version for "Copy error details". */
export function systemErrorText(e: SystemErrorInfo): string {
	return [
		`QuizLab system error`,
		`Subsystem: ${e.subsystem}`,
		`Code: ${e.code}`,
		`What happened: ${e.message}`,
		`Details: ${e.detail}`,
		e.status ? `HTTP status: ${e.status}` : '',
		e.reference ? `Reference: ${e.reference}` : '',
		`Time: ${e.time}`
	]
		.filter(Boolean)
		.join('\n');
}
