// Quiz ids double as the "quiz code": 8 characters without look-alikes (no 0/O, 1/I/L).
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_LENGTH = 8;

const CODE_PATTERN = /^[2-9A-HJKMNP-Z]{8}$/;

/** Accepts codes in any case, with or without the dash; returns the canonical id or null. */
export function normalizeQuizCode(input: string): string | null {
	const code = input.toUpperCase().replace(/[\s-]/g, '');
	return CODE_PATTERN.test(code) ? code : null;
}

/** `X7K2M9QD` → `X7K2-M9QD` */
export function formatQuizCode(id: string): string {
	return `${id.slice(0, 4)}-${id.slice(4)}`;
}
