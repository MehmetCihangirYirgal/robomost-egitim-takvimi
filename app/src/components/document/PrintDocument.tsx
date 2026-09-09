import type { AcademicYear, EducationPeriod } from "../../types/calendar";
import type { StudentPlan } from "../../types/student";
import { calculateEducationPeriods } from "../../services/calendarEngine";
import { compareISO, formatCurrency, formatLong, formatShort } from "../../services/dateUtils";
import { GraphicCalendar } from "./GraphicCalendar";
import { SignatureSection } from "./SignatureSection";

interface Props {
  plan: StudentPlan;
  academicYear: AcademicYear;
}

function relevantPeriods(academicYear: AcademicYear, startDate: string, endDate: string): EducationPeriod[] {
  const periods = calculateEducationPeriods(academicYear);
  return periods.filter((p) => compareISO(p.startDate, endDate) <= 0 && compareISO(p.endDate, startDate) >= 0);
}

function CopyPage({ plan, academicYear, copyLabel }: Props & { copyLabel: "VELİ NÜSHASI" | "ROBOMOST NÜSHASI" }) {
  const generated = plan.generatedPlan;
  if (!generated) return null;

  const periods = relevantPeriods(academicYear, generated.programStartDate, generated.programEndDate);
  const studentLessonDates = new Set(generated.installments.flatMap((i) => i.lessonDates));
  const isPartial = plan.enrollment.mode === "existing-group";

  return (
    <div className="a4-page">
      <div className="copy-watermark">{copyLabel}</div>

      <div className="flex items-baseline justify-between border-b-2 border-robomost-600 pb-3 mb-4">
        <div>
          <div className="text-robomost-700 font-extrabold text-lg tracking-tight">ROBOMOST</div>
          <div className="text-[11px] text-slate-500">{academicYear.label} Eğitim ve Ödeme Planı</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-800">{academicYear.label}</div>
          <div className="text-xs font-semibold text-robomost-700 tracking-wide">EĞİTİM VE ÖDEME PLANI</div>
          <div className="text-[10px] text-slate-400">Öğrenciye Özel Eğitim Takvimi</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] mb-4 bg-slate-50 rounded-lg p-3">
        <div>
          <span className="text-slate-500">Veli Ad Soyad: </span>
          <span className="font-medium text-slate-800">
            {plan.parent.firstName} {plan.parent.lastName}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Öğrenci Ad Soyad: </span>
          <span className="font-medium text-slate-800">
            {plan.student.firstName} {plan.student.lastName}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Program: </span>
          <span className="font-medium text-slate-800">{plan.program.programName}</span>
        </div>
        <div>
          <span className="text-slate-500">Program Günü: </span>
          <span className="font-medium text-slate-800">{plan.program.programDays.join(" / ")}</span>
        </div>
        <div>
          <span className="text-slate-500">Program Saati: </span>
          <span className="font-medium text-slate-800">
            {plan.program.lessonStartTime} – {plan.program.lessonEndTime}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Haftalık Eğitim Süresi: </span>
          <span className="font-medium text-slate-800">{plan.program.weeklyDurationMinutes} dakika</span>
        </div>
        <div>
          <span className="text-slate-500">Program Süresi: </span>
          <span className="font-medium text-slate-800">{generated.totalActiveWeeks} aktif eğitim haftası</span>
        </div>
        <div>
          <span className="text-slate-500">Eğitim Tarihleri: </span>
          <span className="font-medium text-slate-800">
            {formatShort(generated.programStartDate)} – {formatShort(generated.programEndDate)}
          </span>
        </div>
      </div>

      {isPartial && (
        <div className="mb-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
          Öğrenci mevcut eğitim grubuna sonradan dahil olmuştur. İlk ödeme dönemi, öğrencinin gerçekten katılacağı
          aktif eğitim haftası sayısına göre oranlanmıştır.
        </div>
      )}

      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Eğitim Takvimi</div>
        <GraphicCalendar periods={periods} programDays={plan.program.programDays} studentLessonDates={studentLessonDates} />
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Ödeme Planı</div>
        <table className="w-full text-[11px] plan-table border-collapse">
          <thead>
            <tr className="text-left border-b border-slate-300 text-slate-500">
              <th className="py-1 pr-2">Taksit</th>
              <th className="py-1 pr-2">Eğitim Dönemi</th>
              <th className="py-1 pr-2">Ders Sayısı</th>
              <th className="py-1 pr-2">Ödeme Son Tarihi</th>
              <th className="py-1 pr-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {generated.installments.map((inst) => (
              <tr key={inst.id} className="border-b border-slate-100">
                <td className="py-1 pr-2 align-top">
                  {inst.installmentNumber}
                  {inst.isPartialPeriod && (
                    <div className="text-[9px] text-amber-600 font-medium">Kısmi Eğitim Dönemi</div>
                  )}
                </td>
                <td className="py-1 pr-2 align-top">{inst.periodLabel}</td>
                <td className="py-1 pr-2 align-top">{inst.activeWeekCount} Eğitim Haftası</td>
                <td className="py-1 pr-2 align-top">{formatLong(inst.finalDueDate)}</td>
                <td className="py-1 pr-2 align-top text-right font-medium">
                  {formatCurrency(inst.finalAmount, generated.totals.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-2">
          <div className="w-56 text-[11px] space-y-0.5">
            <div className="flex justify-between text-slate-500">
              <span>Eğitim Bedeli</span>
              <span>{formatCurrency(generated.totals.educationTotal, generated.totals.currency)}</span>
            </div>
            {generated.totals.extraFeesTotal > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Ek Ücretler</span>
                <span>{formatCurrency(generated.totals.extraFeesTotal, generated.totals.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-300 pt-0.5">
              <span>Genel Toplam</span>
              <span>{formatCurrency(generated.totals.grandTotal, generated.totals.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 bg-slate-50 rounded-md p-2.5 leading-relaxed avoid-break">
        {plan.document.termsText}
      </div>

      <SignatureSection />
    </div>
  );
}

export function PrintDocument({ plan, academicYear }: Props) {
  return (
    <div id="print-root">
      <CopyPage plan={plan} academicYear={academicYear} copyLabel="VELİ NÜSHASI" />
      <CopyPage plan={plan} academicYear={academicYear} copyLabel="ROBOMOST NÜSHASI" />
    </div>
  );
}
