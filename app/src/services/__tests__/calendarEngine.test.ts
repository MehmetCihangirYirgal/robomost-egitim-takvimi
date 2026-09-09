import { describe, expect, it } from "vitest";
import { calculateEducationPeriods, getStudentLessonDates } from "../calendarEngine";
import { ACADEMIC_YEAR_2026_2027 } from "../../data/seedAcademicYear2026_2027";
import { SCENARIO_ACADEMIC_YEAR } from "./testFixtures";

describe("calculateEducationPeriods", () => {
  it("produces exactly 10 education months for the 2026-2027 seed calendar", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    expect(periods).toHaveLength(10);
    periods.forEach((p) => expect(p.activeWeeks).toHaveLength(4));
  });

  it("matches the documented boundaries for period 1 and period 2", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    expect(periods[0].startDate).toBe("2026-09-07"); // Monday of week containing 12 Sep
    expect(periods[0].endDate).toBe("2026-10-04"); // Sunday of week containing 3-4 Oct
    expect(periods[1].startDate).toBe("2026-10-05");
  });

  it("absorbs holiday weeks into period 9 without counting them, spanning 24 Apr - 30 May", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const p9 = periods[8];
    expect(p9.activeWeeks).toHaveLength(4);
    expect(p9.weeks).toHaveLength(6); // 4 active + 2 holiday weeks
    expect(p9.weeks.some((w) => w.holidayReason === "Resmî Tatil")).toBe(true);
    expect(p9.weeks.some((w) => w.holidayReason === "Kurban Bayramı")).toBe(true);
    expect(p9.startDate).toBe("2027-04-19"); // Monday of week containing 24 Apr
    expect(p9.endDate).toBe("2027-05-30"); // Sunday of week containing 29-30 May
  });

  it("recomputes automatically when a week is toggled inactive (extensibility)", () => {
    const before = calculateEducationPeriods(SCENARIO_ACADEMIC_YEAR);
    expect(before).toHaveLength(3);

    const modified = {
      ...SCENARIO_ACADEMIC_YEAR,
      weeks: SCENARIO_ACADEMIC_YEAR.weeks.map((w, i) => (i === 1 ? { ...w, isActive: false, holidayReason: "Test Tatili" } : w))
    };
    const after = calculateEducationPeriods(modified);
    // still 3 periods of 4 active weeks each, but period 1 now spans a 5th calendar week to compensate
    expect(after).toHaveLength(3);
    expect(after[0].activeWeeks).toHaveLength(4);
    expect(after[0].weeks).toHaveLength(5);
  });
});

describe("getStudentLessonDates", () => {
  it("returns Saturday dates when programDay is Cumartesi", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const dates = getStudentLessonDates(periods[0].activeWeeks, ["Cumartesi"]);
    expect(dates).toEqual(["2026-09-12", "2026-09-19", "2026-09-26", "2026-10-03"]);
  });

  it("returns Sunday dates when programDay is Pazar", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const dates = getStudentLessonDates(periods[0].activeWeeks, ["Pazar"]);
    expect(dates).toEqual(["2026-09-13", "2026-09-20", "2026-09-27", "2026-10-04"]);
  });

  it("returns both days when two program days are selected, without double counting weeks", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const dates = getStudentLessonDates(periods[0].activeWeeks, ["Cumartesi", "Pazar"]);
    expect(dates).toHaveLength(8);
  });

  it("skips holiday weeks entirely", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const p9 = periods[8];
    const dates = getStudentLessonDates(p9.activeWeeks, ["Cumartesi"]);
    expect(dates).not.toContain("2027-05-01");
    expect(dates).not.toContain("2027-05-15");
    expect(dates).toEqual(["2027-04-24", "2027-05-08", "2027-05-22", "2027-05-29"]);
  });
});
