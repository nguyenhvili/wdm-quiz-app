// Browser-only storage. Every access is wrapped in try/catch: the app must work without localStorage.
// Nothing stored here is ever sent to the server.
import type { FavouriteQuiz, MyQuiz, SharedQuiz, TakenQuiz } from './types';

function read<T>(key: string): T[] {
	try {
		const value = JSON.parse(localStorage.getItem(key) ?? '[]');
		return Array.isArray(value) ? value : [];
	} catch {
		return [];
	}
}

function write(key: string, value: unknown[]): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage full or unavailable: nothing to do.
	}
}

/** A list of `{ id, … }` entries, most recent first, capped at `max` entries. */
function list<T extends { id: string }>(key: string, max = 100) {
	return {
		list: (): T[] => read<T>(key),
		has: (id: string): boolean => read<T>(key).some((q) => q.id === id),
		/** Adds or replaces an entry and moves it to the front. */
		save(entry: T): void {
			write(key, [entry, ...read<T>(key).filter((q) => q.id !== entry.id)].slice(0, max));
		},
		/** Updates an entry in place (e.g. a changed title) without moving it; does nothing if it isn't there. */
		update(id: string, change: Partial<T>): void {
			const entries = read<T>(key);
			if (entries.some((q) => q.id === id)) write(key, entries.map((q) => (q.id === id ? { ...q, ...change } : q)));
		},
		remove(id: string): void {
			write(key, read<T>(key).filter((q) => q.id !== id));
		},
		clear(): void {
			write(key, []);
		}
	};
}

/** Quizzes created in this browser, with their edit tokens ("My quizzes"). Never capped. */
export const myQuizzes = list<MyQuiz>('quizlab:my-quizzes', Infinity);

/** History of taken quizzes with the last score ("Recently taken"). */
export const takenQuizzes = list<TakenQuiz>('quizlab:taken');

/** Quizzes marked as favourite. */
export const favourites = list<FavouriteQuiz>('quizlab:favourites');

/** Quizzes opened through a shared link (not the user's own). */
export const sharedQuizzes = list<SharedQuiz>('quizlab:shared');

/** Own quizzes the user removed from the home screen row; they stay in "My quizzes". */
export const hiddenFromHome = list<{ id: string }>('quizlab:hidden-from-home');
