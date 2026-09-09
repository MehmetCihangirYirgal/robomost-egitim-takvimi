import type { AcademicYear } from "../types/calendar";
import type { StudentPlan } from "../types/student";
import { formatLong } from "../services/dateUtils";
import { Button, Card } from "../components/common/ui";

interface Props {
  plans: StudentPlan[];
  academicYears: AcademicYear[];
  onOpen: (plan: StudentPlan) => void;
  onPrint: (plan: StudentPlan) => void;
  onDuplicate: (plan: StudentPlan) => void;
  onDelete: (plan: StudentPlan) => void;
  onNew: () => void;
}

function nextPaymentDate(plan: StudentPlan): string {
  if (!plan.generatedPlan) return "—";
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = plan.generatedPlan.installments.find((i) => i.finalDueDate >= today);
  const target = upcoming ?? plan.generatedPlan.installments[plan.generatedPlan.installments.length - 1];
  return target ? formatLong(target.finalDueDate) : "—";
}

export function SavedPlansPage({ plans, onOpen, onPrint, onDuplicate, onDelete, onNew }: Props) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Kayıtlı Planlar</h2>
        <Button onClick={onNew}>+ Yeni Plan Oluştur</Button>
      </div>

      <Card>
        {plans.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Henüz kayıtlı bir plan yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">Öğrenci</th>
                <th className="py-2 pr-2">Veli</th>
                <th className="py-2 pr-2">Program</th>
                <th className="py-2 pr-2">Başlangıç</th>
                <th className="py-2 pr-2">Bitiş</th>
                <th className="py-2 pr-2">Sonraki Ödeme</th>
                <th className="py-2 pr-2 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-medium text-slate-800">
                    {plan.student.firstName} {plan.student.lastName}
                  </td>
                  <td className="py-2 pr-2 text-slate-600">
                    {plan.parent.firstName} {plan.parent.lastName}
                  </td>
                  <td className="py-2 pr-2 text-slate-600">{plan.program.programName || "—"}</td>
                  <td className="py-2 pr-2 text-slate-600">
                    {plan.generatedPlan ? formatLong(plan.generatedPlan.programStartDate) : "—"}
                  </td>
                  <td className="py-2 pr-2 text-slate-600">
                    {plan.generatedPlan ? formatLong(plan.generatedPlan.programEndDate) : "—"}
                  </td>
                  <td className="py-2 pr-2 text-slate-600">{nextPaymentDate(plan)}</td>
                  <td className="py-2 pr-2">
                    <div className="flex justify-end gap-1 text-xs">
                      <button className="text-robomost-700 hover:underline" onClick={() => onOpen(plan)}>
                        Görüntüle/Düzenle
                      </button>
                      <span className="text-slate-300">|</span>
                      <button className="text-robomost-700 hover:underline" onClick={() => onPrint(plan)}>
                        Yazdır
                      </button>
                      <span className="text-slate-300">|</span>
                      <button className="text-robomost-700 hover:underline" onClick={() => onDuplicate(plan)}>
                        Kopyala
                      </button>
                      <span className="text-slate-300">|</span>
                      <button className="text-rose-500 hover:underline" onClick={() => onDelete(plan)}>
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
