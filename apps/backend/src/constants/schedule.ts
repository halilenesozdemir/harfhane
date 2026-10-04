export const ACTIVE_WORD_LENGTHS = [4, 5, 6] as const;

export type ActiveWordLength = (typeof ACTIVE_WORD_LENGTHS)[number];

export const SCHEDULE_WARNING_DAYS = 14;

export const SCHEDULE_CRITICAL_DAYS = 3;
