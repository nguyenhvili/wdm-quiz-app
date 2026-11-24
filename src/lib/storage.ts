// Browser-only storage. Every access is wrapped in try/catch: the app must work without localStorage.
import type { MyQuiz } from './types';

const MY_QUIZZES = 'quizlab:my-quizzes';

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

export const myQuizzes = {
	list: (): MyQuiz[] => read<MyQuiz>(MY_QUIZZES),
	/** Adds or updates a quiz; the most recent one goes first. */
	save(quiz: MyQuiz): void {
		write(MY_QUIZZES, [quiz, ...this.list().filter((q) => q.id !== quiz.id)]);
	},
	remove(id: string): void {
		write(MY_QUIZZES, this.list().filter((q) => q.id !== id));
	}
};
