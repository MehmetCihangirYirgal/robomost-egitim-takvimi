// Core academic-calendar data model.
//
// IMPORTANT DOMAIN RULE:
// "Eğitim Ayı" (education month) is NOT a calendar month. It is a group of
// exactly 4 ACTIVE education weeks. Weeks marked isActive=false (holidays /
// no-lesson weeks) do not count towards that quota, but they still occupy a
// place on the timeline (so the printed calendar can show them as crossed
// out) and they still fall "inside" whichever education month spans them.

export type Weekday =
  | "Pazartesi"
  | "Salı"
  | "Çarşamba"
  | "Perşembe"
  | "Cuma"
  | "Cumartesi"
  | "Pazar";

export const WEEKDAYS: Weekday[] = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar"
];

// JS Date#getDay() -> 0=Sunday..6=Saturday. Map to our Turkish weekday labels.
export const JS_DAY_TO_WEEKDAY: Weekday[] = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi"
];

/** A single calendar week that matters for scheduling purposes. */
export interface EducationWeek {
  id: string;
  /** Sequence number within the whole academic year, chronological, 1-based. */
  sequence: number;
  /** ISO date (YYYY-MM-DD) for the Monday of this week. */
  weekStart: string;
  /** ISO date (YYYY-MM-DD) for the Sunday of this week. */
  weekEnd: string;
  /** false = holiday / no lesson week. Does not count towards the 4-week quota. */
  isActive: boolean;
  /** Required when isActive is false, e.g. "Kurban Bayramı", "Resmî Tatil". */
  holidayReason?: string;
}

/** A computed (derived) "Eğitim Ayı" — always exactly 4 active weeks. */
export interface EducationPeriod {
  id: string;
  /** 1-based order within the academic year. */
  index: number;
  label: string; // "1. Eğitim Ayı"
  startDate: string; // ISO date of the first week's Monday in this period
  endDate: string; // ISO date of the last ACTIVE week's Sunday in this period
  weeks: EducationWeek[]; // all weeks (active + holiday) that fall inside this period
  activeWeeks: EducationWeek[]; // convenience: weeks.filter(w => w.isActive), always length 4
}

export interface AcademicYear {
  id: string;
  label: string; // "2026-2027"
  /** Flat, chronologically-sorted list of the weeks that matter (active + explicit holidays). */
  weeks: EducationWeek[];
  /** Free-text note shown to staff, e.g. term end date description. */
  note?: string;
}
