export const SCHEDULED_WORD_LENGTHS = [4, 5, 6] as const;

export type ScheduledWordLength = (typeof SCHEDULED_WORD_LENGTHS)[number];

/**
 * @deprecated Use SCHEDULED_WORD_LENGTHS. Kept as an alias so repositories
 * owned by other plan units do not need to change in this PR (Plan 008 U1).
 */
export const ACTIVE_WORD_LENGTHS = SCHEDULED_WORD_LENGTHS;

/** @deprecated Use ScheduledWordLength. */
export type ActiveWordLength = ScheduledWordLength;

export const SCHEDULE_WARNING_DAYS = 14;

export const SCHEDULE_CRITICAL_DAYS = 3;
