// Shared types for quizzes and questions. Must stay in sync with the zod schema in ./schema.ts.

export type Visibility = 'public' | 'unlisted';

/** `explanation` = why the correct answer is right. */
type Base = { id: string; text: string; explanation?: string };

/** `explanation` = why this option is wrong. */
export type Option = { id: string; text: string; correct: boolean; explanation?: string };

export type MatchingPair = { left: string; right: string };

export type Question = Base &
	(
		| { type: 'single'; options: Option[] } // >= 2 options, exactly 1 correct
		| { type: 'multiple'; options: Option[] } // >= 2 options, >= 1 correct
		| { type: 'truefalse'; correct: boolean; incorrectExplanation?: string }
		| { type: 'numeric'; value: number; tolerance?: number; incorrectExplanation?: string }
		| { type: 'matching'; pairs: MatchingPair[]; incorrectExplanation?: string } // >= 2 pairs
		| { type: 'ordering'; items: string[]; incorrectExplanation?: string } // stored in correct order
	);

export type QuestionType = Question['type'];

/** Body of POST /api/quizzes and PUT /api/quizzes/:id. */
export type QuizInput = {
	title: string;
	description: string;
	tags: string[];
	visibility: Visibility;
	questions: Question[];
};

/** A quiz as returned by GET /api/quizzes/:id (never includes the edit token hash). */
export type Quiz = QuizInput & {
	id: string;
	questionCount: number;
	startCount: number;
	forkedFrom: string | null;
	createdAt: string;
	updatedAt: string;
};

/** A quiz as listed in the catalogue (GET /api/quizzes), without questions. */
export type QuizSummary = Omit<Quiz, 'questions'>;

/** Response of POST /api/quizzes and POST /api/quizzes/:id/fork. */
export type CreatedQuiz = { id: string; editToken: string };

/** Entry of "My quizzes" in localStorage. */
export type MyQuiz = { id: string; title: string; editToken: string };

/** Entry of "Recently taken" in localStorage. `score` is a fraction 0–1. */
export type TakenQuiz = { id: string; title: string; date: string; score: number };

/** Entry of "Favourites" in localStorage. */
export type FavouriteQuiz = { id: string; title: string };

/** Entry of "Shared with you" in localStorage: a quiz opened through a shared link. `date` = last opened. */
export type SharedQuiz = { id: string; title: string; date: string };
