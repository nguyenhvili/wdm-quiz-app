// fetch() wrapper for the app's own JSON API. Distinguishes problems the user can fix
// (400/401/404 → `userError`) from failures of the system itself (→ `systemError`).
import type { SystemErrorInfo } from './systemError';

export type ApiResult<T> =
	| { ok: true; status: number; data: T }
	| { ok: false; status: number; userError: string }
	| { ok: false; status: number; systemError: SystemErrorInfo };

const now = () => new Date().toISOString();

export async function api<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
	let res: Response;
	try {
		res = await fetch(path, { ...init, headers: { accept: 'application/json', ...init.headers } });
	} catch (e) {
		const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
		return {
			ok: false,
			status: 0,
			systemError: {
				subsystem: 'Network',
				code: offline ? 'NET_OFFLINE' : 'NET_UNREACHABLE',
				message: "The browser couldn't reach the QuizLab server.",
				detail: offline
					? 'This device is offline. Connect to the internet and try again.'
					: `The request failed before the server answered (${e instanceof Error ? e.message : 'unknown reason'}). The server may be down, or the connection was blocked.`,
				time: now()
			}
		};
	}

	if (res.status === 204) return { ok: true, status: 204, data: undefined as T };

	const text = await res.text();
	let body: unknown = null;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		// Not JSON – handled below.
	}

	if (res.ok) {
		if (body === null && text) return { ok: false, status: res.status, systemError: unexpected(res, 'not JSON') };
		return { ok: true, status: res.status, data: body as T };
	}

	const b = body as { error?: string; message?: string; system?: SystemErrorInfo } | null;
	if (b?.system) return { ok: false, status: res.status, systemError: { ...b.system, status: res.status } };
	if (res.status < 500 && b?.error) return { ok: false, status: res.status, userError: b.error };
	return { ok: false, status: res.status, systemError: unexpected(res, b?.message ?? b?.error) };
}

function unexpected(res: Response, info?: string): SystemErrorInfo {
	const gateway = res.status === 502 || res.status === 503 || res.status === 504;
	return {
		subsystem: 'Server',
		code: gateway ? 'SERVER_UNAVAILABLE' : `HTTP_${res.status}`,
		message: gateway ? 'The QuizLab server is not available right now.' : 'The server returned an unexpected response.',
		detail: `HTTP ${res.status} ${res.statusText}${info ? ` – ${info}` : ''}`.trim(),
		status: res.status,
		time: now()
	};
}
