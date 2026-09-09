import { describe, expect, it } from "vitest";
import { generatePaymentPlan, mergeManualOverrides, nearestOnOrBeforeByDayOfMonth } from "../paymentEngine";
import type { ExistingGroupEnrollment, NewEnrollment, PaymentSettings } from "../../types/student";
import { SCENARIO_ACADEMIC_YEAR, buildTestAcademicYear } from "./testFixtures";
import { ACADEMIC_YEAR_2026_2027 } from "../../data/seedAcademicYear2026_2027";
import { calculateEducationPeriods } from "../calendarEngine";

function basePayment(overrides: Partial<PaymentSettings> = {}): PaymentSettings {
  return {
    useCustomPaymentPlan: false,
    currency: "TRY",
    fullEducationMonthPrice: 6000,
    extraFees: [],
    ...overrides
  };
}

describe("generatePaymentPlan — section 32 worked example", () => {
  it("charges a 3/4 prorated first installment for a student joining in week 2 of the group", () => {
    const enrollment: ExistingGroupEnrollment = {
      mode: "existing-group",
      academicYearId: SCENARIO_ACADEMIC_YEAR.id,
      groupStartDate: "2026-09-12",
      groupProgramLengthWeeks: 12,
      enrollmentDate: "2026-09-19",
      programEndRule: "with-group"
    };

    const plan = generatePaymentPlan({
      academicYear: SCENARIO_ACADEMIC_YEAR,
      programDays: ["Cumartesi"],
      enrollment,
      payment: basePayment()
    });

    expect(plan.installments).toHaveLength(3);

    const [first, second, third] = plan.installments;
    expect(first.lessonDates).toEqual(["2026-09-19", "2026-09-26", "2026-10-03"]);
    expect(first.activeWeekCount).toBe(3);
    expect(first.isPartialPeriod).toBe(true);
    expect(first.finalAmount).toBe(4500);
    expect(first.finalDueDate).toBe("2026-09-19"); // registration date, not a past due date

    expect(second.activeWeekCount).toBe(4);
    expect(second.finalAmount).toBe(6000);
    expect(third.activeWeekCount).toBe(4);
    expect(third.finalAmount).toBe(6000);

    expect(plan.totalActiveWeeks).toBe(11);
    expect(plan.totals.grandTotal).toBe(16500);
  });
});

describe("generatePaymentPlan — partial-period edge cases (existing group)", () => {
  const weeklyBase: Omit<ExistingGroupEnrollment, "enrollmentDate"> = {
    mode: "existing-group",
    academicYearId: SCENARIO_ACADEMIC_YEAR.id,
    groupStartDate: "2026-09-12",
    groupProgramLengthWeeks: 4,
    programEndRule: "with-group"
  };

  it("charges full price when the student joins on the group's first week", () => {
    const plan = generatePaymentPlan({
      academicYear: SCENARIO_ACADEMIC_YEAR,
      programDays: ["Cumartesi"],
      enrollment: { ...weeklyBase, enrollmentDate: "2026-09-12" },
      payment: basePayment()
    });
    expect(plan.installments[0].activeWeekCount).toBe(4);
    expect(plan.installments[0].finalAmount).toBe(6000);
    expect(plan.installments[0].isPartialPeriod).toBe(false);
  });

  it("charges 3/4 price when the student joins on the group's second week", () => {
    const plan = generatePaymentPlan({
      academicYear: SCENARIO_ACADEMIC_YEAR,
      programDays: ["Cumartesi"],
      enrollment: { ...weeklyBase, enrollmentDate: "2026-09-19" },
      payment: basePayment()
    });
    expect(plan.installments[0].activeWeekCount).toBe(3);
    expect(plan.installments[0].finalAmount).toBe(4500);
  });

  it("charges 2/4 price when the student joins on the group's third week", () => {
    const plan = generatePaymentPlan({
      academicYear: SCENARIO_ACADEMIC_YEAR,
      programDays: ["Cumartesi"],
      enrollment: { ...weeklyBase, enrollmentDate: "2026-09-26" },
      payment: basePayment()
    });
    expect(plan.installments[0].activeWeekCount).toBe(2);
    expect(plan.installments[0].finalAmount).toBe(3000);
  });

  it("charges 1/4 price when the student joins on the group's fourth (last) week", () => {
    const plan = generatePaymentPlan({
      academicYear: SCENARIO_ACADEMIC_YEAR,
      programDays: ["Cumartesi"],
      enrollment: { ...weeklyBase, enrollmentDate: "2026-10-03" },
      payment: basePayment()
    });
    expect(plan.installments[0].activeWeekCount).toBe(1);
    expect(plan.installments[0].finalAmount).toBe(1500);
    expect(plan.installments).toHaveLength(1); // group ends right after, "with-group" rule
  });

  it("skips a holiday week that coincides with the enrollment date and starts on the next active week", () => {
    const yearWithHoliday = buildTestAcademicYear("ay-holiday-join", [
      { anchor: "2026-09-12", isActive: true },
      { anchor: "2026-09-19", isActive: false, holidayReason: "Test Tatili" },
      { anchor: "2026-09-26", isActive: true },
      { anchor: "2026-10-03", isActive: true }
    ]);
    const plan = generatePaymentPlan({
      academicYear: yearWithHoliday,
      programDays: ["Cumartesi"],
      enrollment: {
        mode: "existing-group",
        academicYearId: yearWithHoliday.id,
        groupStartDate: "2026-09-12",
        groupProgramLengthWeeks: 4,
        enrollmentDate: "2026-09-19", // lands on the holiday week
        programEndRule: "with-group"
      },
      payment: basePayment()
    });
    // Registration date is the holiday week; the first real lesson should be 26 Sep, not 19 Sep.
    expect(plan.installments[0].lessonDates[0]).toBe("2026-09-26");
    expect(plan.installments[0].activeWeekCount).toBe(2); // 26 Sep + 3 Oct
  });

  it("uses the registration date (not a past due date) as the default due date for a partial first period", () => {
    const plan = generatePaymentPlan({
      academicYear: SCENARIO_ACADEMIC_YEAR,
      programDays: ["Cumartesi"],
      enrollment: { ...weeklyBase, enrollmentDate: "2026-09-19" },
      payment: basePayment()
    });
    // Standard rule (period start - 1 day) would be 11 Sep — in the past relative to enrollment.
    expect(plan.installments[0].finalDueDate).not.toBe("2026-09-11");
    expect(plan.installments[0].finalDueDate).toBe("2026-09-19");
  });
});

describe("generatePaymentPlan — new enrollment mode", () => {
  it("bills exactly one full installment per education month for a fresh 8-week program", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const enrollment: NewEnrollment = {
      mode: "new",
      academicYearId: ACADEMIC_YEAR_2026_2027.id,
      startPeriodId: periods[0].id,
      programLength: { unit: "weeks", value: 8 }
    };
    const plan = generatePaymentPlan({
      academicYear: ACADEMIC_YEAR_2026_2027,
      programDays: ["Cumartesi"],
      enrollment,
      payment: basePayment()
    });
    expect(plan.installments).toHaveLength(2);
    expect(plan.installments.every((i) => i.activeWeekCount === 4)).toBe(true);
    expect(plan.totals.grandTotal).toBe(12000);
    // Default due date rule: day before the period starts.
    expect(plan.installments[1].finalDueDate).toBe("2026-10-09");
  });

  it("applies a fixed custom payment day-of-month when configured", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const enrollment: NewEnrollment = {
      mode: "new",
      academicYearId: ACADEMIC_YEAR_2026_2027.id,
      startPeriodId: periods[1].id,
      programLength: { unit: "weeks", value: 4 }
    };
    const plan = generatePaymentPlan({
      academicYear: ACADEMIC_YEAR_2026_2027,
      programDays: ["Cumartesi"],
      enrollment,
      payment: basePayment({ useCustomPaymentPlan: true, customMode: "fixed-day-of-month", fixedDayOfMonth: 15 })
    });
    // Period 2 starts 5 Oct 2026 -> nearest 15th on/before is 15 Sep 2026.
    expect(plan.installments[0].finalDueDate).toBe("2026-09-15");
  });

  it("applies extra fees only to the installments they are configured for", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const enrollment: NewEnrollment = {
      mode: "new",
      academicYearId: ACADEMIC_YEAR_2026_2027.id,
      startPeriodId: periods[0].id,
      programLength: { unit: "months", value: 2 }
    };
    const plan = generatePaymentPlan({
      academicYear: ACADEMIC_YEAR_2026_2027,
      programDays: ["Cumartesi"],
      enrollment,
      payment: basePayment({
        extraFees: [{ id: "set", label: "Eğitim seti ücreti", amount: 2500, appliesTo: "first-installment" }]
      })
    });
    expect(plan.installments[0].finalAmount).toBe(8500);
    expect(plan.installments[1].finalAmount).toBe(6000);
    expect(plan.totals.extraFeesTotal).toBe(2500);
    expect(plan.totals.grandTotal).toBe(14500);
  });

  it("flags a validation-worthy shortfall when the program runs past the academic year (fewer weeks returned than requested)", () => {
    const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);
    const lastPeriod = periods[periods.length - 1];
    const enrollment: NewEnrollment = {
      mode: "new",
      academicYearId: ACADEMIC_YEAR_2026_2027.id,
      startPeriodId: lastPeriod.id,
      programLength: { unit: "weeks", value: 8 } // only 4 weeks actually remain
    };
    const plan = generatePaymentPlan({
      academicYear: ACADEMIC_YEAR_2026_2027,
      programDays: ["Cumartesi"],
      enrollment,
      payment: basePayment()
    });
    expect(plan.totalActiveWeeks).toBe(4); // capped by calendar, not the requested 8
  });
});

describe("mergeManualOverrides", () => {
  it("preserves a staff-edited amount and due date across a recalculation", () => {
    const periods = calculateEducationPeriods(SCENARIO_ACADEMIC_YEAR);
    const enrollment: NewEnrollment = {
      mode: "new",
      academicYearId: SCENARIO_ACADEMIC_YEAR.id,
      startPeriodId: periods[0].id,
      programLength: { unit: "weeks", value: 4 }
    };
    const original = generatePaymentPlan({
      academicYear: SCENARIO_ACADEMIC_YEAR,
      programDays: ["Cumartesi"],
      enrollment,
      payment: basePayment()
    });

    const edited = original.installments.map((i) => ({ ...i }));
    edited[0].finalAmount = 4000;
    edited[0].isAmountOverridden = true;
    edited[0].finalDueDate = "2026-09-01";
    edited[0].isDueDateOverridden = true;

    const recalculated = generatePaymentPlan({
      academicYear: SCENARIO_ACADEMIC_YEAR,
      programDays: ["Cumartesi"],
      enrollment,
      payment: basePayment({ fullEducationMonthPrice: 7000 }) // price changed
    });

    const merged = mergeManualOverrides(recalculated.installments, edited);
    expect(merged[0].finalAmount).toBe(4000);
    expect(merged[0].isAmountOverridden).toBe(true);
    expect(merged[0].finalDueDate).toBe("2026-09-01");
    expect(merged[0].calculatedAmount).toBe(7000); // recalculated value still tracked underneath
  });
});

describe("nearestOnOrBeforeByDayOfMonth", () => {
  it("stays in the same month when the day has not passed yet", () => {
    expect(nearestOnOrBeforeByDayOfMonth("2026-10-20", 15)).toBe("2026-10-15");
  });
  it("rolls back to the previous month when the day has already passed", () => {
    expect(nearestOnOrBeforeByDayOfMonth("2026-10-10", 15)).toBe("2026-09-15");
  });
});
