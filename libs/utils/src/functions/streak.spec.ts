import { learnerToday, streakFromDays } from './streak';

describe('streakFromDays', () => {
  const TODAY = '2026-08-04';

  it('is zero when nothing has ever been completed', () => {
    expect(streakFromDays([], TODAY)).toBe(0);
  });

  it('counts a single day of activity today', () => {
    expect(streakFromDays(['2026-08-04'], TODAY)).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    expect(
      streakFromDays(['2026-08-04', '2026-08-03', '2026-08-02'], TODAY),
    ).toBe(3);
  });

  it('keeps the streak alive when yesterday was the last activity', () => {
    // The learner still has today to keep it going — this is what makes a
    // "don't break your streak" prompt meaningful.
    expect(streakFromDays(['2026-08-03', '2026-08-02'], TODAY)).toBe(2);
  });

  it('breaks once a whole day is missed', () => {
    expect(streakFromDays(['2026-08-02', '2026-08-01'], TODAY)).toBe(0);
  });

  it('stops at the first gap rather than counting all activity', () => {
    expect(
      streakFromDays(
        ['2026-08-04', '2026-08-03', '2026-07-30', '2026-07-29'],
        TODAY,
      ),
    ).toBe(2);
  });

  it('does not inflate when a day appears more than once', () => {
    expect(
      streakFromDays(['2026-08-04', '2026-08-04', '2026-08-03'], TODAY),
    ).toBe(2);
  });

  it('ignores activity dated in the future', () => {
    expect(streakFromDays(['2026-08-09'], TODAY)).toBe(0);
  });

  it('counts across a month boundary', () => {
    expect(
      streakFromDays(['2026-08-01', '2026-07-31', '2026-07-30'], '2026-08-01'),
    ).toBe(3);
  });

  it('counts across a leap day', () => {
    expect(
      streakFromDays(['2028-03-01', '2028-02-29', '2028-02-28'], '2028-03-01'),
    ).toBe(3);
  });
});

describe('learnerToday', () => {
  it('uses Cambodia time, not UTC', () => {
    // 22:30 UTC on the 4th is already 05:30 on the 5th in Phnom Penh. Bucketing
    // by UTC date would put a late-evening session on the wrong day.
    expect(learnerToday(new Date('2026-08-04T22:30:00Z'))).toBe('2026-08-05');
  });

  it('keeps an early-morning UTC time on the same local day', () => {
    expect(learnerToday(new Date('2026-08-04T01:00:00Z'))).toBe('2026-08-04');
  });

  it('formats as YYYY-MM-DD', () => {
    expect(learnerToday(new Date('2026-01-09T12:00:00Z'))).toBe('2026-01-09');
  });
});
