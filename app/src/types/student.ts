import type { Weekday } from "./calendar";

export interface ParentInfo {
  firstName: string;
  lastName: string;
}

export interface StudentInfo {
  firstName: string;
  lastName: string;
}

export interface ProgramInfo {
  programName: string;
  programDays: Weekday[]; // one or more lesson days per week
  lessonStartTime: string; // "14:00"
  lessonEndTime: string; // "15:20"
  weeklyDurationMinutes: number; // 80 / 120 / 160 ...
}

/** How the student's participation is anchored on the academic calendar. */
export type EnrollmentMode = "new" | "existing-group";

export type ProgramLengthUnit = "weeks" | "months";

export interface ProgramLength {
  unit: ProgramLengthUnit;
  /** number of active education weeks (unit=weeks) or education-ayı count (unit=months) */
  value: number;
}

export type ProgramEndRule =
  /** Student finishes exactly when the group's own program finishes. */
  | "with-group"
  /** Student keeps receiving lessons until they've received the education weeks they purchased. */
  | "own-length"
  /** Staff sets an explicit end date / active-week count manually. */
  | "manual";

export interface NewEnrollment {
  mode: "new";
  academicYearId: string;
  /** id of the first EducationPeriod (Eğitim Ayı) the student starts in. */
  startPeriodId: string;
  programLength: ProgramLength;
}

export interface ExistingGroupEnrollment {
  mode: "existing-group";
  academicYearId: string;
  /** Program start date of the *group* the student is joining (ISO date). */
  groupStartDate: string;
  /** Total program length of the group (in active education weeks). */
  groupProgramLengthWeeks: number;
  /** The date the student officially enrolled / registered (ISO date). */
  enrollmentDate: string;
  /**
   * The student's first actual lesson date (ISO date). If omitted, it is
   * derived as the first active lesson date on/after enrollmentDate that
   * matches the selected program day(s).
   */
  firstLessonDateOverride?: string;
  programEndRule: ProgramEndRule;
  /** Only used when programEndRule = "own-length". */
  ownLengthActiveWeeks?: number;
  /** Only used when programEndRule = "manual". */
  manualEndDate?: string;
  manualEndActiveWeeks?: number;
}

export type Enrollment = NewEnrollment | ExistingGroupEnrollment;

export type ExtraFeeAppliesTo = "first-installment" | "last-installment" | "all-installments" | "specific";

export interface ExtraFee {
  id: string;
  label: string; // "Eğitim seti ücreti"
  amount: number;
  appliesTo: ExtraFeeAppliesTo;
  /** installment numbers (1-based) when appliesTo = "specific" */
  specificInstallments?: number[];
}

export type CustomPaymentDayMode = "fixed-day-of-month" | "manual";

export interface PaymentSettings {
  useCustomPaymentPlan: boolean;
  customMode?: CustomPaymentDayMode;
  /** Day of month (1-28) used when customMode = "fixed-day-of-month". */
  fixedDayOfMonth?: number;
  currency: string; // "TRY"
  fullEducationMonthPrice: number; // 4-week price
  extraFees: ExtraFee[];
}

export interface PaymentInstallment {
  id: string;
  installmentNumber: number;
  periodLabel: string; // "12 Eylül – 4 Ekim 2026"
  lessonDates: string[]; // ISO dates, the ones actually billed in this installment
  activeWeekCount: number;
  isPartialPeriod: boolean;

  calculatedDueDate: string; // ISO date, engine output
  finalDueDate: string; // ISO date, possibly staff-edited
  isDueDateOverridden: boolean;

  calculatedAmount: number;
  finalAmount: number;
  isAmountOverridden: boolean;
  appliedExtraFees: { label: string; amount: number }[];

  description?: string;
  isManuallyAdded?: boolean;
}

export interface PaymentPlanTotals {
  educationTotal: number;
  extraFeesTotal: number;
  grandTotal: number;
  currency: string;
}

export interface PaymentPlan {
  installments: PaymentInstallment[];
  totals: PaymentPlanTotals;
  programStartDate: string;
  programEndDate: string;
  totalActiveWeeks: number;
}

export interface DocumentSettings {
  termsText: string;
}

export interface StudentPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  parent: ParentInfo;
  student: StudentInfo;
  program: ProgramInfo;
  enrollment: Enrollment;
  payment: PaymentSettings;
  document: DocumentSettings;
  /** The generated (and possibly staff-edited) plan. Present once "Ödeme Planı Oluştur" runs. */
  generatedPlan?: PaymentPlan;
}

export const DEFAULT_TERMS_TEXT =
  "Her eğitim ayı 4 aktif eğitim haftasından oluşur. Resmî tatiller ve eğitim yapılmayan tarihler eğitim haftası hesabına dahil edilmez. Özel bir ödeme tarihi kararlaştırılmamışsa ilgili eğitim ayına ait ödemenin eğitim ayı başlamadan önce tamamlanması gerekmektedir.";
