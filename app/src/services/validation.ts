import type { AcademicYear } from "../types/calendar";
import type { Enrollment, ParentInfo, PaymentSettings, ProgramInfo, StudentInfo } from "../types/student";
import { calculateEducationPeriods } from "./calendarEngine";

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validatePlanInputs(args: {
  parent: ParentInfo;
  student: StudentInfo;
  program: ProgramInfo;
  enrollment: Enrollment;
  payment: PaymentSettings;
  academicYear?: AcademicYear;
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { parent, student, program, enrollment, payment, academicYear } = args;

  if (!parent.firstName.trim() || !parent.lastName.trim()) {
    issues.push({ field: "parent", message: "Veli adı ve soyadı boş bırakılamaz." });
  }
  if (!student.firstName.trim() || !student.lastName.trim()) {
    issues.push({ field: "student", message: "Öğrenci adı ve soyadı boş bırakılamaz." });
  }
  if (!program.programName.trim()) {
    issues.push({ field: "programName", message: "Program seçilmelidir." });
  }
  if (!program.programDays || program.programDays.length === 0) {
    issues.push({ field: "programDays", message: "Program günü seçilmelidir." });
  }
  if (payment.fullEducationMonthPrice < 0) {
    issues.push({ field: "fullEducationMonthPrice", message: "Ücret negatif olamaz." });
  }
  for (const fee of payment.extraFees) {
    if (fee.amount < 0) {
      issues.push({ field: `extraFee-${fee.id}`, message: `${fee.label || "Ek ücret"} negatif olamaz.` });
    }
  }

  if (enrollment.mode === "new") {
    if (!enrollment.academicYearId) {
      issues.push({ field: "academicYearId", message: "Akademik yıl seçilmelidir." });
    }
    if (!enrollment.startPeriodId) {
      issues.push({ field: "startPeriodId", message: "Başlangıç dönemi seçilmelidir." });
    }
    if (!enrollment.programLength || enrollment.programLength.value <= 0) {
      issues.push({ field: "programLength", message: "Program süresi belirtilmelidir." });
    }

    if (academicYear && enrollment.startPeriodId && enrollment.programLength?.value > 0) {
      const periods = calculateEducationPeriods(academicYear);
      const startPeriod = periods.find((p) => p.id === enrollment.startPeriodId);
      const totalWeeks =
        enrollment.programLength.unit === "months" ? enrollment.programLength.value * 4 : enrollment.programLength.value;
      if (startPeriod) {
        const allActive = academicYear.weeks.filter((w) => w.isActive).sort((a, b) => a.sequence - b.sequence);
        const startSeq = startPeriod.activeWeeks[0]?.sequence ?? Infinity;
        const available = allActive.filter((w) => w.sequence >= startSeq).length;
        if (available < totalWeeks) {
          issues.push({
            field: "programLength",
            message: `Seçilen ${totalWeeks} haftalık program mevcut akademik takvim içerisinde tamamlanamıyor.`
          });
        }
      }
    }
  } else {
    if (!enrollment.academicYearId) {
      issues.push({ field: "academicYearId", message: "Akademik yıl seçilmelidir." });
    }
    if (!enrollment.groupStartDate) {
      issues.push({ field: "groupStartDate", message: "Mevcut grubun program başlangıç tarihi belirtilmelidir." });
    }
    if (!enrollment.enrollmentDate) {
      issues.push({ field: "enrollmentDate", message: "Öğrencinin gruba katılım tarihi belirtilmelidir." });
    }
    if (!enrollment.groupProgramLengthWeeks || enrollment.groupProgramLengthWeeks <= 0) {
      issues.push({ field: "groupProgramLengthWeeks", message: "Grubun program süresi belirtilmelidir." });
    }
  }

  if (payment.useCustomPaymentPlan && payment.customMode === "fixed-day-of-month") {
    if (!payment.fixedDayOfMonth || payment.fixedDayOfMonth < 1 || payment.fixedDayOfMonth > 28) {
      issues.push({ field: "fixedDayOfMonth", message: "Sabit ödeme günü 1-28 arasında olmalıdır." });
    }
  }

  return issues;
}
