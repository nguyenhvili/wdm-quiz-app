// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SystemErrorInfo } from '#lib/systemError.js';

declare global {
	namespace App {
		interface Error {
			message: string;
			/** Set for unexpected failures (see src/hooks.server.ts). */
			system?: SystemErrorInfo;
		}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			/** Sub-screen of the quiz editor, kept in history so the back button works. */
			editorView?: 'tags' | 'question' | 'type' | 'links';
		}
		// interface Platform {} – not used: bindings come from `import { env } from 'cloudflare:workers'`
	}
}

export {};
