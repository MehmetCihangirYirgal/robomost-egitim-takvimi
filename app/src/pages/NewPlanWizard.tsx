import { useMemo, useState } from "react";
import type { AcademicYear } from "../types/calendar";
import type { Enrollment, ParentInfo, PaymentSettings, ProgramInfo, StudentInfo, StudentPlan } from "../types/student";
import { DEFAULT_TERMS_TEXT } from "../types/student";
import { calculateEducationPeriods } from "../services/calendarEngine";
import { generatePaymentPlan, mergeManualOverrides } from "../services/paymentEngine";
import { validatePlanInputs } from "../services/validation";
import { genId, savePlan } from "../services/storage";
import { StudentForm } from "../components/forms/StudentForm";
import { ProgramForm } from "../components/forms/ProgramForm";
import { EnrollmentForm } from "../components/forms/EnrollmentForm";
import { PaymentSettingsForm } from "../components/forms/PaymentSettingsForm";
import { PaymentPlanTable } from "../components/plan/PaymentPlanTable";
import { PrintDocument } from "../components/document/PrintDocument";
import { Button, Card, TextArea } from "../components/common/ui";

interface Props {
  academicYears: AcademicYear[];
  initialPlan?: StudentPlan;
  onSaved: (plan: StudentPlan) => void;
  onCancel: () => void;
}

function buildDefaultPlan(academicYears: AcademicYear[]): StudentPlan {
  const year = academicYears[0];
  const periods = year ? calculateEducationPeriods(year) : [];
  const now = new Date().toISOString();
  return {
    id: genId("plan"),
    createdAt: now,
    updatedAt: now,
    parent: { firstName: "", lastName: "" },
    student: { firstName: "", lastName: "" },
    program: {
      programName: "",
      programDays: ["Cumartesi"],
      lessonStartTime: "14:00",
      lessonEndTime: "15:20",
      weeklyDurationMinutes: 80
    },
    enrollment: {
      mode: "new",
      academicYearId: year?.id ?? "",
      startPeriodId: periods[0]?.id ?? "",
      programLength: { unit: "weeks", value: 12 }
    },
    payment: {
      useCustomPaymentPlan: false,
      currency: "TRY",
      fullEducationMonthPrice: 6000,
      extraFees: []
    },
    document: { termsText: DEFAULT_TERMS_TEXT }
  };
}

export function NewPlanWizard({ academicYears, initialPlan, onSaved, onCancel }: Props) {
  const [plan, setPlan] = useState<StudentPlan>(initialPlan ?? buildDefaultPlan(academicYears));
  const [showPreview, setShowPreview] = useState(!!initialPlan?.generatedPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const periodsByYear = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateEducationPeriods>> = {};
    for (const y of academicYears) map[y.id] = calculateEducationPeriods(y);
    return map;
  }, [academicYears]);

  const selectedYear = academicYears.find((y) => y.id === plan.enrollment.academicYearId) ?? academicYears[0];

  function setParent(parent: ParentInfo) {
    setPlan((p) => ({ ...p, parent }));
  }
  function setStudent(student: StudentInfo) {
    setPlan((p) => ({ ...p, student }));
  }
  function setProgram(program: ProgramInfo) {
    setPlan((p) => ({ ...p, program }));
  }
  function setEnrollment(enrollment: Enrollment) {
    setPlan((p) => ({ ...p, enrollment }));
  }
  function setPayment(payment: PaymentSettings) {
    setPlan((p) => ({ ...p, payment }));
  }

  function validationErrorMap() {
    const issues = validatePlanInputs({
      parent: plan.parent,
      student: plan.student,
      program: plan.program,
      enrollment: plan.enrollment,
      payment: plan.payment,
      academicYear: selectedYear
    });
    const map: Record<string, string> = {};
    for (const issue of issues) map[issue.field] = issue.message;
    return map;
  }

  function handleGenerate() {
    const map = validationErrorMap();
    setErrors(map);
    if (Object.keys(map).length > 0 || !selectedYear) return;

    const generated = generatePaymentPlan({
      academicYear: selectedYear,
      programDays: plan.program.programDays,
      enrollment: plan.enrollment,
      payment: plan.payment
    });

    const merged = plan.generatedPlan
      ? { ...generated, installments: mergeManualOverrides(generated.installments, plan.generatedPlan.installments) }
      : generated;

    setPlan((p) => ({ ...p, generatedPlan: merged, updatedAt: new Date().toISOString() }));
    setShowPreview(false);
  }

  function handleSaveAndPreview() {
    if (!plan.generatedPlan) return;
    const toSave = { ...plan, updatedAt: new Date().toISOString() };
    savePlan(toSave);
    setPlan(toSave);
    setShowPreview(true);
    onSaved(toSave);
  }

  if (showPreview && plan.generatedPlan && selectedYear) {
    return (
      <div>
        <div className="no-print sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between mb-6">
          <div className="text-sm text-slate-600">
            Belge Önizleme —{" "}
            <span className="font-medium text-slate-800">
              {plan.student.firstName} {plan.student.lastName}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              ✎ Düzenle
            </Button>
            <Button onClick={() => window.print()}>🖨 PDF / Yazdır</Button>
          </div>
        </div>
        <PrintDocument plan={plan} academicYear={selectedYear} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Yeni Eğitim ve Ödeme Planı</h2>
        <Button variant="ghost" onClick={onCancel}>
          ← Listeye Dön
        </Button>
      </div>

      <StudentForm parent={plan.parent} student={plan.student} onParentChange={setParent} onStudentChange={setStudent} errors={errors} />
      <ProgramForm program={plan.program} onChange={setProgram} errors={errors} />
      <EnrollmentForm
        academicYears={academicYears}
        periodsByYear={periodsByYear}
        enrollment={plan.enrollment}
        onChange={setEnrollment}
        errors={errors}
      />
      <PaymentSettingsForm payment={plan.payment} onChange={setPayment} errors={errors} />

      <Card title="Ödeme Şartı Metni (belge altında gösterilir, düzenlenebilir)">
        <TextArea
          rows={3}
          value={plan.document.termsText}
          onChange={(e) => setPlan((p) => ({ ...p, document: { termsText: e.target.value } }))}
        />
      </Card>

      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md p-3">
          {Object.values(errors).map((msg, i) => (
            <div key={i}>• {msg}</div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleGenerate}>Ödeme Planı Oluştur →</Button>
      </div>

      {plan.generatedPlan && (
        <>
          <PaymentPlanTable
            plan={plan.generatedPlan}
            currency={plan.payment.currency}
            onChange={(generatedPlan) => setPlan((p) => ({ ...p, generatedPlan }))}
            onRegenerate={handleGenerate}
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveAndPreview}>Belge Önizleme →</Button>
          </div>
        </>
      )}
    </div>
  );
}
