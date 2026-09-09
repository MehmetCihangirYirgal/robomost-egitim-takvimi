import type { AcademicYear, EducationPeriod, EducationWeek, Weekday } from "../types/calendar";
import type {
  Enrollment,
  ExistingGroupEnrollment,
  ExtraFee,
  NewEnrollment,
  PaymentInstallment,
  PaymentPlan,
  PaymentSettings
} from "../types/student";
import { calculateEducationPeriods, calculateProgramEndDate, findPeriodForDate, getLessonDatesForWeek, getStudentLessonDates } from "./calendarEngine";
import { addDaysISO, compareISO, formatRange, parseISO, toISO } from "./dateUtils";

export interface GeneratePaymentPlanInput {
  academicYear: AcademicYear;
  programDays: Weekday[];
  enrollment: Enrollment;
  payment: PaymentSettings;
}

export interface PlanValidationError {
  message: string;
}

/** Finds the nearest date on/before `iso` whose day-of-month equals `day`. */
export function nearestOnOrBeforeByDayOfMonth(iso: string, day: number): string {
  const d = parseISO(iso);
  let year = d.getFullYear();
  let month = d.getMonth();
  if (d.getDate() < day) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(day, daysInMonth);
  return toISO(new Date(year, month, clampedDay));
}

/**
 * Standard due-date rule: payment for an education period is due the day
 * before it starts, unless a custom "fixed day of month" plan is active.
 * ("Manual" custom mode uses the same computed default — staff then edits
 * individual rows by hand; the system never guesses an arbitrary date.)
 */
export function calculatePaymentDueDates(periodStartDate: string, payment: PaymentSettings): string {
  if (payment.useCustomPaymentPlan && payment.customMode === "fixed-day-of-month" && payment.fixedDayOfMonth) {
    return nearestOnOrBeforeByDayOfMonth(periodStartDate, payment.fixedDayOfMonth);
  }
  return addDaysISO(periodStartDate, -1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function extraFeesFor(installmentNumber: number, isLast: boolean, extraFees: ExtraFee[]): { label: string; amount: number }[] {
  return extraFees
    .filter((fee) => {
      switch (fee.appliesTo) {
        case "first-installment":
          return installmentNumber === 1;
        case "last-installment":
          return isLast;
        case "all-installments":
          return true;
        case "specific":
          return fee.specificInstallments?.includes(installmentNumber) ?? false;
        default:
          return false;
      }
    })
    .map((fee) => ({ label: fee.label, amount: fee.amount }));
}

/** Finds the earliest active-week lesson date on/after `fromDate` that matches one of programDays. */
function firstLessonOnOrAfter(
  orderedActiveWeeks: EducationWeek[],
  programDays: Weekday[],
  fromDate: string
): { week: EducationWeek; lessonDate: string } | undefined {
  for (const week of orderedActiveWeeks) {
    if (compareISO(week.weekEnd, fromDate) < 0) continue;
    const dates = getLessonDatesForWeek(week, programDays).filter((d) => compareISO(d, fromDate) >= 0);
    if (dates.length > 0) {
      return { week, lessonDate: dates[0] };
    }
  }
  return undefined;
}

interface WeekChunk {
  weeks: EducationWeek[];
  period: EducationPeriod | undefined;
}

function buildInstallment(
  installmentNumber: number,
  chunk: WeekChunk,
  programDays: Weekday[],
  payment: PaymentSettings,
  isLast: boolean,
  overrideDueDate?: string,
  overrideDescription?: string
): PaymentInstallment {
  const weeklyPrice = payment.fullEducationMonthPrice / 4;
  const activeWeekCount = chunk.weeks.length;
  const isPartialPeriod = activeWeekCount < 4;
  const lessonDates = chunk.weeks.flatMap((w) => getLessonDatesForWeek(w, programDays)).sort(compareISO);

  const baseAmount = round2(weeklyPrice * activeWeekCount);
  const applied = extraFeesFor(installmentNumber, isLast, payment.extraFees);
  const calculatedAmount = round2(baseAmount + applied.reduce((s, f) => s + f.amount, 0));

  // Due date is anchored on the first REAL lesson date of the period (the
  // date the student's program day actually falls on), not the calendar
  // week's Monday — per spec: "2. Eğitim Ayı 10 Ekim'de başlıyorsa ödeme son
  // tarihi 9 Ekim'dir", where 10 Ekim is itself the first lesson date.
  const firstLessonDate = lessonDates[0] ?? chunk.period?.startDate ?? chunk.weeks[0].weekStart;
  const calculatedDueDate = overrideDueDate ?? calculatePaymentDueDates(firstLessonDate, payment);

  // Displayed range starts at the actual first lesson date (matching how
  // ROBOMOST staff refer to a period, e.g. "10 Ekim – 1 Kasım"), not the
  // Monday of the containing calendar week.
  const startDate = firstLessonDate;
  const endDate = chunk.weeks[chunk.weeks.length - 1].weekEnd;

  return {
    id: `inst-${installmentNumber}`,
    installmentNumber,
    periodLabel: formatRange(startDate, endDate),
    lessonDates,
    activeWeekCount,
    isPartialPeriod,
    calculatedDueDate,
    finalDueDate: calculatedDueDate,
    isDueDateOverridden: false,
    calculatedAmount,
    finalAmount: calculatedAmount,
    isAmountOverridden: false,
    appliedExtraFees: applied,
    description: overrideDescription ?? (isPartialPeriod ? "Kısmi Eğitim Dönemi" : undefined)
  };
}

function chunkWeeksByFour(weeks: EducationWeek[], periods: EducationPeriod[]): WeekChunk[] {
  const chunks: WeekChunk[] = [];
  for (let i = 0; i < weeks.length; i += 4) {
    const slice = weeks.slice(i, i + 4);
    chunks.push({ weeks: slice, period: findPeriodForDate(periods, slice[0].weekStart) });
  }
  return chunks;
}

function generateNewEnrollmentPlan(
  enrollment: NewEnrollment,
  periods: EducationPeriod[],
  orderedActiveWeeks: EducationWeek[],
  programDays: Weekday[],
  payment: PaymentSettings
): PaymentPlan {
  const startPeriod = periods.find((p) => p.id === enrollment.startPeriodId);
  if (!startPeriod || startPeriod.activeWeeks.length === 0) {
    throw new Error("Başlangıç eğitim ayı bulunamadı.");
  }
  const totalWeeks =
    enrollment.programLength.unit === "months" ? enrollment.programLength.value * 4 : enrollment.programLength.value;

  const startSeq = startPeriod.activeWeeks[0].sequence;
  const studentWeeks = orderedActiveWeeks.filter((w) => w.sequence >= startSeq).slice(0, totalWeeks);

  const chunks = chunkWeeksByFour(studentWeeks, periods);
  const installments = chunks.map((chunk, i) => buildInstallment(i + 1, chunk, programDays, payment, i === chunks.length - 1));

  return buildPlanResult(installments, studentWeeks, payment);
}

function resolveFirstLessonDate(
  enrollment: ExistingGroupEnrollment,
  orderedActiveWeeks: EducationWeek[],
  programDays: Weekday[]
): { week: EducationWeek; lessonDate: string } {
  if (enrollment.firstLessonDateOverride) {
    const iso = enrollment.firstLessonDateOverride;
    const week = orderedActiveWeeks.find((w) => compareISO(w.weekStart, iso) <= 0 && compareISO(iso, w.weekEnd) <= 0);
    if (week) return { week, lessonDate: iso };
  }
  const found = firstLessonOnOrAfter(orderedActiveWeeks, programDays, enrollment.enrollmentDate);
  if (!found) {
    throw new Error("Öğrencinin katılım tarihinden sonra akademik takvimde aktif ders bulunamadı.");
  }
  return found;
}

function generateExistingGroupPlan(
  enrollment: ExistingGroupEnrollment,
  periods: EducationPeriod[],
  orderedActiveWeeks: EducationWeek[],
  programDays: Weekday[],
  payment: PaymentSettings
): PaymentPlan {
  const { week: firstWeek, lessonDate: firstLessonDate } = resolveFirstLessonDate(enrollment, orderedActiveWeeks, programDays);

  const studentStartIdx = orderedActiveWeeks.findIndex((w) => w.id === firstWeek.id);
  const homePeriod = findPeriodForDate(periods, firstWeek.weekStart);
  if (!homePeriod) {
    throw new Error("Öğrencinin katılacağı eğitim ayı akademik takvimde bulunamadı.");
  }

  const remainingInFirstPeriod = homePeriod.activeWeeks.filter((w) => w.sequence >= firstWeek.sequence).length;

  // Determine total active weeks the student will actually receive.
  const groupStartMatch = firstLessonOnOrAfter(orderedActiveWeeks, programDays, enrollment.groupStartDate);
  const groupStartIdx = groupStartMatch ? orderedActiveWeeks.findIndex((w) => w.id === groupStartMatch.week.id) : 0;
  const groupEndIdx = groupStartIdx + enrollment.groupProgramLengthWeeks - 1;

  let studentTotalActiveWeeks: number;
  if (enrollment.programEndRule === "with-group") {
    studentTotalActiveWeeks = Math.max(1, groupEndIdx - studentStartIdx + 1);
  } else if (enrollment.programEndRule === "own-length") {
    studentTotalActiveWeeks = enrollment.ownLengthActiveWeeks ?? Math.max(1, groupEndIdx - studentStartIdx + 1);
  } else {
    // manual
    if (enrollment.manualEndActiveWeeks) {
      studentTotalActiveWeeks = enrollment.manualEndActiveWeeks;
    } else if (enrollment.manualEndDate) {
      const upto = orderedActiveWeeks.filter(
        (w) => w.sequence >= firstWeek.sequence && compareISO(w.weekEnd, enrollment.manualEndDate!) <= 0
      );
      studentTotalActiveWeeks = Math.max(1, upto.length);
    } else {
      studentTotalActiveWeeks = Math.max(1, groupEndIdx - studentStartIdx + 1);
    }
  }

  const studentWeeks = orderedActiveWeeks.slice(studentStartIdx, studentStartIdx + studentTotalActiveWeeks);

  const firstChunkWeeks = studentWeeks.slice(0, remainingInFirstPeriod);
  const restWeeks = studentWeeks.slice(remainingInFirstPeriod);
  const restChunks = chunkWeeksByFour(restWeeks, periods);

  const installments: PaymentInstallment[] = [];

  const firstIsLast = restChunks.length === 0;
  const firstDueDateOverride = enrollment.enrollmentDate;
  installments.push(
    buildInstallment(
      1,
      { weeks: firstChunkWeeks, period: homePeriod },
      programDays,
      payment,
      firstIsLast,
      firstChunkWeeks.length < 4 ? firstDueDateOverride : undefined,
      firstChunkWeeks.length < 4 ? "Kısmi Eğitim Dönemi" : undefined
    )
  );

  restChunks.forEach((chunk, i) => {
    installments.push(buildInstallment(i + 2, chunk, programDays, payment, i === restChunks.length - 1));
  });

  return buildPlanResult(installments, studentWeeks, payment);
}

function buildPlanResult(installments: PaymentInstallment[], studentWeeks: EducationWeek[], payment: PaymentSettings): PaymentPlan {
  const educationTotal = round2(installments.reduce((s, i) => s + i.finalAmount, 0));
  const extraFeesTotal = round2(
    installments.reduce((s, i) => s + i.appliedExtraFees.reduce((s2, f) => s2 + f.amount, 0), 0)
  );
  return {
    installments,
    totals: {
      educationTotal: round2(educationTotal - extraFeesTotal),
      extraFeesTotal,
      grandTotal: educationTotal,
      currency: payment.currency
    },
    // The student's actual first lesson date (not the containing week's
    // Monday) — matches how each installment's own period range is displayed.
    programStartDate: installments[0]?.lessonDates[0] ?? studentWeeks[0]?.weekStart ?? "",
    programEndDate: calculateProgramEndDate(studentWeeks) ?? "",
    totalActiveWeeks: studentWeeks.length
  };
}

/**
 * Re-applies staff-made manual overrides (amount / due date) from a
 * previously generated plan onto a freshly recalculated one, matched by
 * installment id. Used so that re-running the calculation engine (e.g. after
 * an academic-calendar edit) never silently discards a staff edit.
 */
export function mergeManualOverrides(recalculated: PaymentInstallment[], previous: PaymentInstallment[]): PaymentInstallment[] {
  return recalculated.map((inst) => {
    const prev = previous.find((p) => p.id === inst.id);
    if (!prev) return inst;
    const merged: PaymentInstallment = { ...inst };
    if (prev.isAmountOverridden) {
      merged.finalAmount = prev.finalAmount;
      merged.isAmountOverridden = true;
    }
    if (prev.isDueDateOverridden) {
      merged.finalDueDate = prev.finalDueDate;
      merged.isDueDateOverridden = true;
    }
    return merged;
  });
}

export function generatePaymentPlan(input: GeneratePaymentPlanInput): PaymentPlan {
  const periods = calculateEducationPeriods(input.academicYear);
  const orderedActiveWeeks = [...input.academicYear.weeks].filter((w) => w.isActive).sort((a, b) => a.sequence - b.sequence);

  if (input.enrollment.mode === "new") {
    return generateNewEnrollmentPlan(input.enrollment, periods, orderedActiveWeeks, input.programDays, input.payment);
  }
  return generateExistingGroupPlan(input.enrollment, periods, orderedActiveWeeks, input.programDays, input.payment);
}

export { getStudentLessonDates };
