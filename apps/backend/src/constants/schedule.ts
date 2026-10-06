export const SCHEDULED_WORD_LENGTHS = [4, 5, 6] as const;

export type ScheduledWordLength = (typeof SCHEDULED_WORD_LENGTHS)[number];

export const SCHEDULE_WARNING_DAYS = 14;

export const SCHEDULE_CRITICAL_DAYS = 3;

export const ANSWER_REPEAT_COOLDOWN_DAYS = 1095;

export const RESTOCK_WARNING_DAYS = 180;

export const SCHEDULE_TOPUP_DAYS = 90;
