/**
 * Learners are in Cambodia, which is UTC+7 with no DST. Bucketing activity by
 * UTC date would roll the "day" over at 07:00 local time, so an evening study
 * session and the next morning's would count as one day.
 */
export const LEARNER_TIMEZONE = 'Asia/Phnom_Penh';

/** Today's calendar date in the learner's timezone, as `YYYY-MM-DD`. */
export function learnerToday(now: Date = new Date()): string {
  // en-CA formats as ISO (YYYY-MM-DD), which is what we compare on.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LEARNER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Midnight UTC for a `YYYY-MM-DD` day, so day arithmetic is DST-proof. */
const dayValue = (day: string) => Date.parse(`${day}T00:00:00Z`);
const DAY_MS = 86_400_000;

/**
 * The learner's consecutive-day streak.
 *
 * `days` are the calendar days they completed something on, in the learner's
 * own timezone, newest first. A streak survives until a whole day is missed —
 * someone who studied yesterday but not yet today still holds their streak,
 * which is what makes "don't break your streak" prompts meaningful.
 *
 * Returns 0 when the most recent activity is older than yesterday.
 */
export function streakFromDays(days: string[], today: string): number {
  if (!days.length) return 0;

  const todayValue = dayValue(today);
  const gap = Math.round((todayValue - dayValue(days[0])) / DAY_MS);

  // Older than yesterday: broken. Negative means activity dated in the future
  // (clock skew) — don't reward it.
  if (gap > 1 || gap < 0) return 0;

  let streak = 1;
  let previous = dayValue(days[0]);

  for (let i = 1; i < days.length; i++) {
    const current = dayValue(days[i]);
    const diff = Math.round((previous - current) / DAY_MS);
    // Tolerate a repeated day rather than silently undercounting, in case the
    // caller forgets to select distinct.
    if (diff === 0) continue;
    if (diff !== 1) break;
    streak++;
    previous = current;
  }

  return streak;
}
