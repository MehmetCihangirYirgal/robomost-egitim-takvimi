import type { AcademicYear, EducationPeriod } from "../../types/calendar";
import type { Enrollment, ExistingGroupEnrollment, NewEnrollment, ProgramEndRule } from "../../types/student";
import { Card, Field, NumberInput, Select, TextInput } from "../common/ui";
import { formatRange } from "../../services/dateUtils";

const WEEK_OPTIONS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];

interface Props {
  academicYears: AcademicYear[];
  periodsByYear: Record<string, EducationPeriod[]>;
  enrollment: Enrollment;
  onChange: (e: Enrollment) => void;
  errors: Record<string, string>;
}

export function EnrollmentForm({ academicYears, periodsByYear, enrollment, onChange, errors }: Props) {
  const periods = periodsByYear[enrollment.academicYearId] ?? [];

  function setMode(mode: "new" | "existing-group") {
    if (mode === enrollment.mode) return;
    if (mode === "new") {
      const next: NewEnrollment = {
        mode: "new",
        academicYearId: enrollment.academicYearId,
        startPeriodId: periods[0]?.id ?? "",
        programLength: { unit: "weeks", value: 12 }
      };
      onChange(next);
    } else {
      const next: ExistingGroupEnrollment = {
        mode: "existing-group",
        academicYearId: enrollment.academicYearId,
        groupStartDate: periods[0]?.startDate ?? "",
        groupProgramLengthWeeks: 12,
        enrollmentDate: "",
        programEndRule: "with-group"
      };
      onChange(next);
    }
  }

  return (
    <Card title="Kayıt Türü ve Akademik Takvim">
      <div className="space-y-4">
        <Field label="Akademik Yıl" required error={errors.academicYearId}>
          <Select
            value={enrollment.academicYearId}
            onChange={(e) => onChange({ ...enrollment, academicYearId: e.target.value } as Enrollment)}
          >
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Kayıt Türü">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`flex-1 text-sm rounded-md border px-3 py-2 text-left transition-colors ${
                enrollment.mode === "new"
                  ? "border-robomost-500 bg-robomost-50 text-robomost-800"
                  : "border-slate-300 text-slate-600 hover:border-robomost-300"
              }`}
            >
              <div className="font-medium">Yeni Program</div>
              <div className="text-xs opacity-70">Öğrenci programın başından başlar</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("existing-group")}
              className={`flex-1 text-sm rounded-md border px-3 py-2 text-left transition-colors ${
                enrollment.mode === "existing-group"
                  ? "border-robomost-500 bg-robomost-50 text-robomost-800"
                  : "border-slate-300 text-slate-600 hover:border-robomost-300"
              }`}
            >
              <div className="font-medium">Mevcut Gruba Dahil Et</div>
              <div className="text-xs opacity-70">Öğrenci başlamış bir gruba sonradan katılır</div>
            </button>
          </div>
        </Field>

        {enrollment.mode === "new" ? (
          <NewEnrollmentFields
            enrollment={enrollment}
            periods={periods}
            onChange={onChange}
            errors={errors}
          />
        ) : (
          <ExistingGroupFields
            enrollment={enrollment}
            periods={periods}
            onChange={onChange}
            errors={errors}
          />
        )}
      </div>
    </Card>
  );
}

function NewEnrollmentFields({
  enrollment,
  periods,
  onChange,
  errors
}: {
  enrollment: NewEnrollment;
  periods: EducationPeriod[];
  onChange: (e: Enrollment) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100">
      <Field label="Başlangıç Eğitim Ayı" required error={errors.startPeriodId}>
        <Select
          value={enrollment.startPeriodId}
          onChange={(e) => onChange({ ...enrollment, startPeriodId: e.target.value })}
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({formatRange(p.startDate, p.endDate)})
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Program Süresi" required error={errors.programLength}>
        <div className="flex gap-2">
          <Select
            value={enrollment.programLength.unit}
            onChange={(e) =>
              onChange({
                ...enrollment,
                programLength: { unit: e.target.value as "weeks" | "months", value: e.target.value === "months" ? 3 : 12 }
              })
            }
            className="w-32"
          >
            <option value="weeks">Hafta</option>
            <option value="months">Eğitim Ayı</option>
          </Select>
          {enrollment.programLength.unit === "weeks" ? (
            <Select
              value={enrollment.programLength.value}
              onChange={(e) => onChange({ ...enrollment, programLength: { unit: "weeks", value: Number(e.target.value) } })}
            >
              {WEEK_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w} hafta
                </option>
              ))}
            </Select>
          ) : (
            <Select
              value={enrollment.programLength.value}
              onChange={(e) => onChange({ ...enrollment, programLength: { unit: "months", value: Number(e.target.value) } })}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m} Eğitim Ayı
                </option>
              ))}
            </Select>
          )}
        </div>
      </Field>
    </div>
  );
}

const END_RULE_LABEL: Record<ProgramEndRule, string> = {
  "with-group": "Mevcut grubun bittiği tarihte öğrenci de programı tamamlar",
  "own-length": "Öğrenci kendi satın aldığı eğitim haftası kadar eğitim almaya devam eder",
  manual: "Manuel bitiş tarihi / eğitim haftası belirle"
};

function ExistingGroupFields({
  enrollment,
  periods,
  onChange,
  errors
}: {
  enrollment: ExistingGroupEnrollment;
  periods: EducationPeriod[];
  onChange: (e: Enrollment) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100">
      <Field label="Grubun Program Başlangıç Tarihi" required error={errors.groupStartDate}>
        <TextInput
          type="date"
          value={enrollment.groupStartDate}
          onChange={(e) => onChange({ ...enrollment, groupStartDate: e.target.value })}
        />
      </Field>
      <Field label="Grubun Program Süresi (hafta)" required error={errors.groupProgramLengthWeeks}>
        <NumberInput
          min={1}
          value={enrollment.groupProgramLengthWeeks}
          onChange={(e) => onChange({ ...enrollment, groupProgramLengthWeeks: Number(e.target.value) })}
        />
      </Field>
      <Field label="Öğrencinin Gruba Katılım Tarihi" required error={errors.enrollmentDate}>
        <TextInput
          type="date"
          value={enrollment.enrollmentDate}
          onChange={(e) => onChange({ ...enrollment, enrollmentDate: e.target.value })}
        />
      </Field>
      <Field label="İlk Ders Tarihi (opsiyonel — boşsa otomatik bulunur)">
        <TextInput
          type="date"
          value={enrollment.firstLessonDateOverride ?? ""}
          onChange={(e) => onChange({ ...enrollment, firstLessonDateOverride: e.target.value || undefined })}
        />
      </Field>

      <div className="col-span-2">
        <Field label="Program Bitiş Kuralı">
          <div className="space-y-1.5">
            {(Object.keys(END_RULE_LABEL) as ProgramEndRule[]).map((rule) => (
              <label key={rule} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  className="mt-0.5"
                  checked={enrollment.programEndRule === rule}
                  onChange={() => onChange({ ...enrollment, programEndRule: rule })}
                />
                {END_RULE_LABEL[rule]}
              </label>
            ))}
          </div>
        </Field>
      </div>

      {enrollment.programEndRule === "own-length" && (
        <Field label="Öğrencinin Alacağı Toplam Aktif Hafta">
          <NumberInput
            min={1}
            value={enrollment.ownLengthActiveWeeks ?? ""}
            onChange={(e) => onChange({ ...enrollment, ownLengthActiveWeeks: Number(e.target.value) })}
          />
        </Field>
      )}

      {enrollment.programEndRule === "manual" && (
        <>
          <Field label="Manuel Bitiş Tarihi">
            <TextInput
              type="date"
              value={enrollment.manualEndDate ?? ""}
              onChange={(e) => onChange({ ...enrollment, manualEndDate: e.target.value || undefined })}
            />
          </Field>
          <Field label="veya Manuel Toplam Aktif Hafta">
            <NumberInput
              min={1}
              value={enrollment.manualEndActiveWeeks ?? ""}
              onChange={(e) => onChange({ ...enrollment, manualEndActiveWeeks: Number(e.target.value) || undefined })}
            />
          </Field>
        </>
      )}

      <div className="col-span-2 text-xs text-slate-500 bg-slate-50 rounded-md p-2.5">
        Sistem, öğrencinin katılım tarihinden sonraki ilk aktif ders tarihini otomatik bulur ve kalan aktif eğitim
        haftasına göre ilk (kısmi) dönem ücretini oranlar. Grubun ait olduğu eğitim ayı için gösterilen dönemler:{" "}
        {periods.length > 0 ? periods.map((p) => p.label).join(", ") : "—"}
      </div>
    </div>
  );
}
