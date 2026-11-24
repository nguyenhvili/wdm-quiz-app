// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
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
