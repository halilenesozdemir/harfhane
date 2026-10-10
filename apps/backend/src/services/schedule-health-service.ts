import { getTodayString } from '@harfhane/shared';
import type { Env } from '../types/env';
import { findScheduleRunway, type ScheduleHealthRow } from '../repositories/schedule-health-repository';
import { SCHEDULE_WARNING_DAYS, SCHEDULE_CRITICAL_DAYS, RESTOCK_WARNING_DAYS } from '../constants/schedule';
import { sendScheduleAlertEmail } from '../utils/resend';
import { parsePlayableLengths } from '../utils/playable-lengths';

export type ScheduleHealthSeverity = 'ok' | 'warning' | 'critical';
export type RestockStatus = 'ok' | 'restock';

export interface ScheduleHealthEntry extends ScheduleHealthRow {
  severity: ScheduleHealthSeverity;
  restockStatus: RestockStatus;
}

export function severityFor(runwayDays: number): ScheduleHealthSeverity {
  if (runwayDays <= SCHEDULE_CRITICAL_DAYS) return 'critical';
  if (runwayDays <= SCHEDULE_WARNING_DAYS) return 'warning';
  return 'ok';
}

export function restockStatusFor(restockRunwayDays: number): RestockStatus {
  return restockRunwayDays < RESTOCK_WARNING_DAYS ? 'restock' : 'ok';
}

export async function getScheduleHealth(db: Env['DB']): Promise<ScheduleHealthEntry[]> {
  const rows = await findScheduleRunway(db, getTodayString());
  return rows.map((row) => ({
    ...row,
    severity: severityFor(row.runwayDays),
    restockStatus: restockStatusFor(row.restockRunwayDays),
  }));
}

/**
 * Alerts only on lengths production actually serves (PLAYABLE_WORD_LENGTHS), so
 * lengths that are scheduled but not playable yet don't trigger daily noise (Invariant 10).
 */
export async function checkScheduleHealthAndAlert(
  db: Env['DB'],
  resendApiKey: string,
  adminAlertEmail: string | undefined,
  playableWordLengthsRaw: string | undefined
): Promise<void> {
  if (!adminAlertEmail) return;

  const playableLengths = new Set<number>(parsePlayableLengths(playableWordLengthsRaw));
  const health = await getScheduleHealth(db);
  const playableHealth = health.filter((entry) => playableLengths.has(entry.length));
  const atRisk = playableHealth.filter((entry) => entry.severity !== 'ok' || entry.restockStatus !== 'ok');
  if (atRisk.length === 0) return;

  await sendScheduleAlertEmail(resendApiKey, adminAlertEmail, atRisk);
}
