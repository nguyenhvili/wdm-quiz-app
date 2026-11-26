import type { HandleServerError } from '@sveltejs/kit/hooks';
import { describeError } from '#lib/server/errors.js';

// Unexpected errors in pages and API endpoints. The result becomes the JSON body of a failed
// API request, or `page.error` on the error page. Expected errors (`error(404, …)`) and
// SvelteKit's own errors keep their defaults.
export const handleError: HandleServerError = (caught) => {
	if (caught.kind !== 'unknown') return;

	// `vite dev` with the Cloudflare runtime can load SvelteKit twice, so an `error(404, …)` thrown in a
	// load function fails SvelteKit's instanceof check and arrives here as "unknown". Treat it as what it is.
	// (The production build doesn't have this problem.)
	const maybeHttp = caught.error as { constructor?: { name?: string }; status?: number; body?: App.Error };
	if (maybeHttp?.constructor?.name === 'HttpError' && maybeHttp.body && typeof maybeHttp.status === 'number') {
		return { ...maybeHttp.body, status: maybeHttp.status };
	}

	const { event } = caught;
	const system = describeError(caught.error, `${event.request.method} ${event.url.pathname}`);
	return { message: system.message, system };
};
