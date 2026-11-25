import type { HandleServerError } from '@sveltejs/kit/hooks';
import { describeError } from '#lib/server/errors.js';

// Unexpected errors in pages and API endpoints. The result becomes the JSON body of a failed
// API request, or `page.error` on the error page. Expected errors (`error(404, …)`) and
// SvelteKit's own errors keep their defaults.
export const handleError: HandleServerError = (caught) => {
	if (caught.kind !== 'unknown') return;
	const { event } = caught;
	const system = describeError(caught.error, `${event.request.method} ${event.url.pathname}`);
	return { message: system.message, system };
};
