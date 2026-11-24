// Input limits shared by the zod schema (server) and the editor (client, as maxlength etc.).
export const LIMITS = {
	title: 200,
	description: 2000,
	tags: 10,
	tag: 30,
	questions: 200,
	text: 2000,
	explanation: 2000,
	options: 10,
	pairs: 10,
	items: 10,
	id: 64
} as const;
