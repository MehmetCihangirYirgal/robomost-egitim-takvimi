import type { AcademicYear, EducationPeriod, EducationWeek, Weekday } from "../types/calendar";
import { WEEKDAY_OFFSET_FROM_MONDAY, addDaysISO, compareISO } from "./dateUtils";

/**
 * Groups the flat, chronological list of weeks into "Eğitim Ayı" periods.
 *
 * RULE (source of truth): 1 Eğitim Ayı = exactly 4 ACTIVE education weeks.
 * Inactive (holiday) weeks that fall between two active weeks of the same
 * group are absorbed into that period (so the printed range still reads
 * correctly, e.g. "24 Nisan – 30 Mayıs") but do NOT count towards the 4.
 *
 * This is a pure, data-driven computation — it does not hard-code any period
 * boundaries — so adding/removing/toggling holiday weeks on an AcademicYear
 * automatically reflows every period after it.
 */
export function calculateEducationPeriods(academicYear: AcademicYear): EducationPeriod[] {
  const weeks = [...academicYear.weeks].sort((a, b) => a.sequence - b.sequence);

  const periods: EducationPeriod[] = [];
  let bucket: EducationWeek[] = [];
  let periodIndex = 0;

  const flushBucket = () => {
    if (bucket.length === 0) return;
    periodIndex += 1;
    const activeWeeks = bucket.filter((w) => w.isActive);
    const last = activeWeeks[activeWeeks.length - 1] ?? bucket[bucket.length - 1];
    periods.push({
      id: `${academicYear.id}-p${periodIndex}`,
      index: periodIndex,
      label: `${periodIndex}. Eğitim Ayı`,
      startDate: bucket[0].weekStart,
      endDate: last.weekEnd,
      weeks: bucket,
      activeWeeks
    });
    bucket = [];
  };

  for (const week of weeks) {
    bucket.push(week);
    const activeCountInBucket = bucket.filter((w) => w.isActive).length;
    if (activeCountInBucket === 4) {
      flushBucket();
    }
  }
  // Trailing partial bucket (fewer than 4 active weeks left, e.g. an
  // in-progress future term) is still exposed as a period so it can be
  // scheduled against, it's just marked incomplete via activeWeeks.length < 4.
  flushBucket();

  return periods;
}

/** Finds the education period a given ISO date falls into (by date range). */
export function findPeriodForDate(periods: EducationPeriod[], iso: string): EducationPeriod | undefined {
  return periods.find((p) => compareISO(iso, p.startDate) >= 0 && compareISO(iso, p.endDate) <= 0);
}

/**
 * Computes the actual lesson date(s) for a given active education week and
 * the student's selected program day(s). A week with 2 program days (e.g.
 * Cumartesi + Pazar) yields 2 lesson dates but still counts as a single
 * active education week towards the 4-week quota.
 */
export function getLessonDatesForWeek(week: EducationWeek, programDays: Weekday[]): string[] {
  return programDays
    .map((day) => addDaysISO(week.weekStart, WEEKDAY_OFFSET_FROM_MONDAY[day]))
    .sort(compareISO);
}

/** All real lesson dates for a student across a set of (already active) weeks. */
export function getStudentLessonDates(weeks: EducationWeek[], programDays: Weekday[]): string[] {
  return weeks
    .filter((w) => w.isActive)
    .flatMap((w) => getLessonDatesForWeek(w, programDays))
    .sort(compareISO);
}

/** Program end date = end date of the period the student's Nth active week falls in. */
export function calculateProgramEndDate(orderedActiveWeeks: EducationWeek[]): string | undefined {
  if (orderedActiveWeeks.length === 0) return undefined;
  return orderedActiveWeeks[orderedActiveWeeks.length - 1].weekEnd;
}

/**
 * Slices a flat list of active weeks (belonging to one or more periods) into
 * exactly the N weeks a student is scheduled to receive, starting at
 * `fromWeekSequence` (inclusive). Used both for brand-new enrollments and for
 * "existing group" partial joins.
 */
export function takeActiveWeeksFrom(
  allWeeks: EducationWeek[],
  fromWeekSequence: number,
  count: number
): EducationWeek[] {
  return allWeeks
    .filter((w) => w.isActive && w.sequence >= fromWeekSequence)
    .sort((a, b) => a.sequence - b.sequence)
    .slice(0, count);
}
